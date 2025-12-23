import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { URI, TOTP } from 'otpauth';
import { Account, StorageService } from './storage.service';

export interface TotpDisplay {
    account: Account;
    code: string;
    progress: number; // 0-1 or 0-period
}

@Injectable({
    providedIn: 'root'
})
export class TotpService {
    private accountsSignal: WritableSignal<Account[]> = signal([]);

    // Computed signal for display
    public codes = computed(() => {
        const now = Date.now();
        return this.accountsSignal().map(acc => this.generateForAccount(acc, now));
    });

    constructor(private storage: StorageService) {
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
        return this.accountsSignal().map(acc => this.generateForAccount(acc, time));
    });

    async loadAccounts() {
        const accounts = await this.storage.getAccounts();
        this.accountsSignal.set(accounts);
    }

    async addAccount(accountData: Omit<Account, 'id' | 'created'>) {
        // Check for duplicates? MVP warning/skip can be done in UI logic or here.
        // For now simple add.
        const exists = this.accountsSignal().find(a =>
            a.issuer === accountData.issuer &&
            a.label === accountData.label &&
            a.secret === accountData.secret
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
            period: period
        });

        const code = totp.generate({ timestamp });

        // progress
        // otpauth doesn't give precise progress but we can calc it.
        const epoch = Math.floor(timestamp / 1000);
        const progress = (epoch % period) / period; // 0..1 ascending 
        // Usually auth apps show countdown (1..0) or progress. 
        // Let's do remaining ratio:
        const remaining = period - (epoch % period);
        const progressRatio = remaining / period;

        return {
            account,
            code,
            progress: progressRatio
        };
    }

    parseUrl(url: string): Partial<Account> {
        try {
            const parsed = URI.parse(url);
            if (!(parsed instanceof TOTP)) {
                throw new Error('Only TOTP supported');
            }
            return {
                issuer: parsed.issuer || 'Unknown',
                label: parsed.label || 'Unknown',
                secret: parsed.secret.base32,
                algorithm: parsed.algorithm,
                digits: parsed.digits,
                period: parsed.period
            };
        } catch (e) {
            throw new Error('Invalid OTP URL');
        }
    }
}
