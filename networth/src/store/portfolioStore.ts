import { create } from 'zustand';
import type { AccountSnapshot, PortfolioSnapshot, NetWorthDataPoint } from '@/types/portfolio';
import * as snapshotRepo from '@/db/snapshotRepo';

interface PortfolioState {
  latestSnapshot: PortfolioSnapshot | null;
  history: NetWorthDataPoint[];
  accountSnapshots: AccountSnapshot[];
  loadLatest: () => Promise<void>;
  loadHistory: (days: number) => Promise<void>;
  saveSnapshot: (snapshot: PortfolioSnapshot, accountSnapshots: AccountSnapshot[]) => Promise<void>;
}

export const usePortfolioStore = create<PortfolioState>((set) => ({
  latestSnapshot: null,
  history: [],
  accountSnapshots: [],

  loadLatest: async () => {
    const latestSnapshot = await snapshotRepo.getLatestPortfolioSnapshot();
    set({ latestSnapshot });
  },

  loadHistory: async (days) => {
    const history = await snapshotRepo.getNetWorthHistory(days);
    set({ history });
  },

  saveSnapshot: async (snapshot, accountSnapshots) => {
    await snapshotRepo.insertPortfolioSnapshot(snapshot, accountSnapshots);
    set({ latestSnapshot: snapshot });
  },
}));
