import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SecurityService } from './services/security.service';
import { LockComponent } from './components/lock/lock';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, LockComponent],
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('sigil');
  protected security = inject(SecurityService);
}
