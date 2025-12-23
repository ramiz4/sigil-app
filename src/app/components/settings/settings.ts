import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BackupService } from '../../services/backup.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, RouterLink],
  templateUrl: './settings.html',
})
export class Settings {

  constructor(private backupService: BackupService) { }

  toggleTheme() {
    const root = document.documentElement;
    const current = root.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  }

  async exportBackup() {
    const password = prompt('Enter a password to encrypt your backup (Important: Do not lose this!):');
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

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const password = prompt('Enter the password for this backup:');
    if (!password) {
      event.target.value = ''; // reset
      return;
    }

    try {
      const result = await this.backupService.importBackup(file, password);
      alert(`Restore complete.\nRestored: ${result.restored}\nSkipped (duplicates): ${result.skipped}`);
    } catch (e: any) {
      console.error(e);
      alert('Restore failed: ' + e.message);
    }

    event.target.value = ''; // reset so same file can be selected again if needed
  }

  ngOnInit() {
    // Initialize state if needed, but usually done in app initialization
  }
}
