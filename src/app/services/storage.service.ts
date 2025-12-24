import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

export interface Account {
  id: string;
  issuer: string;
  label: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
  type: 'totp';
  created: number;
  folder?: string;
}

interface SigilDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-created': number };
  };
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private dbPromise: Promise<IDBPDatabase<SigilDB>>;

  constructor() {
    this.dbPromise = openDB<SigilDB>('sigil-db', 1, {
      upgrade(db) {
        const store = db.createObjectStore('accounts', { keyPath: 'id' });
        store.createIndex('by-created', 'created');
      },
    });
  }

  async getAccounts(): Promise<Account[]> {
    const db = await this.dbPromise;
    const accounts = await db.getAll('accounts');
    return accounts.sort((a, b) => a.created - b.created);
  }

  async addAccount(account: Omit<Account, 'id' | 'created'>): Promise<Account> {
    const db = await this.dbPromise;
    const newAccount: Account = {
      ...account,
      id: uuidv4(),
      created: Date.now(),
    };
    await db.put('accounts', newAccount);
    return newAccount;
  }

  async updateAccount(account: Account): Promise<void> {
    const db = await this.dbPromise;
    await db.put('accounts', account);
  }

  async deleteAccount(id: string): Promise<void> {
    const db = await this.dbPromise;
    await db.delete('accounts', id);
  }
}
