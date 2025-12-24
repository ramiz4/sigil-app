import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import QrScanner from 'qr-scanner';
import { DialogService } from '../../services/dialog.service';
import { Account } from '../../services/storage.service';
import { TotpService } from '../../services/totp.service';

type Mode = 'scan' | 'manual' | 'image' | 'paste';

@Component({
  selector: 'app-add-account',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-account.html',
})
export class AddAccount implements OnDestroy, AfterViewInit {
  totp = inject(TotpService);
  router = inject(Router);
  dialog = inject(DialogService);

  mode = signal<Mode>('scan');
  targetFolder = signal('');

  // Manual Form
  manualEntry = {
    issuer: '',
    label: '',
    secret: '',
  };

  // Paste / URL
  pasteContent = '';

  // Scan
  @ViewChild('video') videoElem!: ElementRef<HTMLVideoElement>;
  qrScanner: QrScanner | null = null;
  scanError = '';

  changeMode(m: Mode) {
    this.mode.set(m);
    this.stopScan();
    if (m === 'scan') {
      // Small delay to allow ViewChild to exist
      setTimeout(() => this.startScan(), 100);
    }
  }

  async startScan() {
    this.scanError = '';

    if (!window.isSecureContext) {
      this.scanError =
        'Camera requires a secure connection (HTTPS). Please use HTTPS or localhost to scan.';
      return;
    }

    if (this.videoElem && this.videoElem.nativeElement) {
      try {
        const hasCamera = await QrScanner.hasCamera();
        if (!hasCamera) {
          this.scanError = 'No camera found on this device.';
          return;
        }

        if (this.qrScanner) {
          this.qrScanner.destroy();
        }

        this.qrScanner = new QrScanner(
          this.videoElem.nativeElement,
          (result) => {
            this.handleScanResult(result.data);
            this.stopScan();
          },
          {
            preferredCamera: 'environment',
            highlightScanRegion: true,
            highlightCodeOutline: true,
          },
        );

        await this.qrScanner.start();
      } catch (err: unknown) {
        const error = err as Error;
        this.scanError = 'Camera error: ' + (error.message || String(error));
        console.error(error);
      }
    } else {
      this.scanError = 'Video element not ready';
    }
  }

  stopScan() {
    if (this.qrScanner) {
      this.qrScanner.stop();
      this.qrScanner.destroy();
      this.qrScanner = null;
    }
  }

  ngOnDestroy() {
    this.stopScan();
  }

  ngAfterViewInit() {
    if (this.mode() === 'scan') {
      this.startScan();
    }
  }

  async handleScanResult(text: string) {
    try {
      const parsed = this.totp.parseUrl(text);
      await this.add(parsed);
    } catch (e) {
      console.error(e);
      await this.dialog.alert('Invalid QR Code');
    }
  }

  async addManual() {
    if (!this.manualEntry.secret) return;
    try {
      await this.add({
        issuer: this.manualEntry.issuer,
        label: this.manualEntry.label,
        secret: this.manualEntry.secret,
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
      });
    } catch {
      await this.dialog.alert('Error adding account');
    }
  }

  async processPaste() {
    const lines = this.pasteContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    let added = 0;
    for (const line of lines) {
      try {
        const parsed = this.totp.parseUrl(line);
        await this.add(parsed);
        added++;
      } catch {
        console.warn('Failed to parse line');
      }
    }
    if (added === 0) await this.dialog.alert('No valid URLs found');
    else this.router.navigate(['/']);
  }

  isDragging = signal(false);

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImageFile(files[0]);
    } else if (event.dataTransfer?.items) {
      // Fallback for some environments
      const item = Array.from(event.dataTransfer.items).find((i) => i.kind === 'file');
      const file = item?.getAsFile();
      if (file) {
        this.processImageFile(file);
      }
    }
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.processImageFile(input.files[0]);
  }

  async processImageFile(file: File) {
    try {
      const result = await QrScanner.scanImage(file);
      this.handleScanResult(result);
    } catch (e) {
      console.error('QR Decode error:', e);
      await this.dialog.alert('Could not decode QR from image');
    }
  }

  async add(data: Partial<Account>) {
    if (!data.secret) throw new Error('No secret');
    await this.totp.addAccount({
      issuer: data.issuer || 'Unknown',
      label: data.label || 'Unknown',
      secret: data.secret,
      algorithm: data.algorithm || 'SHA1',
      digits: data.digits || 6,
      period: data.period || 30,
      type: 'totp',
      folder: data.folder || this.targetFolder() || undefined,
    });
    this.router.navigate(['/']);
  }
}
