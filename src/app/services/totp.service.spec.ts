import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Account, StorageService } from './storage.service';
import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TotpService,
        {
          provide: StorageService,
          useValue: {
            getAccounts: () => Promise.resolve([]),
            addAccount: () => Promise.resolve({}),
            updateAccount: () => Promise.resolve(),
            deleteAccount: () => Promise.resolve(),
          },
        },
      ],
    });
    service = TestBed.inject(TotpService);
  });

  it('should parse valid otpauth URL', () => {
    const url = 'otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example';
    const result = service.parseUrl(url);
    expect(result.label).toContain('alice@google.com');
    expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
    expect(result.issuer).toBe('Example');
  });

  it('should throw on invalid URL', () => {
    expect(() => service.parseUrl('invalid-url')).toThrow('Invalid OTP URL');
  });

  it('should throw "Only TOTP supported" for non-totp URLs', () => {
    const url = 'otpauth://hotp/Example:alice?secret=JBSWY3DPEHPK3PXP&counter=0';
    expect(() => service.parseUrl(url)).toThrow('Only TOTP supported');
  });

  it('should generate correct RFC 6238 code (SHA1)', () => {
    const account = {
      id: 'test',
      issuer: 'Test',
      label: 'Test',
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', // "12345678901234567890"
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      created: 0,
      type: 'totp' as const,
      order: 0,
    };

    // Time = 59s. Steps = floor(59/30) = 1.
    // Expected: 287082

    // Accessing private/protected method for verification
    const result = service['generateForAccount'](account, 59000); // 59 seconds
    expect(result.code).toBe('287082');
  });

  it('should generate correct RFC 6238 code (SHA1) at time 1111111109', () => {
    // 1111111109 seconds -> 1111111109000 ms
    // Steps = 37037036
    // Expected (from RFC): 081804
    const account = {
      id: 'test',
      issuer: 'Test',
      label: 'Test',
      secret: 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      created: 0,
      type: 'totp' as const,
      order: 0,
    };
    const result = service['generateForAccount'](account, 1111111109000);
    expect(result.code).toBe('081804');
  });
  it('should update account and reload', async () => {
    const storage = TestBed.inject(StorageService);
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    const getSpy = vi.fn().mockResolvedValue([{ id: '1', issuer: 'Updated', order: 0 }]);
    storage.updateAccount = updateSpy;
    storage.getAccounts = getSpy;

    await service.updateAccount({ id: '1', issuer: 'Updated', order: 0 } as Account);

    expect(updateSpy).toHaveBeenCalledWith({ id: '1', issuer: 'Updated', order: 0 });
    expect(getSpy).toHaveBeenCalled();
  });

  it('should throw error when adding duplicate account', async () => {
    const storage = TestBed.inject(StorageService);
    vi.spyOn(storage, 'getAccounts').mockResolvedValue([
      { issuer: 'Test', label: 'user', secret: 'ABC' } as Account,
    ]);
    await service.loadAccounts();

    await expect(
      service.addAccount({
        issuer: 'Test',
        label: 'user',
        secret: 'ABC',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp',
      }),
    ).rejects.toThrow('Duplicate account');
  });
  it('should reorder accounts', async () => {
    const storage = TestBed.inject(StorageService);
    const accounts = [
      { id: '1', issuer: 'A', order: 0 } as Account,
      { id: '2', issuer: 'B', order: 1 } as Account,
    ];
    vi.spyOn(storage, 'getAccounts').mockResolvedValue(accounts);
    const updateSpy = vi.spyOn(storage, 'updateAccount').mockResolvedValue(undefined);

    await service.loadAccounts();

    // Reorder B before A
    await service.reorderAccount('2', 0);

    expect(updateSpy).toHaveBeenCalledTimes(2);
    // B should now be 0, A should be 1
    const calls = updateSpy.mock.calls;
    const bUpdate = calls.find((c) => c[0].id === '2')![0];
    const aUpdate = calls.find((c) => c[0].id === '1')![0];
    expect(bUpdate.order).toBe(0);
    expect(aUpdate.order).toBe(1);
  });
});
