import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: SwUpdate,
          useValue: {
            isEnabled: false,
            versionUpdates: of({ type: 'NO_NEW_VERSION_DETECTED' }),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    const security = fixture.componentInstance.security;
    vi.spyOn(security, 'isUnlocked').mockReturnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const titleElement = compiled.querySelector('[data-test="app-title"]');
    expect(titleElement).toBeTruthy();
    expect(titleElement?.textContent).toContain('Sigil');
  });

  it('should show lock button when PIN is set', async () => {
    const fixture = TestBed.createComponent(App);
    const security = fixture.componentInstance.security;
    vi.spyOn(security, 'hasPIN').mockReturnValue(true);
    vi.spyOn(security, 'isUnlocked').mockReturnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lockButton = compiled.querySelector('[data-test="lock-button"]');
    expect(lockButton).toBeTruthy();
  });

  it('should hide lock button when PIN is not set', async () => {
    const fixture = TestBed.createComponent(App);
    const security = fixture.componentInstance.security;
    vi.spyOn(security, 'hasPIN').mockReturnValue(false);
    vi.spyOn(security, 'isUnlocked').mockReturnValue(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lockButton = compiled.querySelector('[data-test="lock-button"]');
    expect(lockButton).toBeFalsy();
  });

  it('should call security.lock() when lock button is clicked', async () => {
    const fixture = TestBed.createComponent(App);
    const security = fixture.componentInstance.security;
    vi.spyOn(security, 'hasPIN').mockReturnValue(true);
    vi.spyOn(security, 'isUnlocked').mockReturnValue(true);
    const lockSpy = vi.spyOn(security, 'lock');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const lockButton = compiled.querySelector('[data-test="lock-button"]') as HTMLButtonElement;
    expect(lockButton).toBeTruthy();
    lockButton.click();

    expect(lockSpy).toHaveBeenCalled();
  });

  it('should call security.lock() when Ctrl+Shift+L is pressed', async () => {
    const fixture = TestBed.createComponent(App);
    const security = fixture.componentInstance.security;
    vi.spyOn(security, 'hasPIN').mockReturnValue(true);
    vi.spyOn(security, 'isUnlocked').mockReturnValue(true);
    const lockSpy = vi.spyOn(security, 'lock');
    fixture.detectChanges();

    const event = new KeyboardEvent('keydown', {
      key: 'l',
      code: 'KeyL',
      ctrlKey: true,
      shiftKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(lockSpy).toHaveBeenCalled();
  });
});
