import type { Account } from '@/types/account';
import { getDatabase } from './schema';

interface AccountRow {
  id: string;
  institution_id: string;
  nickname: string;
  credential_key: string;
  category: string;
  last_synced_at: string | null;
  last_sync_status: string;
  last_value: number | null;
  capture_selector: string | null;
  is_active: number;
  created_at: string;
}

function rowToAccount(row: AccountRow): Account {
  return {
    id: row.id,
    institutionId: row.institution_id,
    nickname: row.nickname,
    credentialKey: row.credential_key,
    category: row.category as Account['category'],
    lastSyncedAt: row.last_synced_at,
    lastSyncStatus: row.last_sync_status as Account['lastSyncStatus'],
    lastValue: row.last_value ?? undefined,
    captureSelector: row.capture_selector ?? undefined,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

export async function getAllAccounts(): Promise<Account[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<AccountRow>(
    'SELECT * FROM accounts WHERE is_active = 1 ORDER BY created_at ASC',
  );
  return rows.map(rowToAccount);
}

export async function insertAccount(account: Account): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO accounts (id, institution_id, nickname, credential_key, category, last_synced_at, last_sync_status, last_value, capture_selector, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    account.id,
    account.institutionId,
    account.nickname,
    account.credentialKey,
    account.category,
    account.lastSyncedAt,
    account.lastSyncStatus,
    account.lastValue ?? null,
    account.captureSelector ?? null,
    account.isActive ? 1 : 0,
    account.createdAt,
  );
}

export async function updateCaptureSelector(
  accountId: string,
  selector: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE accounts SET capture_selector = ? WHERE id = ?',
    selector,
    accountId,
  );
}

export async function updateSyncStatus(
  accountId: string,
  status: Account['lastSyncStatus'],
  syncedAt: string,
  lastValue?: number,
): Promise<void> {
  const db = await getDatabase();
  if (lastValue !== undefined) {
    await db.runAsync(
      'UPDATE accounts SET last_sync_status = ?, last_synced_at = ?, last_value = ? WHERE id = ?',
      status,
      syncedAt,
      lastValue,
      accountId,
    );
  } else {
    await db.runAsync(
      'UPDATE accounts SET last_sync_status = ?, last_synced_at = ? WHERE id = ?',
      status,
      syncedAt,
      accountId,
    );
  }
}

export async function deleteAccount(accountId: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE accounts SET is_active = 0 WHERE id = ?', accountId);
}
