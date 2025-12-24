import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed bottom-24 left-1/2 -translate-x-1/2 z-1000 flex flex-col gap-2 pointer-events-none w-full max-w-[400px] px-4"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="
            'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border animate-in slide-in-from-bottom-4 fade-in duration-300 ' +
            getClasses(toast.type)
          "
        >
          <div class="shrink-0">
            @if (toast.type === 'success') {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            } @else if (toast.type === 'error') {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            } @else {
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            }
          </div>

          <div class="text-sm font-medium">{{ toast.message }}</div>

          <button
            (click)="toastService.clear(toast.id)"
            class="ml-auto opacity-70 hover:opacity-100 transition-opacity p-1 border-none bg-transparent cursor-pointer flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes slide-in-from-bottom {
        from {
          transform: translateY(1rem) translateX(-50%);
          opacity: 0;
        }
        to {
          transform: translateY(0) translateX(-50%);
          opacity: 1;
        }
      }
      /* Note: Since we have -translate-x-1/2 on the container, we don't need it on the items if we use flex-col items-center */
      /* But the current layout is flex-col gap-2 pointer-events-none w-full max-w-[400px] */
    `,
  ],
})
export class ToastComponent {
  toastService = inject(ToastService);

  getClasses(type: string) {
    switch (type) {
      case 'success':
        return 'bg-surface border-primary text-primary';
      case 'error':
        return 'bg-surface border-danger text-danger';
      default:
        return 'bg-surface border-border text-text-main';
    }
  }
}
