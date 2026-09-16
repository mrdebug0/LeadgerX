import fs from 'fs';
import path from 'path';
import { User, Entry, Customer, InventoryItem, UdhaarRecord, ChatMessage } from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

export interface DatabaseSchema {
  users: User[];
  entries: Entry[];
  customers: Customer[];
  inventory: InventoryItem[];
  udhaar: UdhaarRecord[];
  chatHistory: ChatMessage[];
  stores?: any[];
  storeMembers?: any[];
  auditLogs?: any[];
  invoiceTemplates?: any[];
  notifications?: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  users: [],
  stores: [],
  storeMembers: [],
  entries: [],
  customers: [],
  inventory: [],
  udhaar: [],
  chatHistory: [],
  auditLogs: [],
  invoiceTemplates: [],
  notifications: []
};

let cachedDb: DatabaseSchema | null = null;

export class LocalStore {
  private static init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      this.save(DEFAULT_DB);
    }
  }

  private static load(): DatabaseSchema {
    if (cachedDb) {
      return cachedDb;
    }
    this.init();
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        cachedDb = JSON.parse(raw);
        return cachedDb!;
      }
    } catch (e) {
      console.error("Error reading database file, resetting to safe defaults:", e);
    }
    cachedDb = JSON.parse(JSON.stringify(DEFAULT_DB));
    return cachedDb!;
  }

  private static save(data: DatabaseSchema) {
    this.init();
    cachedDb = data;
    const tempFile = `${DB_FILE}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`;
    try {
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("Failed atomic database write, falling back to direct write:", err);
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      } catch (directErr) {
        console.error("Fatal: failed direct database write:", directErr);
      }
    } finally {
      if (fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch {}
      }
    }
  }

  // Get all data
  public static getAll(): DatabaseSchema {
    return this.load();
  }

  // Generic DB setter with atomic disk flush
  public static updateAll(updater: (db: DatabaseSchema) => void) {
    const db = this.load();
    updater(db);
    this.save(db);
  }

  // Force re-read from disk (useful after external modifications or initial seeder)
  public static reload(): DatabaseSchema {
    cachedDb = null;
    return this.load();
  }

  // Helper getters
  public static getUsers() { return this.load().users; }
  public static getEntries() { return this.load().entries; }
  public static getCustomers() { return this.load().customers; }
  public static getInventory() { return this.load().inventory; }
  public static getUdhaar() { return this.load().udhaar; }
  public static getChatHistory() { return this.load().chatHistory; }
}
