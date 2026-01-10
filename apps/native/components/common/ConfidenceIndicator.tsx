import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants';

interface ConfidenceIndicatorProps {
  score: number;
  showLabel?: boolean;
}

export function ConfidenceIndicator({ score, showLabel = true }: ConfidenceIndicatorProps) {
  const percentage = Math.round(score * 100);
  const barColor =
    score >= 0.8
      ? colors.confidence.high
      : score >= 0.5
        ? colors.confidence.medium
        : colors.confidence.low;

  return (
    <View style={styles.container}>
      {showLabel && <Text style={styles.label}>{percentage}%</Text>}
      <View style={styles.barContainer}>
        <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    minWidth: 36,
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 3,
  },
});
