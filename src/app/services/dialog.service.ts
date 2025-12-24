import { Injectable, signal } from '@angular/core';

export interface DialogOptions {
  title: string;
  message: string;
  type: 'alert' | 'confirm' | 'prompt';
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  private _activeDialog = signal<DialogOptions | null>(null);
  readonly activeDialog = this._activeDialog.asReadonly();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private resolver: ((value: any) => void) | null = null;

  async alert(message: string, title = 'Alert'): Promise<void> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this._activeDialog.set({
        title,
        message,
        type: 'alert',
        confirmText: 'OK',
      });
    });
  }

  async confirm(message: string, title = 'Confirm'): Promise<boolean> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this._activeDialog.set({
        title,
        message,
        type: 'confirm',
        confirmText: 'Yes',
        cancelText: 'No',
      });
    });
  }

  async prompt(message: string, defaultValue = '', title = 'Input'): Promise<string | null> {
    return new Promise((resolve) => {
      this.resolver = resolve;
      this._activeDialog.set({
        title,
        message,
        defaultValue,
        type: 'prompt',
        confirmText: 'OK',
        cancelText: 'Cancel',
      });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve(value: any) {
    if (this.resolver) {
      this.resolver(value);
      this.resolver = null;
    }
    this._activeDialog.set(null);
  }
}
