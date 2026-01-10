import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { InferredIntent } from '../../types';
import { intentBucketConfig, colors } from '../../constants';
import { ConfidenceIndicator } from '../common';

interface IntentDetailsProps {
  intent: InferredIntent;
}

export function IntentDetails({ intent }: IntentDetailsProps) {
  const config = intentBucketConfig[intent.primaryBucket];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Intent Analysis</Text>

      <View style={styles.bucketRow}>
        <View style={[styles.bucketBadge, { backgroundColor: config.color }]}>
          <Text style={styles.bucketLabel}>{config.label}</Text>
        </View>
        <View style={styles.confidenceContainer}>
          <ConfidenceIndicator score={intent.confidence} />
        </View>
      </View>

      <View style={styles.rationaleContainer}>
        <Text style={styles.rationaleLabel}>Why this bucket?</Text>
        <Text style={styles.rationale}>{intent.rationale}</Text>
      </View>

      {intent.candidates.length > 1 && (
        <View style={styles.candidatesContainer}>
          <Text style={styles.candidatesLabel}>Other possibilities</Text>
          {intent.candidates
            .filter((c) => c.bucket !== intent.primaryBucket)
            .map((candidate) => (
              <View key={candidate.bucket} style={styles.candidateRow}>
                <Text style={styles.candidateBucket}>
                  {intentBucketConfig[candidate.bucket].label}
                </Text>
                <Text style={styles.candidateScore}>
                  {Math.round(candidate.confidence * 100)}%
                </Text>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bucketBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bucketLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  confidenceContainer: {
    flex: 1,
  },
  rationaleContainer: {
    gap: 4,
  },
  rationaleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  rationale: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  candidatesContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 6,
  },
  candidatesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  candidateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  candidateBucket: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  candidateScore: {
    fontSize: 13,
    color: colors.text.muted,
  },
});
