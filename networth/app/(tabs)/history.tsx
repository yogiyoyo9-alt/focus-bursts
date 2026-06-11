import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/colors';
import { usePortfolioStore } from '@/store/portfolioStore';
import { NetWorthChart } from '@/components/history/NetWorthChart';
import { Card } from '@/components/common/Card';
import { formatCurrencyFull } from '@/utils/format';

const PERIODS: { label: string; days: number }[] = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  { label: '1Y', days: 365 },
];

export default function HistoryScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState(30);
  const { history, loadHistory } = usePortfolioStore();

  const handlePeriodChange = useCallback(
    async (days: number) => {
      setSelectedPeriod(days);
      await loadHistory(days);
    },
    [loadHistory],
  );

  const filteredHistory = history.filter((d) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - selectedPeriod);
    return new Date(d.date) >= cutoff;
  });

  const latestValue = filteredHistory[filteredHistory.length - 1]?.totalInr ?? 0;
  const earliestValue = filteredHistory[0]?.totalInr ?? 0;
  const changeAmount = latestValue - earliestValue;
  const changePercent = earliestValue > 0 ? (changeAmount / earliestValue) * 100 : 0;
  const isPositive = changeAmount >= 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <View style={styles.periodSelector}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.days}
            style={[styles.periodBtn, selectedPeriod === p.days && styles.periodBtnActive]}
            onPress={() => void handlePeriodChange(p.days)}
          >
            <Text
              style={[
                styles.periodBtnText,
                selectedPeriod === p.days && styles.periodBtnTextActive,
              ]}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredHistory.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryValue}>{formatCurrencyFull(latestValue)}</Text>
          <Text style={[styles.summaryChange, { color: isPositive ? Colors.success : Colors.danger }]}>
            {isPositive ? '+' : ''}
            {formatCurrencyFull(changeAmount)} ({isPositive ? '+' : ''}
            {changePercent.toFixed(2)}%)
          </Text>
          <Text style={styles.summaryPeriod}>
            over the last {selectedPeriod} days
          </Text>
        </View>
      )}

      <Card>
        <NetWorthChart data={filteredHistory} />
      </Card>

      {filteredHistory.length > 0 && (
        <View style={styles.dataPoints}>
          <Text style={styles.dataPointsTitle}>Data Points</Text>
          {[...filteredHistory].reverse().slice(0, 15).map((d) => (
            <View key={d.date} style={styles.dataRow}>
              <Text style={styles.dataDate}>{d.date}</Text>
              <Text style={styles.dataValue}>{formatCurrencyFull(d.totalInr)}</Text>
            </View>
          ))}
        </View>
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
    gap: 16,
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodBtnActive: {
    backgroundColor: Colors.primaryDim,
  },
  periodBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  periodBtnTextActive: {
    color: Colors.primary,
  },
  summary: {
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  summaryChange: {
    fontSize: 15,
    fontWeight: '500',
  },
  summaryPeriod: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  dataPoints: {
    gap: 1,
  },
  dataPointsTitle: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataDate: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  dataValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
});
