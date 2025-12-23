import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Fallback
import { RouterLink } from '@angular/router';
import { TotpService } from '../../services/totp.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink], // CommonModule for ngIf/ngClass etc just in case, though @for is built-in
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  totp = inject(TotpService);

  codes = this.totp.displayCodes;

  async copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      // TODO: Show toast
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }

  delete(id: string) {
    if (confirm('Delete this account?')) {
      this.totp.deleteAccount(id);
    }
  }
}
