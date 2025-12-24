import { inject, Injectable } from '@angular/core';
import { Account, StorageService } from './storage.service';

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

    // 3. Restore
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
          type: rest.type || 'totp',
        });
        restored++;
      } else {
        skipped++;
      }
    }

    return { restored, skipped };
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
