import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAccount } from './add-account';
import { TotpService } from '../../services/totp.service';
import { DialogService } from '../../services/dialog.service';
import { provideRouter } from '@angular/router';

class MockTotpService {
  async addAccount(data: any) { }
  parseUrl(url: string) { return {}; }
}

class MockDialogService {
  alert = vi.fn().mockResolvedValue(undefined);
  confirm = vi.fn().mockResolvedValue(true);
  prompt = vi.fn().mockResolvedValue('');
}

describe('AddAccount', () => {
  let component: AddAccount;
  let fixture: ComponentFixture<AddAccount>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddAccount],
      providers: [
        provideRouter([]),
        { provide: TotpService, useClass: MockTotpService },
        { provide: DialogService, useClass: MockDialogService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AddAccount);
    component = fixture.componentInstance;
    await fixture.whenStable();
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
      secret: 'ABC'
    };

    await component.addManual();

    expect(addSpy).toHaveBeenCalledWith(expect.objectContaining({
      folder: 'Work'
    }));
  });

  it('should handle drag over events', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as DragEvent;

    component.onDragOver(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging()).toBe(true);
  });

  it('should handle drag leave events', () => {
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as DragEvent;

    component.isDragging.set(true);
    component.onDragLeave(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(component.isDragging()).toBe(false);
  });

  it('should process file on drop', () => {
    const processSpy = vi.spyOn(component, 'processImageFile').mockImplementation(async () => { });
    const mockFile = new File([''], 'qr.png', { type: 'image/png' });

    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [mockFile]
      }
    } as unknown as DragEvent;

    component.onDrop(mockEvent);

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(processSpy).toHaveBeenCalledWith(mockFile);
    expect(component.isDragging()).toBe(false);
  });
});
