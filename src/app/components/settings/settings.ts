import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import packageJson from '@package-json';
import { BackupService } from '../../services/backup.service';
import { DialogService } from '../../services/dialog.service';
import { SecurityService } from '../../services/security.service';
import { LockComponent } from '../lock/lock';
import { ThemeToggle } from '../theme-toggle';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, LockComponent, ThemeToggle],
  templateUrl: './settings.html',
})
export class Settings {
  private backupService = inject(BackupService);
  private dialog = inject(DialogService);
  public security = inject(SecurityService);

  showPINSetup = signal(false);
  version = packageJson.version;

  async exportBackup() {
    const password = prompt(
      'Enter a password to encrypt your backup (Important: Do not lose this!):',
    );
    if (!password) return;

    try {
      await this.backupService.exportBackup(password);
      alert('Backup downloaded successfully. Please keep it safe.');
    } catch (e) {
      console.error(e);
      alert('Failed to export backup.');
    }
  }

  triggerImport() {
    document.getElementById('backupInput')?.click();
  }

  async onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.csv')) {
        const result = await this.backupService.importCsv(file);
        alert(
          `CSV Import complete.\nRestored: ${result.restored}\nSkipped (duplicates): ${result.skipped}`,
        );
      } else if (file.name.endsWith('.json')) {
        // Try encrypted backup first, then generic JSON
        const isEncrypted = await this.isEncryptedBackup(file);
        if (isEncrypted) {
          const password = prompt('Enter the password for this encrypted backup:');
          if (!password) {
            target.value = '';
            return;
          }
          const result = await this.backupService.importBackup(file, password);
          alert(
            `Restore complete.\nRestored: ${result.restored}\nSkipped (duplicates): ${result.skipped}`,
          );
        } else {
          const result = await this.backupService.importJson(file);
          alert(
            `JSON Import complete.\nRestored: ${result.restored}\nSkipped (duplicates): ${result.skipped}`,
          );
        }
      }
    } catch (e: unknown) {
      const error = e as Error;
      console.error(error);
      alert('Import failed: ' + (error.message || String(error)));
    }

    target.value = ''; // reset
  }

  private async isEncryptedBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      return data.v !== undefined && data.salt !== undefined && data.data !== undefined;
    } catch {
      return false;
    }
  }

  async exportCsv() {
    try {
      await this.backupService.exportCsv();
    } catch (e) {
      console.error(e);
      alert('Failed to export CSV.');
    }
  }

  async exportPdf() {
    try {
      await this.backupService.exportPdf();
    } catch (e) {
      console.error(e);
      alert('Failed to export PDF.');
    }
  }

  setupPIN() {
    this.showPINSetup.set(true);
  }

  async removePIN() {
    if (await this.dialog.confirm('Are you sure you want to remove the PIN lock?', 'Remove PIN')) {
      this.security.removePIN();
    }
  }

  onPINSet() {
    this.showPINSetup.set(false);
  }

  async toggleBiometric() {
    if (this.security.isBiometricEnabled()) {
      this.security.disableBiometric();
    } else {
      const success = await this.security.enableBiometric();
      if (!success) {
        alert(
          'Could not enable biometric authentication. Please ensure you have it configured on your device.',
        );
      }
    }
  }
}
