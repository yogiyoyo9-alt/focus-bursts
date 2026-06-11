import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useNetWorth } from '@/hooks/useNetWorth';
import { useAccountStore } from '@/store/accountStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { useUIStore } from '@/store/uiStore';
import { NetWorthHeader } from '@/components/dashboard/NetWorthHeader';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { AccountCard } from '@/components/accounts/AccountCard';
import { Card } from '@/components/common/Card';

export default function DashboardScreen() {
  const router = useRouter();
  const { totalNetWorth, breakdown, lastUpdated, changeAmount, changePercent } = useNetWorth();
  const accounts = useAccountStore((s) => s.accounts);
  const loadLatest = usePortfolioStore((s) => s.loadLatest);
  const isSyncing = useUIStore((s) => s.isSyncing);

  const handleRefresh = useCallback(async () => {
    await loadLatest();
  }, [loadLatest]);

  const handleSyncAccount = useCallback(
    (accountId: string) => {
      router.push(`/scrape/${accountId}`);
    },
    [router],
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={isSyncing}
          onRefresh={handleRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <NetWorthHeader
        totalNetWorth={totalNetWorth}
        changeAmount={changeAmount}
        changePercent={changePercent}
        lastUpdated={lastUpdated}
      />

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <CategoryBreakdown breakdown={breakdown} total={totalNetWorth} />
      </Card>

      <View style={styles.accountsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Accounts</Text>
          <TouchableOpacity onPress={() => router.push('/account/add')}>
            <Text style={styles.addBtn}>+ Add</Text>
          </TouchableOpacity>
        </View>
        {accounts.length === 0 ? (
          <Card>
            <Text style={styles.emptyText}>No accounts added yet.</Text>
            <TouchableOpacity
              style={styles.addAccountBtn}
              onPress={() => router.push('/account/add')}
            >
              <Text style={styles.addAccountBtnText}>Add your first account</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          accounts.slice(0, 5).map((account) => (
            <AccountCard
              key={account.id}
              account={account}
              onPress={() => router.push(`/account/${account.id}`)}
              onSync={() => handleSyncAccount(account.id)}
            />
          ))
        )}
      </View>
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
    gap: 16,
    paddingBottom: 40,
  },
  card: {
    gap: 12,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  accountsSection: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  addBtn: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  addAccountBtn: {
    backgroundColor: Colors.primaryDim,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addAccountBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
