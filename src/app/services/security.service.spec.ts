import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityService } from './security.service';

describe('SecurityService', () => {
  let service: SecurityService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SecurityService],
    });
    service = TestBed.inject(SecurityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should be unlocked if no PIN is set', () => {
    expect(service.hasPIN()).toBe(false);
    expect(service.isUnlocked()).toBe(true);
  });

  it('should be locked if PIN is set and not verified', async () => {
    await service.setPIN('123456');
    service.lock();
    expect(service.isUnlocked()).toBe(false);
  });

  it('should unlock when correct PIN is verified', async () => {
    await service.setPIN('123456');
    service.lock();
    const result = await service.verifyPIN('123456');
    expect(result).toBe(true);
    expect(service.isUnlocked()).toBe(true);
  });

  it('should not unlock when incorrect PIN is verified', async () => {
    await service.setPIN('123456');
    service.lock();
    const result = await service.verifyPIN('000000');
    expect(result).toBe(false);
    expect(service.isUnlocked()).toBe(false);
  });

  it('should remove PIN and unlock', async () => {
    await service.setPIN('123456');
    service.lock();
    service.removePIN();
    expect(service.hasPIN()).toBe(false);
    expect(service.isUnlocked()).toBe(true);
  });

  describe('Biometric', () => {
    it('should initially have biometric disabled', () => {
      expect(service.isBiometricEnabled()).toBe(false);
    });

    it('should reported biometric supported if APIs exist', () => {
      // @ts-expect-error - mocking global
      window.navigator.credentials = {};
      // @ts-expect-error - mocking global
      window.PublicKeyCredential = class {};
      expect(service.isBiometricSupported()).toBe(true);
    });

    it('should enable biometric and store state', async () => {
      // Mock navigator.credentials.create
      const mockCred = { rawId: new Uint8Array([1, 2, 3]).buffer };
      vi.stubGlobal('navigator', {
        credentials: {
          create: vi.fn().mockResolvedValue(mockCred),
        },
      });
      vi.stubGlobal('PublicKeyCredential', class {});

      localStorage.setItem('sigil_pin_hash', 'somehash'); // Must have PIN
      const result = await service.enableBiometric();

      expect(result).toBe(true);
      expect(service.isBiometricEnabled()).toBe(true);
      expect(localStorage.getItem('sigil_biometric_enabled')).toBe('true');
      expect(localStorage.getItem('sigil_biometric_cred_id')).toBe('010203');
    });

    it('should disable biometric', async () => {
      // Mock navigator.credentials.create to enable it first
      const mockCred = { rawId: new Uint8Array([1, 2, 3]).buffer };
      vi.stubGlobal('navigator', {
        credentials: {
          create: vi.fn().mockResolvedValue(mockCred),
        },
      });
      vi.stubGlobal('PublicKeyCredential', class {});
      localStorage.setItem('sigil_pin_hash', 'somehash');

      await service.enableBiometric();
      expect(service.isBiometricEnabled()).toBe(true);

      service.disableBiometric();
      expect(service.isBiometricEnabled()).toBe(false);
      expect(localStorage.getItem('sigil_biometric_enabled')).toBeNull();
    });

    it('should authenticate with biometric', async () => {
      localStorage.setItem('sigil_biometric_cred_id', '010203');
      localStorage.setItem('sigil_pin_hash', 'somehash');
      service.lock();
      expect(service.isUnlocked()).toBe(false);

      vi.stubGlobal('navigator', {
        credentials: {
          get: vi.fn().mockResolvedValue({ id: 'some-id' }),
        },
      });

      const result = await service.authenticateBiometric();
      expect(result).toBe(true);
      expect(service.isUnlocked()).toBe(true);
    });
  });
});
