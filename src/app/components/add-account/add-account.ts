import { Component, ElementRef, ViewChild, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TotpService } from '../../services/totp.service';
import { BrowserQRCodeReader, IScannerControls } from '@zxing/browser';

type Mode = 'scan' | 'manual' | 'image' | 'paste';

@Component({
  selector: 'app-add-account',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './add-account.html',
  styleUrl: './add-account.scss',
})
export class AddAccount implements OnDestroy {
  totp = inject(TotpService);
  router = inject(Router);

  mode = signal<Mode>('scan');

  // Manual Form
  manualEntry = {
    issuer: '',
    label: '',
    secret: ''
  };

  // Paste / URL
  pasteContent = '';

  // Scan
  @ViewChild('video') videoElem!: ElementRef<HTMLVideoElement>;
  codeReader: BrowserQRCodeReader | null = null;
  scanError = '';
  private controls: IScannerControls | undefined;

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

    // Ensure scanner instance
    if (!this.codeReader) {
      this.codeReader = new BrowserQRCodeReader();
    }

    try {
      // Check devices
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (devices.length === 0) {
        this.scanError = 'No camera found';
        return;
      }

      // Request device access implicitly via decodeFromVideoDevice
      if (this.videoElem && this.videoElem.nativeElement) {
        this.controls = await this.codeReader.decodeFromVideoDevice(
          undefined,
          this.videoElem.nativeElement,
          (result, err, controls) => {
            if (result) {
              this.handleScanResult(result.getText());
              controls.stop();
              this.controls = undefined;
            }
          }
        );
      } else {
        this.scanError = 'Video element not ready';
      }
    } catch (err: any) {
      this.scanError = 'Camera error: ' + (err.message || err);
      console.error(err);
    }
  }

  stopScan() {
    if (this.controls) {
      this.controls.stop();
      this.controls = undefined;
    }
  }

  ngOnDestroy() {
    this.stopScan();
  }

  async handleScanResult(text: string) {
    try {
      const parsed = this.totp.parseUrl(text);
      await this.add(parsed);
    } catch (e) {
      console.error(e);
      alert('Invalid QR Code');
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
        period: 30
      });
    } catch (e) {
      alert('Error adding account');
    }
  }

  async processPaste() {
    const lines = this.pasteContent.split('\n').map(l => l.trim()).filter(Boolean);
    let added = 0;
    for (const line of lines) {
      try {
        const parsed = this.totp.parseUrl(line);
        await this.add(parsed);
        added++;
      } catch (e) {
        console.warn('Failed to parse line');
      }
    }
    if (added === 0) alert('No valid URLs found');
    else this.router.navigate(['/']);
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];

    // Create a new reader just for image
    const reader = new BrowserQRCodeReader(); // Helper instance
    try {
      const imageUrl = URL.createObjectURL(file);
      const result = await reader.decodeFromImageUrl(imageUrl);
      this.handleScanResult(result.getText());
      URL.revokeObjectURL(imageUrl);
    } catch (e) {
      alert('Could not decode QR from image');
    }
  }

  async add(data: any) {
    if (!data.secret) throw new Error('No secret');
    await this.totp.addAccount(data);
    this.router.navigate(['/']);
  }
}
