import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
      <Text style={styles.sectionTitle}>What is this?</Text>

      <View style={styles.bucketRow}>
        <View style={[styles.bucketBadge, { backgroundColor: config.color }]}>
          <Text style={styles.bucketLabel}>{config.label}</Text>
        </View>
        <View style={styles.confidenceContainer}>
          <ConfidenceIndicator score={intent.confidence} />
        </View>
      </View>

      <View style={styles.rationaleContainer}>
        <Text style={styles.rationaleLabel}>Why?</Text>
        <Text style={styles.rationale}>{intent.rationale}</Text>
      </View>

      {intent.candidates.length > 1 && (
        <View style={styles.candidatesContainer}>
          <Text style={styles.candidatesLabel}>Could also be</Text>
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

      {/* Multi-Agent Analysis - shows when multiple agents are involved */}
      {intent.candidates.filter((c) => c.confidence >= 0.3).length > 1 && (
        <View style={styles.multiAgentContainer}>
          <View style={styles.multiAgentHeader}>
            <Ionicons name="git-branch" size={16} color={colors.primary} />
            <Text style={styles.multiAgentTitle}>AI detected</Text>
          </View>
          <Text style={styles.multiAgentDescription}>
            Multiple AI systems checked this:
          </Text>
          <View style={styles.agentChipsRow}>
            {intent.candidates
              .filter((c) => c.confidence >= 0.3)
              .map((candidate) => {
                const agentConfig = intentBucketConfig[candidate.bucket];
                return (
                  <View key={candidate.bucket} style={styles.agentChip}>
                    <View
                      style={[
                        styles.agentDot,
                        { backgroundColor: agentConfig.color },
                      ]}
                    />
                    <Text style={styles.agentName}>{agentConfig.label}</Text>
                  </View>
                );
              })}
          </View>
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
  multiAgentContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    gap: 8,
  },
  multiAgentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  multiAgentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  multiAgentDescription: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  agentChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  agentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text.primary,
  },
});
