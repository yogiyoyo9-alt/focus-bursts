import * as SecureStore from 'expo-secure-store';
import type { EncryptedCredentialPayload } from '@/types/account';

const CREDENTIAL_PREFIX = 'cred_';

export async function saveCredentials(
  accountId: string,
  payload: EncryptedCredentialPayload,
): Promise<void> {
  const key = CREDENTIAL_PREFIX + accountId;
  await SecureStore.setItemAsync(key, JSON.stringify(payload));
}

export async function loadCredentials(
  accountId: string,
): Promise<EncryptedCredentialPayload | null> {
  const key = CREDENTIAL_PREFIX + accountId;
  const raw = await SecureStore.getItemAsync(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as EncryptedCredentialPayload;
  } catch {
    return null;
  }
}

export async function deleteCredentials(accountId: string): Promise<void> {
  const key = CREDENTIAL_PREFIX + accountId;
  await SecureStore.deleteItemAsync(key);
}

export async function isOnboardingDone(): Promise<boolean> {
  const val = await SecureStore.getItemAsync('ONBOARDING_DONE');
  return val === '1';
}

export async function markOnboardingDone(): Promise<void> {
  await SecureStore.setItemAsync('ONBOARDING_DONE', '1');
}
