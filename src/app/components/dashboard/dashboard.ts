import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DialogService } from '../../services/dialog.service';
import { Account } from '../../services/storage.service';
import { ToastService } from '../../services/toast.service';
import { TotpDisplay, TotpService } from '../../services/totp.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, DragDropModule], // CommonModule for ngIf/ngClass etc just in case, though @for is built-in
  templateUrl: './dashboard.html',
})
export class Dashboard {
  totp = inject(TotpService);
  toast = inject(ToastService);
  dialog = inject(DialogService);

  codes = this.totp.displayCodes;
  selectedIds = signal<Set<string>>(new Set());
  isSelectionMode = signal(false);
  searchQuery = signal('');
  selectedFolder = signal<string | null>(null);

  folders = computed(() => {
    const folders = new Set<string>();
    for (const item of this.codes()) {
      if (item.account.folder?.trim()) {
        folders.add(item.account.folder.trim());
      }
    }
    return Array.from(folders).sort();
  });

  toggleSelectionMode() {
    this.isSelectionMode.update((v: boolean) => !v);
    if (!this.isSelectionMode()) {
      this.selectedIds.set(new Set());
    }
  }

  toggleSelect(id: string) {
    this.selectedIds.update((ids: Set<string>) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  async deleteSelected() {
    const ids = Array.from(this.selectedIds()) as string[];
    if (ids.length === 0) return;

    if (
      await this.dialog.confirm(
        `Delete ${ids.length} account${ids.length > 1 ? 's' : ''}?`,
        'Delete Accounts',
      )
    ) {
      await this.totp.deleteAccounts(ids);
      this.selectedIds.set(new Set());
      this.isSelectionMode.set(false);
      this.toast.success('Accounts deleted successfully');
    }
  }

  groupedCodes = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const folderFilter = this.selectedFolder();
    const groups: Record<string, TotpDisplay[]> = {};
    const ungrouped: TotpDisplay[] = [];

    const filteredCodes = this.codes().filter((item) => {
      // Folder filter
      if (folderFilter && item.account.folder !== folderFilter) return false;

      // Search filter
      if (!query) return true;
      return (
        item.account.issuer?.toLowerCase().includes(query) ||
        item.account.label?.toLowerCase().includes(query) ||
        item.account.folder?.toLowerCase().includes(query)
      );
    });

    for (const item of filteredCodes) {
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

  async onDrop(event: CdkDragDrop<TotpDisplay[]>) {
    const item = event.item.data as TotpDisplay;
    const newIndex = event.currentIndex;

    // This is within the same list for now.
    // To support moving between folders, we'd need more logic.
    // But let's first get reordering working within the whole list.
    // If the user has folders, reordering relative to the whole list might be confusing.
    // Let's find the absolute index in the original list.

    const currentGroup = this.groupedCodes().find((g) => g.items.includes(item));
    if (!currentGroup) return;

    // Calculate absolute new index
    // This is tricky because groupedCodes is a transformation.
    // For now, let's just reorder in the master list.
    // If we drop in a different group, we should probably change the folder too.

    const targetGroupName = event.container.id; // We'll set this in HTML
    const sourceGroupName = event.previousContainer.id;

    if (sourceGroupName !== targetGroupName) {
      // Moving to a different folder
      const account = { ...item.account, folder: targetGroupName || undefined };
      await this.totp.updateAccount(account);
    }

    // Reorder in master list
    // Find where the target group starts in the master list
    let absoluteIndex = 0;
    for (const group of this.groupedCodes()) {
      if (group.name === targetGroupName) {
        absoluteIndex += newIndex;
        break;
      }
      absoluteIndex += group.items.length;
    }

    await this.totp.reorderAccount(item.account.id, absoluteIndex);
  }
}
