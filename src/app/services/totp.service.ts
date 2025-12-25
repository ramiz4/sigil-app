import { computed, inject, Injectable, signal, WritableSignal } from '@angular/core';
import { Secret, TOTP, URI } from 'otpauth';
import { parseMigrationUrl } from '../utils/otp-migration';
import { Account, StorageService } from './storage.service';

export interface TotpDisplay {
  account: Account;
  code: string;
  progress: number; // 0-1 or 0-period
}

@Injectable({
  providedIn: 'root',
})
export class TotpService {
  private accountsSignal: WritableSignal<Account[]> = signal([]);

  // Computed signal for display
  public codes = computed(() => {
    const now = Date.now();
    return this.accountsSignal().map((acc) => this.generateForAccount(acc, now));
  });

  private storage = inject(StorageService);

  constructor() {
    this.loadAccounts();
    // Update every second
    setInterval(() => {
      // Trigger generic update if needed, but since 'codes' computed depends on 'now' which is external,
      // we might need a signal for 'now'.
      this.now.set(Date.now());
    }, 1000);
  }

  private now = signal(Date.now());

  // Re-compute codes when 'now' changes
  public displayCodes = computed(() => {
    const time = this.now();
    return this.accountsSignal().map((acc) => this.generateForAccount(acc, time));
  });

  async loadAccounts() {
    const accounts = await this.storage.getAccounts();
    this.accountsSignal.set(accounts);
  }

  async addAccount(accountData: Omit<Account, 'id' | 'created' | 'order'>) {
    // Check for duplicates? MVP warning/skip can be done in UI logic or here.
    // For now simple add.
    const exists = this.accountsSignal().find(
      (a) =>
        a.issuer === accountData.issuer &&
        a.label === accountData.label &&
        a.secret === accountData.secret,
    );

    if (exists) {
      throw new Error('Duplicate account');
    }

    await this.storage.addAccount(accountData);
    await this.loadAccounts();
  }

  async updateAccount(account: Account) {
    await this.storage.updateAccount(account);
    await this.loadAccounts();
  }

  async deleteAccount(id: string) {
    await this.storage.deleteAccount(id);
    await this.loadAccounts();
  }

  async deleteAccounts(ids: string[]) {
    await this.storage.deleteAccounts(ids);
    await this.loadAccounts();
  }

  async reorderAccount(id: string, newIndex: number) {
    const accounts = [...this.accountsSignal()];
    const currentIndex = accounts.findIndex((a) => a.id === id);
    if (currentIndex === -1) return;

    const [account] = accounts.splice(currentIndex, 1);
    accounts.splice(newIndex, 0, account);

    // Update all orders
    const updates = accounts.map((a, index) => {
      if (a.order !== index) {
        return this.storage.updateAccount({ ...a, order: index });
      }
      return Promise.resolve();
    });

    await Promise.all(updates);
    await this.loadAccounts();
  }

  private generateForAccount(account: Account, timestamp: number): TotpDisplay {
    // defaults
    const period = account.period || 30;
    const digits = account.digits || 6;
    const algorithm = account.algorithm || 'SHA1';

    // Create TOTP object
    const totp = new TOTP({
      secret: account.secret, // base32
      algorithm: algorithm,
      digits: digits,
      period: period,
    });

    const code = totp.generate({ timestamp });

    // progress
    // otpauth doesn't give precise progress but we can calc it.
    const epoch = Math.floor(timestamp / 1000); // 0..1 ascending
    // Usually auth apps show countdown (1..0) or progress.
    // Let's do remaining ratio:
    const remaining = period - (epoch % period);
    const progressRatio = remaining / period;

    return {
      account,
      code,
      progress: progressRatio,
    };
  }

  parseUrl(url: string): Partial<Account>[] {
    if (url.startsWith('otpauth-migration:')) {
      try {
        const accounts = parseMigrationUrl(url);
        return accounts.map((acc) => ({
          issuer: acc.issuer || 'Unknown',
          label: acc.name || 'Unknown',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          secret: new Secret({ buffer: acc.secret.buffer as any }).base32,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          algorithm: acc.algorithm as any,
          digits: acc.digits,
          period: 30, // Migration format doesn't seem to specify period, usually 30
          type: 'totp',
        }));
      } catch (e) {
        console.error('Failed to parse migration URL:', e);
        throw new Error('Invalid Migration URL');
      }
    }

    try {
      const parsed = URI.parse(url);
      if (!(parsed instanceof TOTP)) {
        throw new Error('Only TOTP supported');
      }
      return [
        {
          issuer: parsed.issuer || 'Unknown',
          label: parsed.label || 'Unknown',
          secret: parsed.secret.base32,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          algorithm: parsed.algorithm as any,
          digits: parsed.digits,
          period: parsed.period,
        },
      ];
    } catch (e: unknown) {
      if (e instanceof Error && e.message === 'Only TOTP supported') throw e;
      throw new Error('Invalid OTP URL');
    }
  }
}
