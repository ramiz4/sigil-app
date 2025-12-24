import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DialogService } from '../../services/dialog.service';
import { TotpService } from '../../services/totp.service';
import { AddAccount } from './add-account';

class MockTotpService {
  async addAccount(_data: unknown): Promise<void> {
    // noop
  }
  parseUrl(_url: string) {
    return {
      issuer: 'Test',
      label: 'Test',
      secret: 'ABC',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    };
  }
}

class MockDialogService {
  alert = vi.fn().mockResolvedValue(undefined);
  confirm = vi.fn().mockResolvedValue(true);
  prompt = vi.fn().mockResolvedValue('');
}

vi.mock('qr-scanner', () => {
  return {
    default: class {
      static hasCamera = vi.fn().mockResolvedValue(true);
      static scanImage = vi.fn().mockResolvedValue('otpauth://totp/Example:user?secret=ABC');
      start = vi.fn().mockResolvedValue(undefined);
      stop = vi.fn();
      destroy = vi.fn();
    },
  };
});

describe('AddAccount', () => {
  let component: AddAccount;
  let fixture: ComponentFixture<AddAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAccount],
      providers: [
        provideRouter([]),
        { provide: TotpService, useClass: MockTotpService },
        { provide: DialogService, useClass: MockDialogService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddAccount);
    component = fixture.componentInstance;

    // Mock secure context
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
    });

    // We don't call fixture.detectChanges() immediately if we want to spy on methods before ngOnInit/ngAfterViewInit
    // but in this case, ngAfterViewInit runs after change detection.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should apply target folder when adding account', async () => {
    const totp = TestBed.inject(TotpService);
    const addSpy = vi.spyOn(totp, 'addAccount');

    component.targetFolder.set('Work');
    component.manualEntry = {
      issuer: 'Test',
      label: 'test@test.com',
      secret: 'ABC',
    };

    await component.addManual();

    expect(addSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: 'Work',
      }),
    );
  });

  it('should handle drag over events', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    component.onDragOver(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging()).toBe(true);
  });

  it('should handle drag leave events', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    component.isDragging.set(true);
    component.onDragLeave(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging()).toBe(false);
  });

  it('should process file on drop', () => {
    const processSpy = vi.spyOn(component, 'processImageFile').mockImplementation(async () => {
      // noop
    });
    const mockFile = new File([''], 'qr.png', { type: 'image/png' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [mockFile],
      },
    } as unknown as DragEvent;

    component.onDrop(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(processSpy).toHaveBeenCalledWith(mockFile);
    expect(processSpy).toHaveBeenCalledWith(mockFile);
    expect(component.isDragging()).toBe(false);
  });

  it('should show duplicate account alert when account already exists', async () => {
    const totp = TestBed.inject(TotpService);
    const dialog = TestBed.inject(DialogService);
    vi.spyOn(totp, 'addAccount').mockRejectedValue(new Error('Duplicate account'));

    component.manualEntry = {
      issuer: 'Test',
      label: 'test@test.com',
      secret: 'ABC',
    };

    await component.addManual();

    expect(dialog.alert).toHaveBeenCalledWith('This account already exists');
  });
});
