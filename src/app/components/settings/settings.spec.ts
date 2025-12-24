import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Settings } from './settings';
import { BackupService } from '../../services/backup.service';
import { SecurityService } from '../../services/security.service';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';

class MockBackupService {
  exportBackup = vi.fn();
  importBackup = vi.fn();
}

class MockSecurityService {
  isUnlocked = signal(true).asReadonly();
  removePIN = vi.fn();
  hasPIN = vi.fn().mockReturnValue(true);
  setPIN = vi.fn().mockResolvedValue(undefined);
  verifyPIN = vi.fn().mockResolvedValue(true);
}

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let backupService: MockBackupService;
  let securityService: MockSecurityService;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: any) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { },
        removeListener: () => { },
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => false,
      })
    });

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([]),
        { provide: BackupService, useClass: MockBackupService },
        { provide: SecurityService, useClass: MockSecurityService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;

    backupService = TestBed.inject(BackupService) as any;
    securityService = TestBed.inject(SecurityService) as any;

    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct version', () => {
    expect(component.version).toMatch(/^\d+\.\d+\.\d+/);
    fixture.detectChanges();
    const footer = fixture.debugElement.query(By.css('.text-center.text-text-secondary'));
    expect(footer).toBeTruthy();
    expect(footer.nativeElement.textContent).toContain(`Sigil v${component.version}`);
  });

  describe('PIN Management', () => {
    it('setupPIN should show pin setup modal', () => {
      component.showPINSetup.set(false);
      component.setupPIN();
      expect(component.showPINSetup()).toBe(true);
    });

    it('onPINSet should hide pin setup modal', () => {
      component.showPINSetup.set(true);
      component.onPINSet();
      expect(component.showPINSetup()).toBe(false);
    });

    it('removePIN should call security.removePIN when confirmed', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      component.removePIN();
      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('remove the PIN'));
      expect(securityService.removePIN).toHaveBeenCalled();
    });

    it('removePIN should NOT call security.removePIN when cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      component.removePIN();
      expect(securityService.removePIN).not.toHaveBeenCalled();
    });
  });

  describe('Backup Export', () => {
    it('should export backup when password is provided', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('s3cr3t');
      vi.spyOn(window, 'alert').mockImplementation(() => { });
      backupService.exportBackup.mockResolvedValue(undefined);

      await component.exportBackup();

      expect(window.prompt).toHaveBeenCalled();
      expect(backupService.exportBackup).toHaveBeenCalledWith('s3cr3t');
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('successfully'));
    });

    it('should abort export if no password provided', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      await component.exportBackup();
      expect(backupService.exportBackup).not.toHaveBeenCalled();
    });

    it('should handle export error', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('s3cr3t');
      vi.spyOn(window, 'alert').mockImplementation(() => { });
      vi.spyOn(console, 'error').mockImplementation(() => { });
      backupService.exportBackup.mockRejectedValue(new Error('Export failed'));

      await component.exportBackup();

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to export'));
    });
  });

  describe('Backup Import', () => {
    it('triggerImport should click the hidden file input', () => {
      const input = document.createElement('input');
      input.id = 'backupInput';
      input.click = vi.fn();

      vi.spyOn(document, 'getElementById').mockReturnValue(input);

      component.triggerImport();
      expect(input.click).toHaveBeenCalled();
    });

    it('onFileSelected should import backup when password provided', async () => {
      const mockFile = new File(['{}'], 'backup.json', { type: 'application/json' });
      const event = { target: { files: [mockFile], value: 'fake/path' } };

      vi.spyOn(window, 'prompt').mockReturnValue('s3cr3t');
      vi.spyOn(window, 'alert').mockImplementation(() => { });
      backupService.importBackup.mockResolvedValue({ restored: 5, skipped: 2 });

      await component.onFileSelected(event);

      expect(window.prompt).toHaveBeenCalled();
      expect(backupService.importBackup).toHaveBeenCalledWith(mockFile, 's3cr3t');
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Restore complete'));
      expect(event.target.value).toBe('');
    });

    it('onFileSelected should abort if no file selected', async () => {
      const event = { target: { files: [] } };
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      await component.onFileSelected(event);
      expect(window.prompt).not.toHaveBeenCalled();
    });

    it('onFileSelected should abort and reset input if password cancelled', async () => {
      const mockFile = new File([''], 'backup.json');
      const event = { target: { files: [mockFile], value: 'set' } };
      vi.spyOn(window, 'prompt').mockReturnValue(null);

      await component.onFileSelected(event);

      expect(backupService.importBackup).not.toHaveBeenCalled();
      expect(event.target.value).toBe('');
    });

    it('onFileSelected should handle import error', async () => {
      const mockFile = new File([''], 'backup.json');
      const event = { target: { files: [mockFile], value: 'set' } };
      vi.spyOn(window, 'prompt').mockReturnValue('pass');
      vi.spyOn(window, 'alert').mockImplementation(() => { });
      vi.spyOn(console, 'error').mockImplementation(() => { });
      backupService.importBackup.mockRejectedValue(new Error('Bad JSON'));

      await component.onFileSelected(event);

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Restore failed'));
      expect(event.target.value).toBe('');
    });
  });
});
