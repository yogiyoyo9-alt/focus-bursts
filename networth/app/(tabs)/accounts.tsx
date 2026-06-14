import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAccountStore } from '@/store/accountStore';
import { AccountCard } from '@/components/accounts/AccountCard';
import { INSTITUTION_GROUPS } from '@/constants/institutions';
import type { InstitutionId } from '@/types/account';

export default function AccountsScreen() {
  const router = useRouter();
  const accounts = useAccountStore((s) => s.accounts);
  const removeAccount = useAccountStore((s) => s.removeAccount);

  const handleSync = useCallback(
    (accountId: string) => {
      router.push(`/scrape/${accountId}`);
    },
    [router],
  );

  const handleDelete = useCallback(
    (accountId: string, nickname: string) => {
      Alert.alert('Remove Account', `Remove "${nickname}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => void removeAccount(accountId),
        },
      ]);
    },
    [removeAccount],
  );

  const knownIds = new Set<string>(
    Object.values(INSTITUTION_GROUPS).flat() as InstitutionId[],
  );
  const groupedAccounts = Object.entries(INSTITUTION_GROUPS)
    .map(([groupName, institutionIds]) => ({
      groupName,
      accounts: accounts.filter((a) =>
        (institutionIds as InstitutionId[]).includes(a.institutionId as InstitutionId),
      ),
    }))
    .filter((g) => g.accounts.length > 0);

  // Custom institutions aren't part of any built-in group — gather them here.
  const otherAccounts = accounts.filter((a) => !knownIds.has(a.institutionId));
  if (otherAccounts.length > 0) {
    groupedAccounts.push({ groupName: 'Custom & Other', accounts: otherAccounts });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No accounts yet</Text>
          <Text style={styles.emptyText}>
            Add your bank, broker, EPFO or NPS accounts to start tracking your net worth.
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/account/add')}
          >
            <Text style={styles.addBtnText}>Add Account</Text>
          </TouchableOpacity>
        </View>
      ) : (
        groupedAccounts.map(({ groupName, accounts: groupAccounts }) => (
          <View key={groupName} style={styles.group}>
            <Text style={styles.groupHeader}>{groupName}</Text>
            {groupAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPress={() => router.push(`/account/${account.id}`)}
                onSync={() => handleSync(account.id)}
              />
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
    gap: 8,
  },
  group: {
    gap: 4,
    marginBottom: 16,
  },
  groupHeader: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  addBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginTop: 8,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
