import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Account, InstitutionId, AssetCategory, EncryptedCredentialPayload } from '@/types/account';
import * as accountRepo from '@/db/accountRepo';
import { saveCredentials, deleteCredentials } from '@/security/credentialStore';

interface AccountState {
  accounts: Account[];
  loaded: boolean;
  loadAccounts: () => Promise<void>;
  addAccount: (
    params: {
      institutionId: InstitutionId;
      nickname: string;
      category: AssetCategory;
    },
    credentials: Record<string, string>,
  ) => Promise<Account>;
  removeAccount: (id: string) => Promise<void>;
  updateSyncStatus: (
    id: string,
    status: Account['lastSyncStatus'],
    syncedAt: string,
  ) => Promise<void>;
  updateSyncStatusWithValue: (
    id: string,
    status: Account['lastSyncStatus'],
    syncedAt: string,
    lastValue: number,
  ) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  loaded: false,

  loadAccounts: async () => {
    const accounts = await accountRepo.getAllAccounts();
    set({ accounts, loaded: true });
  },

  addAccount: async (params, credentials) => {
    const id = uuidv4();
    const credentialKey = `cred_${id}`;
    const account: Account = {
      id,
      institutionId: params.institutionId,
      nickname: params.nickname,
      credentialKey,
      category: params.category,
      lastSyncedAt: null,
      lastSyncStatus: 'never',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const payload: EncryptedCredentialPayload = {
      accountId: id,
      institutionId: params.institutionId,
      fields: credentials,
    };
    await saveCredentials(id, payload);
    await accountRepo.insertAccount(account);
    set((state) => ({ accounts: [...state.accounts, account] }));
    return account;
  },

  removeAccount: async (id) => {
    await deleteCredentials(id);
    await accountRepo.deleteAccount(id);
    set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
  },

  updateSyncStatus: async (id, status, syncedAt) => {
    await accountRepo.updateSyncStatus(id, status, syncedAt);
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, lastSyncStatus: status, lastSyncedAt: syncedAt } : a,
      ),
    }));
  },

  updateSyncStatusWithValue: async (id, status, syncedAt, lastValue) => {
    await accountRepo.updateSyncStatus(id, status, syncedAt, lastValue);
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === id ? { ...a, lastSyncStatus: status, lastSyncedAt: syncedAt, lastValue } : a,
      ),
    }));
  },
}));
