import type { AssetCategory } from './account';

export interface AssetBreakdown {
  equity: number;
  debt: number;
  cash: number;
  pf: number;
  nps: number;
  other: number;
}

export interface AccountSnapshot {
  id: string;
  accountId: string;
  snapshotGroupId: string;
  capturedAt: string;
  valueInr: number;
  rawData: string;
  category: AssetCategory;
}

export interface PortfolioSnapshot {
  id: string;
  capturedAt: string;
  totalNetWorth: number;
  breakdown: AssetBreakdown;
  accountCount: number;
  failedAccounts: string[];
}

export interface NetWorthDataPoint {
  date: string;
  totalInr: number;
  breakdown: AssetBreakdown;
}
