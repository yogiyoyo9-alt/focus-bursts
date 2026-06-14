export type AssetCategory = 'equity' | 'debt' | 'cash' | 'pf' | 'nps' | 'other';

export type InstitutionId =
  | 'sbi'
  | 'hdfc'
  | 'icici'
  | 'axis'
  | 'kotak'
  | 'zerodha'
  | 'groww'
  | 'upstox'
  | 'angelone'
  | 'etmoney'
  | 'cams'
  | 'kfintech'
  | 'epfo'
  | 'nps_nsdl';

export type ScrapingMethod = 'webview_auto' | 'webview_manual' | 'manual_entry';

export interface CredentialFieldDef {
  key: string;
  label: string;
  type: 'text' | 'password' | 'number';
  placeholder?: string;
}

export interface Institution {
  // Built-in institutions use the InstitutionId union; custom ones use a
  // generated `custom_<id>` string — so this is widened to string.
  id: string;
  name: string;
  shortName: string;
  category: AssetCategory;
  loginUrl: string;
  scrapingMethod: ScrapingMethod;
  credentialFields: CredentialFieldDef[];
  color: string;
  notes?: string;
  isCustom?: boolean;
}

export interface Account {
  id: string;
  institutionId: string;
  nickname: string;
  credentialKey: string;
  category: AssetCategory;
  lastSyncedAt: string | null;
  lastSyncStatus: 'success' | 'failed' | 'never' | 'partial';
  lastValue?: number;
  // CSS selector remembered from a tap-to-capture sync, so future syncs can
  // read the same on-page value automatically.
  captureSelector?: string;
  isActive: boolean;
  createdAt: string;
}

export interface EncryptedCredentialPayload {
  accountId: string;
  institutionId: string;
  fields: Record<string, string>;
}
