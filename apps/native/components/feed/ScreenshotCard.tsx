import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ProcessedScreenshot } from '../../types';
import { Card } from '../common/Card';
import { SwipeToDelete } from '../common/SwipeToDelete';
import { IntentBadge } from './IntentBadge';
import { colors } from '../../constants';

interface ScreenshotCardProps {
  screenshot: ProcessedScreenshot;
  onPress: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function ScreenshotCard({ screenshot, onPress, onDelete }: ScreenshotCardProps) {
  const cardContent = (
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

  if (onDelete) {
    return (
      <SwipeToDelete onDelete={() => onDelete(screenshot.id)}>
        {cardContent}
      </SwipeToDelete>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  thumbnail: {
    width: 85,
    height: 105,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  details: {
    flex: 1,
    gap: 10,
    paddingVertical: 4,
  },
  rationale: {
    fontSize: 15,
    color: colors.text.primary,
    lineHeight: 21,
    fontWeight: '500',
  },
  date: {
    fontSize: 13,
    color: colors.text.muted,
  },
});
