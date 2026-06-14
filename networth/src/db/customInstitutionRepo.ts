import type { Institution, CredentialFieldDef } from '@/types/account';
import { getDatabase } from './schema';

interface CustomInstitutionRow {
  id: string;
  name: string;
  short_name: string;
  category: string;
  login_url: string;
  color: string;
  credential_fields: string;
  created_at: string;
}

function rowToInstitution(row: CustomInstitutionRow): Institution {
  let fields: CredentialFieldDef[] = [];
  try {
    fields = JSON.parse(row.credential_fields) as CredentialFieldDef[];
  } catch {
    fields = [];
  }
  return {
    id: row.id,
    name: row.name,
    shortName: row.short_name,
    category: row.category as Institution['category'],
    loginUrl: row.login_url,
    color: row.color,
    credentialFields: fields,
    scrapingMethod: 'webview_auto',
    isCustom: true,
  };
}

export async function getAllCustomInstitutions(): Promise<Institution[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CustomInstitutionRow>(
    'SELECT * FROM custom_institutions ORDER BY created_at ASC',
  );
  return rows.map(rowToInstitution);
}

export async function insertCustomInstitution(inst: Institution): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO custom_institutions (id, name, short_name, category, login_url, color, credential_fields, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    inst.id,
    inst.name,
    inst.shortName,
    inst.category,
    inst.loginUrl,
    inst.color,
    JSON.stringify(inst.credentialFields),
    new Date().toISOString(),
  );
}

export async function deleteCustomInstitution(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM custom_institutions WHERE id = ?', id);
}
