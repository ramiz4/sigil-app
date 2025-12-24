import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogService } from '../../services/dialog.service';

@Component({
    selector: 'app-dialog',
    imports: [CommonModule, FormsModule],
    template: `
    <div *ngIf="dialog()" (click)="cancel()" class="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div (click)="$event.stopPropagation()" class="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-6">
          <h3 class="text-lg font-bold text-text-main mb-2">{{ dialog()?.title }}</h3>
          <p class="text-text-secondary mb-6">{{ dialog()?.message }}</p>

          <ng-container *ngIf="dialog()?.type === 'prompt'">
            <input 
              [(ngModel)]="promptValue" 
              (keyup.enter)="confirm()"
              class="w-full p-3 rounded-md border border-border bg-bg text-text-main focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 mb-6"
              [placeholder]="dialog()?.defaultValue || ''"
              autofocus
            >
          </ng-container>

          <div class="flex justify-end gap-3">
            <button 
              *ngIf="dialog()?.type !== 'alert'"
              (click)="cancel()"
              class="px-4 py-2 rounded-md font-medium text-text-secondary hover:bg-bg transition-all border-none bg-transparent cursor-pointer"
            >
              {{ dialog()?.cancelText || 'Cancel' }}
            </button>
            <button 
              (click)="confirm()"
              class="px-6 py-2 rounded-md font-medium bg-primary text-white hover:bg-primary-hover transition-all border-none cursor-pointer shadow-sm"
            >
              {{ dialog()?.confirmText || 'OK' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: contents; }
  `]
})
export class DialogComponent {
    dialogService = inject(DialogService);
    dialog = this.dialogService.activeDialog;
    promptValue = '';

    constructor() {
        // Reset prompt value when dialog changes
        // Alternatively use effect() if on Angular 17+
    }

    confirm() {
        if (this.dialog()?.type === 'prompt') {
            this.dialogService.resolve(this.promptValue);
            this.promptValue = '';
        } else if (this.dialog()?.type === 'confirm') {
            this.dialogService.resolve(true);
        } else {
            this.dialogService.resolve(undefined);
        }
    }

    cancel() {
        if (this.dialog()?.type === 'prompt') {
            this.dialogService.resolve(null);
            this.promptValue = '';
        } else {
            this.dialogService.resolve(false);
        }
    }
}
