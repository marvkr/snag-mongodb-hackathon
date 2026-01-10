import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ProcessedScreenshot } from '../../types';
import { Card } from '../common/Card';
import { IntentBadge } from './IntentBadge';
import { colors } from '../../constants';

interface ScreenshotCardProps {
  screenshot: ProcessedScreenshot;
  onPress: (id: string) => void;
}

export function ScreenshotCard({ screenshot, onPress }: ScreenshotCardProps) {
  return (
    <Card onPress={() => onPress(screenshot.id)} style={styles.card}>
      <View style={styles.content}>
        <Image source={{ uri: screenshot.imageUri }} style={styles.thumbnail} />
        <View style={styles.details}>
          <IntentBadge
            bucket={screenshot.intent.primaryBucket}
            confidence={screenshot.intent.confidence}
          />
          <Text style={styles.rationale} numberOfLines={2}>
            {screenshot.intent.rationale}
          </Text>
          <Text style={styles.date}>
            {new Date(screenshot.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnail: {
    width: 80,
    height: 100,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  details: {
    flex: 1,
    gap: 6,
  },
  rationale: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  date: {
    fontSize: 11,
    color: colors.text.muted,
  },
});
