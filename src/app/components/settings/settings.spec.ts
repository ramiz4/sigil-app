import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupService } from '../../services/backup.service';
import { DialogService } from '../../services/dialog.service';
import { SecurityService } from '../../services/security.service';
import { Settings } from './settings';

class MockBackupService {
  exportBackup = vi.fn();
  importBackup = vi.fn();
  exportCsv = vi.fn();
  importCsv = vi.fn();
  exportPdf = vi.fn();
  importJson = vi.fn();
}

class MockDialogService {
  confirm = vi.fn().mockResolvedValue(true);
  alert = vi.fn().mockResolvedValue(undefined);
  prompt = vi.fn().mockResolvedValue(null);
}

class MockSecurityService {
  isUnlocked = signal(true).asReadonly();
  removePIN = vi.fn();
  hasPIN = vi.fn().mockReturnValue(true);
  setPIN = vi.fn().mockResolvedValue(undefined);
  verifyPIN = vi.fn().mockResolvedValue(true);
  isBiometricSupported = vi.fn().mockReturnValue(true);
  isBiometricEnabled = signal(false).asReadonly();
  enableBiometric = vi.fn().mockResolvedValue(true);
  disableBiometric = vi.fn();
  authenticateBiometric = vi.fn().mockResolvedValue(true);
}

describe('Settings', () => {
  let component: Settings;
  let fixture: ComponentFixture<Settings>;
  let backupService: MockBackupService;
  let dialogService: MockDialogService;
  let securityService: MockSecurityService;

  beforeEach(async () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {
          // noop
        },
        removeListener: () => {
          // noop
        },
        addEventListener: () => {
          // noop
        },
        removeEventListener: () => {
          // noop
        },
        dispatchEvent: () => false,
      }),
    });

    await TestBed.configureTestingModule({
      imports: [Settings],
      providers: [
        provideRouter([]),
        { provide: BackupService, useClass: MockBackupService },
        { provide: DialogService, useClass: MockDialogService },
        { provide: SecurityService, useClass: MockSecurityService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Settings);
    component = fixture.componentInstance;

    backupService = TestBed.inject(BackupService) as unknown as MockBackupService;
    dialogService = TestBed.inject(DialogService) as unknown as MockDialogService;
    securityService = TestBed.inject(SecurityService) as unknown as MockSecurityService;

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

    it('removePIN should call security.removePIN when confirmed', async () => {
      dialogService.confirm.mockResolvedValue(true);
      await component.removePIN();
      expect(dialogService.confirm).toHaveBeenCalledWith(
        expect.stringContaining('remove the PIN'),
        'Remove PIN',
      );
      expect(securityService.removePIN).toHaveBeenCalled();
    });

    it('removePIN should NOT call security.removePIN when cancelled', async () => {
      dialogService.confirm.mockResolvedValue(false);
      await component.removePIN();
      expect(securityService.removePIN).not.toHaveBeenCalled();
    });
  });

  describe('Backup Export', () => {
    it('should export backup when password is provided', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('s3cr3t');
      vi.spyOn(window, 'alert').mockImplementation(() => {
        // noop
      });
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
      vi.spyOn(window, 'alert').mockImplementation(() => {
        // noop
      });
      vi.spyOn(console, 'error').mockImplementation(() => {
        // noop
      });
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
      // Mock File.text() or use a format that identifies as encrypted backup
      const encryptedData = JSON.stringify({ v: 1, salt: 's', data: 'd' });
      const mockFile = new File([encryptedData], 'backup.json', { type: 'application/json' });
      const event = {
        target: { files: [mockFile], value: 'fake/path' },
      };

      vi.spyOn(window, 'prompt').mockReturnValue('s3cr3t');
      vi.spyOn(window, 'alert').mockImplementation(() => {
        // noop
      });
      backupService.importBackup.mockResolvedValue({ restored: 5, skipped: 2 });
      backupService.importJson.mockResolvedValue({ restored: 0, skipped: 0 });
      // Ensure we treat it as encrypted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(component as unknown as Settings, 'isEncryptedBackup' as any).mockResolvedValue(
        true,
      );

      await component.onFileSelected(event as unknown as Event);

      expect(window.prompt).toHaveBeenCalled();
      expect(backupService.importBackup).toHaveBeenCalledWith(mockFile, 's3cr3t');
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Restore complete'));
      expect(event.target.value).toBe('');
    });

    it('onFileSelected should abort if no file selected', async () => {
      const event = { target: { files: [] } };
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      await component.onFileSelected(event as unknown as Event);
      expect(window.prompt).not.toHaveBeenCalled();
    });

    it('onFileSelected should abort and reset input if password cancelled', async () => {
      const mockFile = new File([''], 'backup.json');
      const event = { target: { files: [mockFile], value: 'set' } };
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(component as unknown as Settings, 'isEncryptedBackup' as any).mockResolvedValue(
        true,
      );
      backupService.importJson.mockResolvedValue({ restored: 0, skipped: 0 });

      await component.onFileSelected(event as unknown as Event);

      expect(backupService.importBackup).not.toHaveBeenCalled();
      expect(event.target.value).toBe('');
    });

    it('onFileSelected should handle import error', async () => {
      const encryptedData = JSON.stringify({ v: 1, salt: 's', data: 'd' });
      const mockFile = new File([encryptedData], 'backup.json');
      const event = { target: { files: [mockFile], value: 'set' } };
      vi.spyOn(window, 'prompt').mockReturnValue('pass');
      vi.spyOn(window, 'alert').mockImplementation(() => {
        // noop
      });
      vi.spyOn(console, 'error').mockImplementation(() => {
        // noop
      });
      backupService.importBackup.mockRejectedValue(new Error('Bad JSON'));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      vi.spyOn(component as unknown as Settings, 'isEncryptedBackup' as any).mockResolvedValue(
        true,
      );

      await component.onFileSelected(event as unknown as Event);

      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Import failed'));
      expect(event.target.value).toBe('');
    });
  });
});
