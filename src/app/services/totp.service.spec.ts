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
        { provide: StorageService, useValue: { getAccounts: () => Promise.resolve([]) } },
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
    expect(() => service.parseUrl('invalid-url')).toThrow();
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
    };
    const result = service['generateForAccount'](account, 1111111109000);
    expect(result.code).toBe('081804');
  });
  it('should update account and reload', async () => {
    const storage = TestBed.inject(StorageService);
    const updateSpy = vi.fn().mockResolvedValue(undefined);
    const getSpy = vi.fn().mockResolvedValue([{ id: '1', issuer: 'Updated' }]);
    storage.updateAccount = updateSpy;
    storage.getAccounts = getSpy;

    await service.updateAccount({ id: '1', issuer: 'Updated' } as Account);

    expect(updateSpy).toHaveBeenCalledWith({ id: '1', issuer: 'Updated' });
    expect(getSpy).toHaveBeenCalled();
  });
});
