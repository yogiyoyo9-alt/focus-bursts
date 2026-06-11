import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('networth.db');
  return db;
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  await database.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      institution_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      credential_key TEXT NOT NULL,
      category TEXT NOT NULL,
      last_synced_at TEXT,
      last_sync_status TEXT NOT NULL DEFAULT 'never',
      last_value REAL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS portfolio_snapshots (
      id TEXT PRIMARY KEY,
      captured_at TEXT NOT NULL,
      total_net_worth REAL NOT NULL,
      equity REAL NOT NULL DEFAULT 0,
      debt REAL NOT NULL DEFAULT 0,
      cash REAL NOT NULL DEFAULT 0,
      pf REAL NOT NULL DEFAULT 0,
      nps REAL NOT NULL DEFAULT 0,
      other REAL NOT NULL DEFAULT 0,
      account_count INTEGER NOT NULL,
      failed_accounts TEXT
    );

    CREATE TABLE IF NOT EXISTS account_snapshots (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      snapshot_group_id TEXT NOT NULL,
      captured_at TEXT NOT NULL,
      value_inr REAL NOT NULL,
      raw_data TEXT,
      category TEXT NOT NULL,
      FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
      FOREIGN KEY(snapshot_group_id) REFERENCES portfolio_snapshots(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_snapshots_captured_at ON portfolio_snapshots(captured_at DESC);
    CREATE INDEX IF NOT EXISTS idx_account_snapshots_account_id ON account_snapshots(account_id);
    CREATE INDEX IF NOT EXISTS idx_account_snapshots_group ON account_snapshots(snapshot_group_id);
  `);
}
