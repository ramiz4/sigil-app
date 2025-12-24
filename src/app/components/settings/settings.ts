import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import packageJson from '@package-json';
import { BackupService } from '../../services/backup.service';
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

    const password = prompt('Enter the password for this backup:');
    if (!password) {
      target.value = ''; // reset
      return;
    }

    try {
      const result = await this.backupService.importBackup(file, password);
      alert(
        `Restore complete.\nRestored: ${result.restored}\nSkipped (duplicates): ${result.skipped}`,
      );
    } catch (e: unknown) {
      const error = e as Error;
      console.error(error);
      alert('Restore failed: ' + (error.message || String(error)));
    }

    target.value = ''; // reset so same file can be selected again if needed
  }

  setupPIN() {
    this.showPINSetup.set(true);
  }

  removePIN() {
    if (confirm('Are you sure you want to remove the PIN lock?')) {
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
