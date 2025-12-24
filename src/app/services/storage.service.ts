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
  order: number;
}

interface SigilDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
    indexes: { 'by-created': number; 'by-order': number };
  };
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private dbPromise: Promise<IDBPDatabase<SigilDB>>;

  constructor() {
    this.dbPromise = openDB<SigilDB>('sigil-db', 2, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('accounts', { keyPath: 'id' });
          store.createIndex('by-created', 'created');
          store.createIndex('by-order', 'order');
        }
        if (oldVersion >= 1 && oldVersion < 2) {
          const store = transaction.objectStore('accounts');
          if (!store.indexNames.contains('by-order')) {
            store.createIndex('by-order', 'order');
          }
        }
      },
    });
  }

  async getAccounts(): Promise<Account[]> {
    const db = await this.dbPromise;
    const accounts = await db.getAll('accounts');
    return accounts.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.created - b.created);
  }

  async addAccount(account: Omit<Account, 'id' | 'created' | 'order'>): Promise<Account> {
    const db = await this.dbPromise;
    const all = await this.getAccounts();
    const maxOrder = all.reduce((max, a) => Math.max(max, a.order ?? 0), -1);

    const newAccount: Account = {
      ...account,
      id: uuidv4(),
      created: Date.now(),
      order: maxOrder + 1,
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
