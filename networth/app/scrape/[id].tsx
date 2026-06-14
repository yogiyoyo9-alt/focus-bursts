import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAccountStore } from '@/store/accountStore';
import { usePortfolioStore } from '@/store/portfolioStore';
import { ScrapingWebView } from '@/components/scraping/ScrapingWebView';
import type { ScrapingResult } from '@/types/scraping';
import type { AssetBreakdown } from '@/types/portfolio';
import { genId } from '@/utils/id';
import * as snapshotRepo from '@/db/snapshotRepo';

export default function ScrapeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accounts = useAccountStore((s) => s.accounts);
  const updateSyncStatusWithValue = useAccountStore((s) => s.updateSyncStatusWithValue);
  const updateSyncStatus = useAccountStore((s) => s.updateSyncStatus);
  const loadLatest = usePortfolioStore((s) => s.loadLatest);
  const loadHistory = usePortfolioStore((s) => s.loadHistory);

  const account = accounts.find((a) => a.id === id);

  const handleComplete = useCallback(
    async (result: ScrapingResult) => {
      const now = result.scrapedAt;
      if (result.success && result.valueInr != null) {
        await updateSyncStatusWithValue(result.accountId, 'success', now, result.valueInr);
      } else {
        await updateSyncStatus(result.accountId, 'failed', now);
      }

      if (result.success && result.valueInr != null) {
        const groupId = genId();
        const otherLatestValues = accounts
          .filter((a) => a.id !== result.accountId && a.lastValue != null)
          .reduce<number>((sum, a) => sum + (a.lastValue ?? 0), 0);

        const total = result.valueInr + otherLatestValues;
        const cat = account?.category ?? 'other';
        const breakdown: AssetBreakdown = {
          equity: 0,
          debt: 0,
          cash: 0,
          pf: 0,
          nps: 0,
          other: 0,
        };
        breakdown[cat] = result.valueInr;

        await snapshotRepo.insertPortfolioSnapshot(
          {
            id: groupId,
            capturedAt: now,
            totalNetWorth: total,
            breakdown,
            accountCount: 1,
            failedAccounts: [],
          },
          [
            {
              id: genId(),
              accountId: result.accountId,
              snapshotGroupId: groupId,
              capturedAt: now,
              valueInr: result.valueInr,
              rawData: JSON.stringify(result.rawData ?? {}),
              category: cat,
            },
          ],
        );
        await loadLatest();
        await loadHistory(90);
      }

      if (result.success) {
        Alert.alert('Sync Complete', 'Balance fetched successfully.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        Alert.alert('Sync Failed', result.error ?? 'Unknown error', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      }
    },
    [account, accounts, updateSyncStatus, updateSyncStatusWithValue, loadLatest, loadHistory, router],
  );

  if (!account) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Account not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Text style={styles.closeBtnText}>✕ Cancel</Text>
      </TouchableOpacity>
      <ScrapingWebView account={account} onComplete={handleComplete} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignSelf: 'flex-end',
  },
  closeBtnText: { color: Colors.textSecondary, fontSize: 14 },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { color: Colors.textSecondary, fontSize: 15 },
  backText: { color: Colors.primary, fontSize: 14 },
});
