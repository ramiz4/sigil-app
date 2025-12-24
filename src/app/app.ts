import { CommonModule } from '@angular/common';
import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';
import { DialogComponent } from './components/dialog/dialog';
import { LockComponent } from './components/lock/lock';
import { ToastComponent } from './components/toast/toast';
import { SecurityService } from './services/security.service';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, LockComponent, ToastComponent, DialogComponent],
  templateUrl: './app.html',
})
export class App implements OnInit {
  protected readonly title = signal('sigil');
  public security = inject(SecurityService);
  private updates = inject(SwUpdate);
  private toast = inject(ToastService);

  ngOnInit() {
    if (this.updates.isEnabled) {
      this.updates.versionUpdates
        .pipe(filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY'))
        .subscribe(() => {
          this.toast.info('A new version is available. Please refresh to update.', 0);
        });
    }
  }

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
