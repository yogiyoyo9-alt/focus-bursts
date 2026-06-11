import { usePortfolioStore } from '@/store/portfolioStore';
import type { AssetBreakdown } from '@/types/portfolio';

const EMPTY_BREAKDOWN: AssetBreakdown = {
  equity: 0,
  debt: 0,
  cash: 0,
  pf: 0,
  nps: 0,
  other: 0,
};

export function useNetWorth() {
  const { latestSnapshot, history } = usePortfolioStore();

  const totalNetWorth = latestSnapshot?.totalNetWorth ?? 0;
  const breakdown = latestSnapshot?.breakdown ?? EMPTY_BREAKDOWN;
  const lastUpdated = latestSnapshot?.capturedAt ?? null;

  const previousSnapshot = history.length >= 2 ? history[history.length - 2] : null;
  const previousTotal = previousSnapshot?.totalInr ?? totalNetWorth;
  const changeAmount = totalNetWorth - previousTotal;
  const changePercent = previousTotal > 0 ? (changeAmount / previousTotal) * 100 : 0;

  return {
    totalNetWorth,
    breakdown,
    lastUpdated,
    changeAmount,
    changePercent,
    history,
  };
}
