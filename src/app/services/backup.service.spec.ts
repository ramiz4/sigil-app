import { TestBed } from '@angular/core/testing';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackupService } from './backup.service';
import { Account, StorageService } from './storage.service';

// Mock StorageService
class MockStorageService {
  accounts: Account[] = [];

  async getAccounts() {
    return this.accounts;
  }

  async addAccount(account: Omit<Account, 'id' | 'created'>) {
    this.accounts.push({ ...account, id: 'test-id', created: Date.now() });
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

  it('should encrypt and decrypt accounts correctly', async () => {
    // Setup scenarios
    const testAccount = {
      id: '1',
      issuer: 'Test',
      label: 'User',
      secret: 'SECRET',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      type: 'totp' as const,
      created: 123,
    };
    mockStorage.accounts = [testAccount];

    // Export
    const password = 'securepassword';
    await service.exportBackup(password);

    // Capture the blob passed to createObjectURL
    const createObjUrlSpy = vi.mocked(window.URL.createObjectURL);
    const blob = createObjUrlSpy.mock.lastCall![0] as Blob;

    // Use the method on blob, which might be polyfilled now
    const text = await blob.text();
    const json = JSON.parse(text);

    expect(json.v).toBe(1);
    expect(json.data).toBeDefined(); // encrypted data
    expect(json.salt).toBeDefined();

    // Clear storage to simulating fresh import
    mockStorage.accounts = [];

    // Import
    const file = new File([text], 'backup.json', { type: 'application/json' });
    const result = await service.importBackup(file, password);

    expect(result.restored).toBe(1);
    expect(result.skipped).toBe(0);
    expect(mockStorage.accounts.length).toBe(1);
    expect(mockStorage.accounts[0].secret).toBe('SECRET');
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
