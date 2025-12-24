import { Component, signal, inject, PLATFORM_ID, OnInit } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-toggle.html',
})
export class ThemeToggle implements OnInit {
  isDark = signal(false);
  private platformId = inject(PLATFORM_ID);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTheme();
    }
  }

  toggle() {
    this.isDark.update(d => !d);
    this.updateTheme();
  }

  private initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved) {
      this.isDark.set(saved === 'dark');
      // Ensure the attribute is synced even if it was set
      this.updateDOM(saved === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
      // We don't necessarily need to set the attribute if adhering to system pref,
      // but to be explicit and avoid the double-click ambiguity for future toggles,
      // we can set it now or just rely on the first toggle to set it.
      // However, to ensure consistency between our button state and the theme,
      // it's safest to be explicit once the user interacts or we take control.

      // Let's set it ensuring our internal state matches reality.
      this.updateDOM(prefersDark);
    }
  }

  private updateTheme() {
    if (!isPlatformBrowser(this.platformId)) return;
    const dark = this.isDark();
    this.updateDOM(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }

  private updateDOM(isDark: boolean) {
    const root = document.documentElement;
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
}
