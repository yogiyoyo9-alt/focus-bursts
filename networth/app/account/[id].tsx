import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, categoryColor } from '@/constants/colors';
import { useAccountStore } from '@/store/accountStore';
import { useInstitutionStore } from '@/store/institutionStore';
import { formatCurrency, formatCurrencyFull, formatRelativeTime } from '@/utils/format';
import { Card } from '@/components/common/Card';
import { genId } from '@/utils/id';
import { usePortfolioStore } from '@/store/portfolioStore';
import * as snapshotRepo from '@/db/snapshotRepo';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accounts = useAccountStore((s) => s.accounts);
  const removeAccount = useAccountStore((s) => s.removeAccount);
  const loadLatest = usePortfolioStore((s) => s.loadLatest);

  const account = accounts.find((a) => a.id === id);
  const institution = useInstitutionStore((s) => s.getInstitution(account?.institutionId ?? ''));
  const [manualValue, setManualValue] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  const handleDelete = useCallback(() => {
    Alert.alert('Remove Account', `Remove "${account?.nickname}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await removeAccount(id!);
          router.back();
        },
      },
    ]);
  }, [account, removeAccount, id, router]);

  const handleSaveManual = useCallback(async () => {
    if (!account || !manualValue) return;
    const value = parseFloat(manualValue.replace(/[^0-9.]/g, ''));
    if (isNaN(value) || value < 0) {
      Alert.alert('Invalid', 'Please enter a valid amount.');
      return;
    }
    setSavingManual(true);
    try {
      const now = new Date().toISOString();
      const snapshotGroupId = genId();
      await snapshotRepo.insertPortfolioSnapshot(
        {
          id: snapshotGroupId,
          capturedAt: now,
          totalNetWorth: value,
          breakdown: { equity: 0, debt: 0, cash: 0, pf: 0, nps: 0, other: 0 },
          accountCount: 1,
          failedAccounts: [],
        },
        [
          {
            id: genId(),
            accountId: account.id,
            snapshotGroupId,
            capturedAt: now,
            valueInr: value,
            rawData: JSON.stringify({ manual: true }),
            category: account.category,
          },
        ],
      );
      await loadLatest();
      setManualValue('');
      Alert.alert('Saved', 'Balance updated successfully.');
    } catch {
      Alert.alert('Error', 'Could not save balance.');
    } finally {
      setSavingManual(false);
    }
  }, [account, manualValue, loadLatest]);

  if (!account) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Account not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Card style={styles.headerCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.badge, { backgroundColor: institution.color + '33' }]}>
            <Text style={[styles.badgeText, { color: institution.color }]}>
              {institution.shortName.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.nickname}>{account.nickname}</Text>
            <Text style={styles.institutionName}>{institution.name}</Text>
          </View>
          <View style={[styles.categoryChip, { backgroundColor: categoryColor[account.category] + '33' }]}>
            <Text style={[styles.categoryText, { color: categoryColor[account.category] }]}>
              {account.category.toUpperCase()}
            </Text>
          </View>
        </View>

        {account.lastValue != null && (
          <View style={styles.valueRow}>
            <Text style={styles.valueLabel}>Last Known Balance</Text>
            <Text style={styles.value}>{formatCurrencyFull(account.lastValue)}</Text>
          </View>
        )}

        {account.lastSyncedAt && (
          <Text style={styles.syncTime}>
            Last synced {formatRelativeTime(account.lastSyncedAt)} · {account.lastSyncStatus}
          </Text>
        )}
      </Card>

      <TouchableOpacity
        style={styles.syncBtn}
        onPress={() => router.push(`/scrape/${account.id}`)}
      >
        <Text style={styles.syncBtnText}>Sync Now</Text>
      </TouchableOpacity>

      <Card>
        <Text style={styles.sectionTitle}>Manual Entry</Text>
        <Text style={styles.manualHint}>
          Override the balance manually (useful if sync fails or for unsupported institutions).
        </Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.manualInput}
            value={manualValue}
            onChangeText={setManualValue}
            placeholder="Enter amount in INR"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
          />
          <TouchableOpacity
            style={[styles.manualSaveBtn, savingManual && styles.disabled]}
            onPress={handleSaveManual}
            disabled={savingManual}
          >
            <Text style={styles.manualSaveBtnText}>{savingManual ? '…' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </Card>

      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Remove Account</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: Colors.textSecondary },
  headerCard: { gap: 12 },
  accountHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 16, fontWeight: '700' },
  accountInfo: { flex: 1 },
  nickname: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  institutionName: { color: Colors.textSecondary, fontSize: 13 },
  categoryChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  categoryText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  valueRow: { gap: 2 },
  valueLabel: { color: Colors.textMuted, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { color: Colors.textPrimary, fontSize: 24, fontWeight: '700' },
  syncTime: { color: Colors.textMuted, fontSize: 12 },
  syncBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  syncBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  sectionTitle: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
  manualHint: { color: Colors.textMuted, fontSize: 12, marginBottom: 8 },
  manualRow: { flexDirection: 'row', gap: 8 },
  manualInput: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 15,
    padding: 10,
  },
  manualSaveBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, justifyContent: 'center' },
  manualSaveBtnText: { color: '#fff', fontWeight: '600' },
  disabled: { opacity: 0.5 },
  deleteBtn: {
    borderWidth: 1,
    borderColor: Colors.dangerDim,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  deleteBtnText: { color: Colors.danger, fontSize: 14, fontWeight: '500' },
});
