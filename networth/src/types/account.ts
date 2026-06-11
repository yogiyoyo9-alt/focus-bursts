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
  id: InstitutionId;
  name: string;
  shortName: string;
  category: AssetCategory;
  loginUrl: string;
  scrapingMethod: ScrapingMethod;
  credentialFields: CredentialFieldDef[];
  color: string;
  notes?: string;
}

export interface Account {
  id: string;
  institutionId: InstitutionId;
  nickname: string;
  credentialKey: string;
  category: AssetCategory;
  lastSyncedAt: string | null;
  lastSyncStatus: 'success' | 'failed' | 'never' | 'partial';
  lastValue?: number;
  isActive: boolean;
  createdAt: string;
}

export interface EncryptedCredentialPayload {
  accountId: string;
  institutionId: InstitutionId;
  fields: Record<string, string>;
}
