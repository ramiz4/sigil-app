import { TestBed } from '@angular/core/testing';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupService } from './backup.service';
import { Account, StorageService } from './storage.service';

// Mock StorageService
class MockStorageService {
  accounts: Account[] = [];

  async getAccounts() {
    // Simulate the new robust implementation
    return [...this.accounts].sort((a, b) => (a.created || 0) - (b.created || 0));
  }

  async addAccount(account: Omit<Account, 'id' | 'created'>) {
    const newAccount = { ...account, id: 'test-id', created: Date.now() } as Account;
    this.accounts.push(newAccount);
    return newAccount;
  }
}

describe('BackupService', () => {
  let service: BackupService;
  let mockStorage: MockStorageService;

  beforeAll(() => {
    // Polyfill Blob.prototype.text for JSDOM
    if (!Blob.prototype.text) {
      Blob.prototype.text = function () {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(this);
        });
      };
    }
  });

  beforeEach(() => {
    mockStorage = new MockStorageService();
    TestBed.configureTestingModule({
      providers: [BackupService, { provide: StorageService, useValue: mockStorage }],
    });
    service = TestBed.inject(BackupService);

    // Spy on window.URL.createObjectURL
    vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {
      // noop
    });
    const a = document.createElement('a');
    vi.spyOn(document, 'createElement').mockReturnValue(a);
    vi.spyOn(a, 'click').mockImplementation(() => {
      // noop
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should encrypt and decrypt multiple accounts correctly', async () => {
    // Setup scenarios
    const testAccounts: Account[] = [
      {
        id: '1',
        issuer: 'Google',
        label: 'user1',
        secret: 'SECRET1',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp' as const,
        created: 123,
        folder: 'Work',
        order: 0,
      },
      {
        id: '2',
        issuer: 'GitHub',
        label: 'user2',
        secret: 'SECRET2',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp' as const,
        created: 124,
        order: 1,
      },
    ];
    mockStorage.accounts = testAccounts;

    // Export
    const password = 'securepassword';
    await service.exportBackup(password);

    // Capture the blob passed to createObjectURL
    const createObjUrlSpy = vi.mocked(window.URL.createObjectURL);
    const blob = createObjUrlSpy.mock.lastCall![0] as Blob;

    const text = await blob.text();
    const json = JSON.parse(text);

    expect(json.v).toBe(1);
    expect(json.data).toBeDefined();

    // Clear storage
    mockStorage.accounts = [];

    // Import
    const file = new File([text], 'backup.json', { type: 'application/json' });
    const result = await service.importBackup(file, password);

    expect(result.restored).toBe(2);
    expect(result.skipped).toBe(0);
    expect(mockStorage.accounts.length).toBe(2);
    expect(mockStorage.accounts.find((a) => a.issuer === 'Google')?.folder).toBe('Work');
    expect(mockStorage.accounts.find((a) => a.issuer === 'GitHub')?.secret).toBe('SECRET2');
  });

  it('should include all accounts even if some are missing created field', async () => {
    // Setup
    const testAccounts: Account[] = [
      {
        id: '1',
        issuer: 'Google',
        label: 'u1',
        secret: 'S1',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp',
        created: 123,
        order: 0,
      },
      {
        id: '2',
        issuer: 'GitHub',
        label: 'u2',
        secret: 'S2',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp',
        // missing created
      } as unknown as Account,
    ];
    mockStorage.accounts = testAccounts;

    await service.exportBackup('pass');

    const createObjUrlSpy = vi.mocked(window.URL.createObjectURL);
    const blob = createObjUrlSpy.mock.lastCall![0] as Blob;
    const text = await blob.text();

    mockStorage.accounts = [];
    const file = new File([text], 'backup.json', { type: 'application/json' });
    const result = await service.importBackup(file, 'pass');

    expect(result.restored).toBe(2);
    expect(mockStorage.accounts.length).toBe(2);
  });

  it('should fail import with wrong password', async () => {
    mockStorage.accounts = [
      {
        id: '1',
        issuer: 'Test',
        label: 'User',
        secret: 'SECRET',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp' as const,
        created: 123,
        order: 0,
      },
    ];

    await service.exportBackup('correct-password');
    const createObjUrlSpy = vi.mocked(window.URL.createObjectURL);
    const blob = createObjUrlSpy.mock.lastCall![0] as Blob;
    const text = await blob.text();

    const file = new File([text], 'backup.json', { type: 'application/json' });

    await expect(service.importBackup(file, 'wrong-password')).rejects.toThrow(
      'Incorrect password or corrupted file',
    );
  });
});
