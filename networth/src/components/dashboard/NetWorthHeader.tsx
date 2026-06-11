import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

interface NetWorthHeaderProps {
  totalNetWorth: number;
  changeAmount: number;
  changePercent: number;
  lastUpdated: string | null;
}

export function NetWorthHeader({
  totalNetWorth,
  changeAmount,
  changePercent,
  lastUpdated,
}: NetWorthHeaderProps) {
  const isPositive = changeAmount >= 0;
  const changeColor = isPositive ? Colors.success : Colors.danger;
  const changePrefix = isPositive ? '+' : '';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Total Net Worth</Text>
      <Text style={styles.totalAmount}>{formatCurrency(totalNetWorth)}</Text>
      {changeAmount !== 0 && (
        <Text style={[styles.change, { color: changeColor }]}>
          {changePrefix}
          {formatCurrency(changeAmount)} ({changePrefix}
          {changePercent.toFixed(2)}%)
        </Text>
      )}
      {lastUpdated && (
        <Text style={styles.lastUpdated}>Updated {formatRelativeTime(lastUpdated)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 4,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  totalAmount: {
    color: Colors.textPrimary,
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  change: {
    fontSize: 14,
    fontWeight: '500',
  },
  lastUpdated: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
