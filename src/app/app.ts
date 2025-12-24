import { Component, signal, inject, HostListener } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SecurityService } from './services/security.service';
import { LockComponent } from './components/lock/lock';
import { ToastComponent } from './components/toast/toast';
import { DialogComponent } from './components/dialog/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, LockComponent, ToastComponent, DialogComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('sigil');
  protected security = inject(SecurityService);

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const isLKey = event.code === 'KeyL' || event.key?.toLowerCase() === 'l';
    if (event.ctrlKey && event.shiftKey && isLKey) {
      if (this.security.hasPIN() && this.security.isUnlocked()) {
        event.preventDefault();
        this.security.lock();
      }
    }
  }

  @HostListener('window:dragover', ['$event'])
  onWindowDragOver(event: DragEvent) {
    event.preventDefault(); // Prevents browser from opening the file
  }

  @HostListener('window:drop', ['$event'])
  onWindowDrop(event: DragEvent) {
    event.preventDefault(); // Prevents browser from opening the file
  }
}
