import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IntentBucket } from '../../types';
import { intentBucketConfig, colors } from '../../constants';

interface IntentBadgeProps {
  bucket: IntentBucket;
  confidence: number;
  showConfidence?: boolean;
}

export function IntentBadge({ bucket, confidence, showConfidence = true }: IntentBadgeProps) {
  const config = intentBucketConfig[bucket];
  const percentage = Math.round(confidence * 100);

  return (
    <View style={[styles.container, { backgroundColor: config.color }]}>
      <Text style={styles.label}>{config.label}</Text>
      {showConfidence && <Text style={styles.confidence}>{percentage}%</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  confidence: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.text.inverse,
    opacity: 0.9,
  },
});
