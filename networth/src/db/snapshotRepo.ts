import type { AccountSnapshot, PortfolioSnapshot, NetWorthDataPoint, AssetBreakdown } from '@/types/portfolio';
import { getDatabase } from './schema';

interface PortfolioSnapshotRow {
  id: string;
  captured_at: string;
  total_net_worth: number;
  equity: number;
  debt: number;
  cash: number;
  pf: number;
  nps: number;
  other: number;
  account_count: number;
  failed_accounts: string | null;
}

function rowToPortfolioSnapshot(row: PortfolioSnapshotRow): PortfolioSnapshot {
  return {
    id: row.id,
    capturedAt: row.captured_at,
    totalNetWorth: row.total_net_worth,
    breakdown: {
      equity: row.equity,
      debt: row.debt,
      cash: row.cash,
      pf: row.pf,
      nps: row.nps,
      other: row.other,
    },
    accountCount: row.account_count,
    failedAccounts: row.failed_accounts ? JSON.parse(row.failed_accounts) as string[] : [],
  };
}

export async function insertPortfolioSnapshot(
  snapshot: PortfolioSnapshot,
  accountSnapshots: AccountSnapshot[],
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO portfolio_snapshots (id, captured_at, total_net_worth, equity, debt, cash, pf, nps, other, account_count, failed_accounts)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    snapshot.id,
    snapshot.capturedAt,
    snapshot.totalNetWorth,
    snapshot.breakdown.equity,
    snapshot.breakdown.debt,
    snapshot.breakdown.cash,
    snapshot.breakdown.pf,
    snapshot.breakdown.nps,
    snapshot.breakdown.other,
    snapshot.accountCount,
    JSON.stringify(snapshot.failedAccounts),
  );
  for (const as of accountSnapshots) {
    await db.runAsync(
      `INSERT INTO account_snapshots (id, account_id, snapshot_group_id, captured_at, value_inr, raw_data, category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      as.id,
      as.accountId,
      as.snapshotGroupId,
      as.capturedAt,
      as.valueInr,
      as.rawData,
      as.category,
    );
  }
}

export async function getLatestPortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PortfolioSnapshotRow>(
    'SELECT * FROM portfolio_snapshots ORDER BY captured_at DESC LIMIT 1',
  );
  if (!row) return null;
  return rowToPortfolioSnapshot(row);
}

export async function getNetWorthHistory(days: number): Promise<NetWorthDataPoint[]> {
  const db = await getDatabase();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const rows = await db.getAllAsync<PortfolioSnapshotRow>(
    `SELECT * FROM portfolio_snapshots WHERE captured_at >= ? ORDER BY captured_at ASC`,
    since.toISOString(),
  );
  const byDate = new Map<string, PortfolioSnapshotRow>();
  for (const row of rows) {
    const date = row.captured_at.substring(0, 10);
    byDate.set(date, row);
  }
  return Array.from(byDate.entries()).map(([date, row]) => ({
    date,
    totalInr: row.total_net_worth,
    breakdown: {
      equity: row.equity,
      debt: row.debt,
      cash: row.cash,
      pf: row.pf,
      nps: row.nps,
      other: row.other,
    } as AssetBreakdown,
  }));
}

export async function getAccountHistory(accountId: string, limit = 30): Promise<AccountSnapshot[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    account_id: string;
    snapshot_group_id: string;
    captured_at: string;
    value_inr: number;
    raw_data: string | null;
    category: string;
  }>(
    `SELECT * FROM account_snapshots WHERE account_id = ? ORDER BY captured_at DESC LIMIT ?`,
    accountId,
    limit,
  );
  return rows.map((r) => ({
    id: r.id,
    accountId: r.account_id,
    snapshotGroupId: r.snapshot_group_id,
    capturedAt: r.captured_at,
    valueInr: r.value_inr,
    rawData: r.raw_data ?? '{}',
    category: r.category as AccountSnapshot['category'],
  }));
}
