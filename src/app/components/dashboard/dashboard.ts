import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common'; // Fallback
import { RouterLink } from '@angular/router';
import { TotpService, TotpDisplay } from '../../services/totp.service';
import { Account } from '../../services/storage.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink], // CommonModule for ngIf/ngClass etc just in case, though @for is built-in
  templateUrl: './dashboard.html',
})
export class Dashboard {
  totp = inject(TotpService);

  codes = this.totp.displayCodes;

  groupedCodes = computed(() => {
    const groups: { [key: string]: TotpDisplay[] } = {};
    const ungrouped: TotpDisplay[] = [];

    for (const item of this.codes()) {
      const folder = item.account.folder?.trim();
      if (folder) {
        if (!groups[folder]) groups[folder] = [];
        groups[folder].push(item);
      } else {
        ungrouped.push(item);
      }
    }

    const result = Object.keys(groups).sort().map(name => ({
      name,
      items: groups[name]
    }));

    if (ungrouped.length > 0) {
      result.push({ name: '', items: ungrouped });
    }

    return result;
  });

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      // TODO: Show toast
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  async editFolder(account: Account) {
    const newFolder = prompt('Enter folder name for this account:', account.folder || '');
    if (newFolder !== null) {
      await this.totp.updateAccount({
        ...account,
        folder: newFolder.trim() || undefined
      });
    }
  }

  delete(id: string) {
    if (confirm('Delete this account?')) {
      this.totp.deleteAccount(id);
    }
  }
}
