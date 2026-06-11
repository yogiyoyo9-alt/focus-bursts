import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '@/constants/colors';
import type { NetWorthDataPoint } from '@/types/portfolio';
import { formatCurrency } from '@/utils/format';

interface NetWorthChartProps {
  data: NetWorthDataPoint[];
}

const WIDTH = Dimensions.get('window').width - 64;
const HEIGHT = 100;

export function NetWorthChart({ data }: NetWorthChartProps) {
  if (data.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough data for a chart yet.</Text>
        <Text style={styles.emptyHint}>Sync your accounts over multiple days to see history.</Text>
      </View>
    );
  }

  const values = data.map((d) => d.totalInr);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * WIDTH;
    const y = HEIGHT - ((d.totalInr - min) / range) * HEIGHT;
    return `${x},${y}`;
  });

  const polyline = points.join(' ');
  const lastPoint = data[data.length - 1];
  const firstPoint = data[0];
  const isUp = lastPoint.totalInr >= firstPoint.totalInr;

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <Text style={styles.maxLabel}>{formatCurrency(max)}</Text>
        <Text style={styles.minLabel}>{formatCurrency(min)}</Text>
      </View>
      {/* SVG-like using View bars since we're keeping deps minimal */}
      <View style={styles.barsContainer}>
        {data.map((d, i) => {
          const barHeight = ((d.totalInr - min) / range) * HEIGHT;
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  height: Math.max(barHeight, 2),
                  backgroundColor: isUp ? Colors.success : Colors.danger,
                  opacity: 0.6 + (i / data.length) * 0.4,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>{firstPoint.date}</Text>
        <Text style={styles.dateLabel}>{lastPoint.date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  maxLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  minLabel: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  barsContainer: {
    flexDirection: 'row',
    height: HEIGHT,
    alignItems: 'flex-end',
    gap: 2,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 2,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateLabel: {
    color: Colors.textMuted,
    fontSize: 10,
  },
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 4,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: 11,
  },
});
