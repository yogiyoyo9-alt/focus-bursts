import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Colors, categoryColor } from '@/constants/colors';
import type { Account } from '@/types/account';
import { INSTITUTIONS } from '@/constants/institutions';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

interface AccountCardProps {
  account: Account;
  onPress: () => void;
  onSync: () => void;
  isSyncing?: boolean;
}

export function AccountCard({ account, onPress, onSync, isSyncing }: AccountCardProps) {
  const institution = INSTITUTIONS[account.institutionId];

  const statusColor =
    account.lastSyncStatus === 'success'
      ? Colors.success
      : account.lastSyncStatus === 'failed'
        ? Colors.danger
        : Colors.textMuted;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.institutionBadge, { backgroundColor: institution.color + '33' }]}>
        <Text style={[styles.badgeText, { color: institution.color }]}>
          {institution.shortName.substring(0, 2).toUpperCase()}
        </Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.nickname} numberOfLines={1}>
          {account.nickname}
        </Text>
        <Text style={styles.institution}>{institution.name}</Text>
        {account.lastSyncedAt && (
          <Text style={[styles.syncTime, { color: statusColor }]}>
            {account.lastSyncStatus === 'failed' ? '✕ Sync failed · ' : ''}
            {formatRelativeTime(account.lastSyncedAt)}
          </Text>
        )}
        {!account.lastSyncedAt && (
          <Text style={styles.syncTime}>Never synced</Text>
        )}
      </View>

      <View style={styles.right}>
        {account.lastValue != null && (
          <Text style={styles.value}>{formatCurrency(account.lastValue)}</Text>
        )}
        <View
          style={[styles.categoryDot, { backgroundColor: categoryColor[account.category] }]}
        />
        <TouchableOpacity
          style={styles.syncBtn}
          onPress={onSync}
          disabled={isSyncing}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.syncBtnText}>↻</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  institutionBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nickname: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  institution: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  syncTime: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
  },
  value: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  syncBtn: {
    padding: 4,
  },
  syncBtnText: {
    color: Colors.primary,
    fontSize: 18,
  },
});
