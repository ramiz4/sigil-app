import { CommonModule } from '@angular/common'; // Fallback
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { Account } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { TotpDisplay, TotpService } from '../../services/totp.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink], // CommonModule for ngIf/ngClass etc just in case, though @for is built-in
  templateUrl: './dashboard.html',
})
export class Dashboard {
  totp = inject(TotpService);
  toast = inject(ToastService);
  dialog = inject(DialogService);

  codes = this.totp.displayCodes;

  groupedCodes = computed(() => {
    const groups: Record<string, TotpDisplay[]> = {};
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

    const result = Object.keys(groups)
      .sort()
      .map((name) => ({
        name,
        items: groups[name],
      }));

    if (ungrouped.length > 0) {
      result.push({ name: '', items: ungrouped });
    }

    return result;
  });

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      this.toast.success('Code copied to clipboard');
    } catch (err) {
      console.error('Failed to copy', err);
      this.toast.error('Failed to copy to clipboard');
    }
  }

  async editFolder(account: Account) {
    const newFolder = await this.dialog.prompt(
      'Enter folder name for this account:',
      account.folder || '',
      'Edit Folder',
    );
    if (newFolder !== null) {
      await this.totp.updateAccount({
        ...account,
        folder: newFolder.trim() || undefined,
      });
    }
  }

  async delete(id: string) {
    if (await this.dialog.confirm('Delete this account?', 'Delete Account')) {
      this.totp.deleteAccount(id);
    }
  }
}
