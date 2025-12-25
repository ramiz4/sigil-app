import { inject, Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Account, StorageService } from './storage.service';
import { TotpService } from './totp.service';

interface BackupData {
  v: number; // version
  salt: string; // base64
  iv: string; // base64
  data: string; // base64 (encrypted json)
}

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private storage = inject(StorageService);
  private totp = inject(TotpService);

  /**
   * Export all accounts as an encrypted JSON string
   */
  async exportBackup(password: string): Promise<void> {
    const accounts = await this.storage.getAccounts();
    const plainText = JSON.stringify(accounts);

    // 1. Generate Salt and derive Key
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const key = await this.deriveKey(password, salt);

    // 2. Encrypt
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bits for AES-GCM
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plainText);

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encodedData,
    );

    // 3. Package
    const backup: BackupData = {
      v: 1,
      salt: this.bufferToBase64(salt),
      iv: this.bufferToBase64(iv),
      data: this.bufferToBase64(encryptedContent),
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    this.downloadFile(blob, `sigil-backup-${new Date().toISOString().split('T')[0]}.json`);
  }

  /**
   * Import accounts from an encrypted JSON file
   */
  async importBackup(file: File, password: string): Promise<{ restored: number; skipped: number }> {
    const text = await file.text();
    let backup: BackupData;
    try {
      backup = JSON.parse(text);
    } catch {
      throw new Error('Invalid backup file format');
    }

    if (backup.v !== 1) {
      throw new Error(`Unsupported backup version: ${backup.v}`);
    }

    // 1. Derive Key
    const salt = this.base64ToUint8Array(backup.salt);
    const key = await this.deriveKey(password, salt);

    // 2. Decrypt
    const iv = this.base64ToUint8Array(backup.iv);
    const encryptedData = this.base64ToUint8Array(backup.data);

    let decryptedBuffer: ArrayBuffer;
    try {
      decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          iv: iv as any,
        },
        key,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        encryptedData as any,
      );
    } catch {
      throw new Error('Incorrect password or corrupted file');
    }

    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedBuffer);
    const accounts: Account[] = JSON.parse(jsonString);

    if (!Array.isArray(accounts)) {
      throw new Error('Decrypted data is not a list of accounts');
    }

    return this.restoreAccounts(accounts);
  }

  /**
   * Export all accounts as a PDF with QR codes
   */
  async exportPdf(): Promise<void> {
    const accounts = await this.storage.getAccounts();
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const qrSize = 50;
    const itemsPerRow = 2;
    const itemWidth = (pageWidth - margin * 2) / itemsPerRow;
    const itemHeight = 70;

    doc.setFontSize(22);
    doc.text('Sigil Authenticator Backup', margin, margin);
    doc.setFontSize(10);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, margin + 8);
    doc.text('Keep this document in a safe physical location.', margin, margin + 13);

    let x = margin;
    let y = margin + 25;

    for (let i = 0; i < accounts.length; i++) {
      const acc = accounts[i];
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(acc.issuer)}:${encodeURIComponent(
        acc.label,
      )}?secret=${acc.secret}&issuer=${encodeURIComponent(acc.issuer)}&digits=${
        acc.digits || 6
      }&period=${acc.period || 30}&algorithm=${acc.algorithm || 'SHA1'}`;

      const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
        margin: 1,
        width: 200,
      });

      // Check if we need a new page
      if (y + itemHeight > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }

      // Draw Account Info
      doc.addImage(qrDataUrl, 'PNG', x + (itemWidth - qrSize) / 2, y, qrSize, qrSize);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const issuerLabel = acc.issuer;
      doc.text(issuerLabel, x + itemWidth / 2, y + qrSize + 5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const labelText = acc.label;
      doc.text(labelText, x + itemWidth / 2, y + qrSize + 9, { align: 'center' });

      // Move to next position
      if ((i + 1) % itemsPerRow === 0) {
        x = margin;
        y += itemHeight;
      } else {
        x += itemWidth;
      }
    }

    doc.save(`sigil-backup-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  /**
   * Export all accounts as a CSV file
   */
  async exportCsv(): Promise<void> {
    const accounts = await this.storage.getAccounts();
    const header = 'issuer,label,secret,type,algorithm,digits,period,folder\n';
    const rows = accounts
      .map((acc) => {
        return [
          this.escapeCsv(acc.issuer || ''),
          this.escapeCsv(acc.label || ''),
          acc.secret,
          acc.type || 'totp',
          acc.algorithm || 'SHA1',
          acc.digits || 6,
          acc.period || 30,
          this.escapeCsv(acc.folder || ''),
        ].join(',');
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    this.downloadFile(blob, `sigil-export-${new Date().toISOString().split('T')[0]}.csv`);
  }

  /**
   * Import accounts from a CSV file
   */
  async importCsv(file: File): Promise<{ restored: number; skipped: number }> {
    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return { restored: 0, skipped: 0 };

    const accounts: Partial<Account>[] = [];
    const header = lines[0].toLowerCase().split(',');

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      const acc: Partial<Account> = {};
      header.forEach((h, index) => {
        const val = values[index];
        if (h === 'digits' || h === 'period') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc as any)[h] = parseInt(val, 10);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (acc as any)[h] = val;
        }
      });
      if (acc.secret) {
        accounts.push(acc);
      }
    }

    return this.restoreAccounts(accounts as Account[]);
  }

  /**
   * Import from Microsoft Authenticator (or any compatible JSON)
   */
  async importJson(file: File): Promise<{ restored: number; skipped: number }> {
    const text = await file.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON file');
    }

    let accounts: Partial<Account>[] = [];

    // Microsoft Authenticator usually has a "AuthenticatorAccounts" field
    if (
      data &&
      typeof data === 'object' &&
      'AuthenticatorAccounts' in data &&
      Array.isArray(data.AuthenticatorAccounts)
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accounts = data.AuthenticatorAccounts.map((a: any) => ({
        issuer: a.Issuer || 'Unknown',
        label: a.AccountName || 'Unknown',
        secret: a.SecretKey,
        type: 'totp',
      }));
    } else if (Array.isArray(data)) {
      accounts = data;
    }

    return this.restoreAccounts(accounts as Account[]);
  }

  private async restoreAccounts(
    accounts: Account[],
  ): Promise<{ restored: number; skipped: number }> {
    let restored = 0;
    let skipped = 0;

    const currentAccounts = await this.storage.getAccounts();

    for (const acc of accounts) {
      // Simple duplicate check: issuer + label + secret
      const exists = currentAccounts.find(
        (c) => c.issuer === acc.issuer && c.label === acc.label && c.secret === acc.secret,
      );

      if (!exists) {
        const { id: _, created: __, ...rest } = acc;
        await this.storage.addAccount({
          ...rest,
          type: (rest.type as 'totp' | 'hotp') || 'totp',
        });
        restored++;
      } else {
        skipped++;
      }
    }
    await this.totp.loadAccounts();

    return { restored, skipped };
  }

  private escapeCsv(val: string): string {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  private parseCsvLine(line: string): string[] {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur);
    return result;
  }

  // --- Helpers ---

  private async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey'],
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  }

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    let binary = '';
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes;
  }

  private downloadFile(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
