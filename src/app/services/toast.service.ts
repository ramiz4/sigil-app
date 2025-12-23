import { Injectable, signal } from '@angular/core';

export interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
    id: number;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private _toasts = signal<Toast[]>([]);
    readonly toasts = this._toasts.asReadonly();
    private nextId = 0;

    show(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 3000) {
        const id = this.nextId++;
        const toast: Toast = { id, message, type };

        this._toasts.update(t => [...t, toast]);

        if (duration > 0) {
            setTimeout(() => {
                this.clear(id);
            }, duration);
        }
    }

    clear(id: number) {
        this._toasts.update(t => t.filter(toast => toast.id !== id));
    }

    success(message: string, duration = 3000) {
        this.show(message, 'success', duration);
    }

    error(message: string, duration = 3000) {
        this.show(message, 'error', duration);
    }

    info(message: string, duration = 3000) {
        this.show(message, 'info', duration);
    }
}
