import { create } from 'zustand';
import type { Institution } from '@/types/account';
import { INSTITUTIONS } from '@/constants/institutions';
import * as customRepo from '@/db/customInstitutionRepo';

// Palette used to auto-assign a colour to custom institutions.
const CUSTOM_COLORS = [
  '#58A6FF',
  '#3FB950',
  '#D29922',
  '#DB61A2',
  '#A371F7',
  '#F778BA',
  '#56D4DD',
  '#E3826D',
];

export function pickCustomColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return CUSTOM_COLORS[Math.abs(hash) % CUSTOM_COLORS.length];
}

function fallbackInstitution(id: string): Institution {
  return {
    id,
    name: 'Unknown Institution',
    shortName: id.slice(0, 6).toUpperCase(),
    category: 'other',
    loginUrl: '',
    scrapingMethod: 'manual_entry',
    credentialFields: [],
    color: '#8B949E',
  };
}

function buildById(custom: Institution[]): Record<string, Institution> {
  const map: Record<string, Institution> = { ...INSTITUTIONS };
  for (const inst of custom) map[inst.id] = inst;
  return map;
}

interface InstitutionState {
  custom: Institution[];
  byId: Record<string, Institution>;
  loaded: boolean;
  loadCustom: () => Promise<void>;
  addCustom: (inst: Institution) => Promise<void>;
  removeCustom: (id: string) => Promise<void>;
  getInstitution: (id: string) => Institution;
}

export const useInstitutionStore = create<InstitutionState>((set, get) => ({
  custom: [],
  byId: buildById([]),
  loaded: false,

  loadCustom: async () => {
    const custom = await customRepo.getAllCustomInstitutions();
    set({ custom, byId: buildById(custom), loaded: true });
  },

  addCustom: async (inst) => {
    await customRepo.insertCustomInstitution(inst);
    set((state) => {
      const custom = [...state.custom, inst];
      return { custom, byId: buildById(custom) };
    });
  },

  removeCustom: async (id) => {
    await customRepo.deleteCustomInstitution(id);
    set((state) => {
      const custom = state.custom.filter((c) => c.id !== id);
      return { custom, byId: buildById(custom) };
    });
  },

  getInstitution: (id) => get().byId[id] ?? fallbackInstitution(id),
}));

// Non-hook accessor for use outside React (e.g. stores, utilities).
export function resolveInstitution(id: string): Institution {
  return useInstitutionStore.getState().getInstitution(id);
}
