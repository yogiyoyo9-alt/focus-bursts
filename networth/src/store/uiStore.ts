import { create } from 'zustand';
import type { ScrapingPhase } from '@/types/scraping';

interface UIState {
  activeScrapeQueue: string[];
  currentScrapeAccountId: string | null;
  scrapePhase: ScrapingPhase;
  isLocked: boolean;
  isSyncing: boolean;
  setScrapePhase: (phase: ScrapingPhase) => void;
  setCurrentScrapeAccount: (accountId: string | null) => void;
  setScrapeQueue: (queue: string[]) => void;
  setLocked: (locked: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeScrapeQueue: [],
  currentScrapeAccountId: null,
  scrapePhase: 'idle',
  isLocked: false,
  isSyncing: false,

  setScrapePhase: (phase) => set({ scrapePhase: phase }),
  setCurrentScrapeAccount: (accountId) => set({ currentScrapeAccountId: accountId }),
  setScrapeQueue: (queue) => set({ activeScrapeQueue: queue }),
  setLocked: (locked) => set({ isLocked: locked }),
  setIsSyncing: (syncing) => set({ isSyncing: syncing }),
}));
