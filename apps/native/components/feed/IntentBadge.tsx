import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IntentBucket } from '../../types';
import { colors } from '../../constants';

interface IntentBadgeProps {
  bucket: IntentBucket;
  confidence: number;
  showConfidence?: boolean;
}

const badgeColors: Record<IntentBucket, { bg: string; text: string }> = {
  travel: { bg: '#E8F4FF', text: '#0F8BFF' },
  shopping: { bg: '#FFF0ED', text: '#D4644A' },
  startup: { bg: '#F3EFFC', text: '#7B5BB5' },
  general: { bg: '#F5F3F0', text: '#8B7355' },
};

const bucketLabels: Record<IntentBucket, string> = {
  travel: 'Travel',
  shopping: 'Shopping',
  startup: 'Startup',
  general: 'General',
};

export function IntentBadge({ bucket, confidence, showConfidence = true }: IntentBadgeProps) {
  const colorConfig = badgeColors[bucket];
  const percentage = Math.round(confidence * 100);

  return (
    <View style={[styles.container, { backgroundColor: colorConfig.bg }]}>
      <Text style={[styles.label, { color: colorConfig.text }]}>
        {bucketLabels[bucket]}
      </Text>
      {showConfidence && (
        <Text style={[styles.confidence, { color: colorConfig.text }]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
  confidence: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.8,
  },
});
