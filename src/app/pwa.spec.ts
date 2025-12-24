import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { ToastService } from './services/toast.service';

describe('App PWA Support', () => {
  let swUpdateMock: Partial<SwUpdate>;
  let toastService: ToastService;
  let versionUpdatesSubject: BehaviorSubject<VersionEvent>;

  beforeEach(async () => {
    versionUpdatesSubject = new BehaviorSubject<VersionEvent>({
      type: 'NO_NEW_VERSION_DETECTED',
      version: { hash: 'initial' },
    });
    swUpdateMock = {
      isEnabled: true,
      versionUpdates: versionUpdatesSubject.asObservable(),
      activateUpdate: vi.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: SwUpdate, useValue: swUpdateMock }],
    }).compileComponents();

    toastService = TestBed.inject(ToastService);
  });

  it('should show toast when update is available', () => {
    const fixture = TestBed.createComponent(App);
    const toastSpy = vi.spyOn(toastService, 'info');

    fixture.detectChanges(); // Trigger ngOnInit

    versionUpdatesSubject.next({
      type: 'VERSION_READY',
      currentVersion: { hash: 'a' },
      latestVersion: { hash: 'b' },
    } as VersionReadyEvent);

    expect(toastSpy).toHaveBeenCalledWith(
      'A new version is available. Please refresh to update.',
      0, // persistent
    );
  });
});
