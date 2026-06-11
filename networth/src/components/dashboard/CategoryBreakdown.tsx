import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, categoryColor } from '@/constants/colors';
import type { AssetBreakdown } from '@/types/portfolio';
import { formatCurrency } from '@/utils/format';

interface CategoryBreakdownProps {
  breakdown: AssetBreakdown;
  total: number;
}

const CATEGORY_LABELS: Record<keyof AssetBreakdown, string> = {
  equity: 'Equity',
  debt: 'Debt',
  cash: 'Cash',
  pf: 'PF',
  nps: 'NPS',
  other: 'Other',
};

export function CategoryBreakdown({ breakdown, total }: CategoryBreakdownProps) {
  const entries = (Object.entries(breakdown) as [keyof AssetBreakdown, number][]).filter(
    ([, v]) => v > 0,
  );

  if (entries.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No data yet. Add accounts and sync to see breakdown.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {entries.map(([key, value]) => (
          <View
            key={key}
            style={[
              styles.segment,
              {
                flex: value / total,
                backgroundColor: categoryColor[key],
              },
            ]}
          />
        ))}
      </View>
      <View style={styles.legend}>
        {entries.map(([key, value]) => (
          <View key={key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: categoryColor[key] }]} />
            <View>
              <Text style={styles.legendLabel}>{CATEGORY_LABELS[key]}</Text>
              <Text style={styles.legendValue}>{formatCurrency(value)}</Text>
              <Text style={styles.legendPercent}>{((value / total) * 100).toFixed(1)}%</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    gap: 1,
  },
  segment: {
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: '28%',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 2,
  },
  legendLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  legendValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  legendPercent: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  empty: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
