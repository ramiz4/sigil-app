import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
} from '@angular/core';
import { SecurityService } from '../../services/security.service';

@Component({
  selector: 'app-lock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lock.html',
})
export class LockComponent {
  private security = inject(SecurityService);

  @Input() mode: 'unlock' | 'set' = 'unlock';
  @Output() unlocked = new EventEmitter<void>();

  pin = signal('');
  error = signal(false);

  // For 'set' mode
  firstPin = signal('');
  step = signal(1); // 1 = first entry, 2 = confirm

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key >= '0' && event.key <= '9') {
      this.handleKey(event.key);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      this.handleDelete();
    }
  }

  handleKey(key: string) {
    if (this.pin().length < 6) {
      this.pin.update((p) => p + key);
    }

    if (this.pin().length === 6) {
      this.submit();
    }
  }

  handleDelete() {
    this.pin.update((p) => p.slice(0, -1));
    this.error.set(false);
  }

  async submit() {
    if (this.mode === 'unlock') {
      const isValid = await this.security.verifyPIN(this.pin());
      if (isValid) {
        this.unlocked.emit();
      } else {
        this.error.set(true);
        this.pin.set('');
        // Vibrate if available
        if (window.navigator?.vibrate) {
          window.navigator.vibrate(200);
        }
      }
    } else {
      if (this.step() === 1) {
        this.firstPin.set(this.pin());
        this.pin.set('');
        this.step.set(2);
      } else {
        if (this.pin() === this.firstPin()) {
          await this.security.setPIN(this.pin());
          this.unlocked.emit();
        } else {
          this.error.set(true);
          this.pin.set('');
          this.step.set(1);
          this.firstPin.set('');
        }
      }
    }
  }

  get keys() {
    return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];
  }
}
