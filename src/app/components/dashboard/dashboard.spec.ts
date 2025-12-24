import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';
import { TotpService } from '../../services/totp.service';
import { ToastService } from '../../services/toast.service';
import { DialogService } from '../../services/dialog.service';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';

class MockTotpService {
  displayCodes = signal([]);
  deleteAccount(id: string) { }
  updateAccount(account: any) { }
}

class MockToastService {
  success(message: string) { }
  error(message: string) { }
}

class MockDialogService {
  confirm = vi.fn();
  prompt = vi.fn();
  alert = vi.fn();
}

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: TotpService, useClass: MockTotpService },
        { provide: ToastService, useClass: MockToastService },
        { provide: DialogService, useClass: MockDialogService }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    toastService = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show empty state when no codes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No Accounts yet');
  });

  it('should group codes by folder', () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    mockService.displayCodes.set([
      { account: { id: '1', issuer: 'A', folder: 'Work' }, code: '123' },
      { account: { id: '2', issuer: 'B', folder: 'Home' }, code: '456' },
      { account: { id: '3', issuer: 'C', folder: 'Work' }, code: '789' },
      { account: { id: '4', issuer: 'D' }, code: '000' }
    ] as any);

    fixture.detectChanges();

    const groups = component.groupedCodes();
    expect(groups.length).toBe(3); // Home, Work, and ungrouped

    expect(groups[0].name).toBe('Home');
    expect(groups[0].items.length).toBe(1);

    expect(groups[1].name).toBe('Work');
    expect(groups[1].items.length).toBe(2);

    expect(groups[2].name).toBe('');
    expect(groups[2].items.length).toBe(1);
  });

  it('should sort folders alphabetically', () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    mockService.displayCodes.set([
      { account: { id: '1', issuer: 'A', folder: 'Beta' }, code: '123' },
      { account: { id: '2', issuer: 'B', folder: 'Alpha' }, code: '456' }
    ] as any);

    fixture.detectChanges();

    const groups = component.groupedCodes();
    expect(groups[0].name).toBe('Alpha');
    expect(groups[1].name).toBe('Beta');
  });

  it('should copy code to clipboard and show toast', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    // @ts-ignore
    navigator.clipboard = { writeText: writeTextMock };
    const toastSpy = vi.spyOn(toastService, 'success');

    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    mockService.displayCodes.set([
      { account: { id: '1', issuer: 'Test', label: 'test@example.com' }, code: '999999', progress: 0.5 }
    ] as any);
    fixture.detectChanges();

    const itemDiv = fixture.debugElement.query(By.css('.bg-surface'));
    expect(itemDiv).toBeTruthy();

    itemDiv.triggerEventHandler('click', null);

    await Promise.resolve();

    expect(writeTextMock).toHaveBeenCalledWith('999999');
    expect(toastSpy).toHaveBeenCalledWith('Code copied to clipboard');
  });

  it('should call deleteAccount when confirmed', async () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    const dialogService = TestBed.inject(DialogService) as unknown as MockDialogService;
    const deleteSpy = vi.spyOn(mockService, 'deleteAccount');
    dialogService.confirm.mockResolvedValue(true);

    await component.delete('1');

    expect(deleteSpy).toHaveBeenCalledWith('1');
  });

  it('should not call deleteAccount when cancelled', async () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    const dialogService = TestBed.inject(DialogService) as unknown as MockDialogService;
    const deleteSpy = vi.spyOn(mockService, 'deleteAccount');
    dialogService.confirm.mockResolvedValue(false);

    await component.delete('1');

    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it('should call updateAccount with new folder when prompted', async () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    const dialogService = TestBed.inject(DialogService) as unknown as MockDialogService;
    const updateSpy = vi.spyOn(mockService, 'updateAccount');
    const account = { id: '1', issuer: 'Test', folder: 'Old' };
    dialogService.prompt.mockResolvedValue('New Folder');

    await component.editFolder(account as any);

    expect(updateSpy).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      folder: 'New Folder'
    }));
  });

  it('should not call updateAccount when prompt is cancelled', async () => {
    const mockService = TestBed.inject(TotpService) as unknown as MockTotpService;
    const dialogService = TestBed.inject(DialogService) as unknown as MockDialogService;
    const updateSpy = vi.spyOn(mockService, 'updateAccount');
    const account = { id: '1', issuer: 'Test', folder: 'Old' };
    dialogService.prompt.mockResolvedValue(null);

    await component.editFolder(account as any);

    expect(updateSpy).not.toHaveBeenCalled();
  });
});
