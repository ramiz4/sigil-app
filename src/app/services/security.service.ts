import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SecurityService {
  private readonly PIN_KEY = 'sigil_pin_hash';
  private readonly SALT_KEY = 'sigil_pin_salt';

  private _isUnlocked = signal(false);
  public isUnlocked = this._isUnlocked.asReadonly();

  private _isBiometricEnabled = signal(localStorage.getItem('sigil_biometric_enabled') === 'true');
  public isBiometricEnabled = this._isBiometricEnabled.asReadonly();

  isBiometricSupported(): boolean {
    return !!window.navigator?.credentials && !!window.PublicKeyCredential;
  }

  constructor() {
    // If no PIN is set, consider it unlocked
    if (!this.hasPIN()) {
      this._isUnlocked.set(true);
    }
  }

  hasPIN(): boolean {
    return !!localStorage.getItem(this.PIN_KEY);
  }

  async setPIN(pin: string): Promise<void> {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const hash = await this.hashPIN(pin, salt);

    localStorage.setItem(this.PIN_KEY, this.bufferToHex(hash));
    localStorage.setItem(this.SALT_KEY, this.bufferToHex(salt));
    this._isUnlocked.set(true);
  }

  async verifyPIN(pin: string): Promise<boolean> {
    const storedHashHex = localStorage.getItem(this.PIN_KEY);
    const storedSaltHex = localStorage.getItem(this.SALT_KEY);

    if (!storedHashHex || !storedSaltHex) {
      return true; // No PIN set
    }

    const salt = this.hexToBuffer(storedSaltHex);
    const currentHash = await this.hashPIN(pin, salt);

    const isValid = this.bufferToHex(currentHash) === storedHashHex;
    if (isValid) {
      this._isUnlocked.set(true);
    }
    return isValid;
  }

  removePIN(): void {
    localStorage.removeItem(this.PIN_KEY);
    localStorage.removeItem(this.SALT_KEY);
    localStorage.removeItem('sigil_biometric_enabled');
    localStorage.removeItem('sigil_biometric_cred_id');
    this._isBiometricEnabled.set(false);
    this._isUnlocked.set(true);
  }

  async enableBiometric(): Promise<boolean> {
    if (!this.hasPIN()) return false;

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userId = window.crypto.getRandomValues(new Uint8Array(16));

      const credential = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: 'Sigil' },
          user: {
            id: userId,
            name: 'user@sigil',
            displayName: 'Sigil User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (credential) {
        localStorage.setItem('sigil_biometric_enabled', 'true');
        localStorage.setItem('sigil_biometric_cred_id', this.bufferToHex(credential.rawId));
        this._isBiometricEnabled.set(true);
        return true;
      }
    } catch (error) {
      console.error('Biometric registration failed', error);
    }
    return false;
  }

  disableBiometric(): void {
    localStorage.removeItem('sigil_biometric_enabled');
    localStorage.removeItem('sigil_biometric_cred_id');
    this._isBiometricEnabled.set(false);
  }

  async authenticateBiometric(): Promise<boolean> {
    const credIdHex = localStorage.getItem('sigil_biometric_cred_id');
    if (!credIdHex) return false;

    try {
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const credId = this.hexToBuffer(credIdHex);

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: credId as BufferSource,
              type: 'public-key',
            },
          ],
          userVerification: 'required',
          timeout: 60000,
        },
      })) as PublicKeyCredential;

      if (assertion) {
        this._isUnlocked.set(true);
        return true;
      }
    } catch (error) {
      console.error('Biometric authentication failed', error);
    }
    return false;
  }

  lock(): void {
    if (this.hasPIN()) {
      this._isUnlocked.set(false);
    }
  }

  private async hashPIN(pin: string, salt: Uint8Array): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);

    // Combine PIN and salt
    const combined = new Uint8Array(data.length + salt.length);
    combined.set(data);
    combined.set(salt, data.length);

    return await window.crypto.subtle.digest('SHA-256', combined);
  }

  private bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private hexToBuffer(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
  }
}
