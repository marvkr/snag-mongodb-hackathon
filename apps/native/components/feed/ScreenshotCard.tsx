import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const location = screenshot.location;
  const extractedPlaces = screenshot.extractedData?.places || [];

  const cardContent = (
    <Card onPress={() => onPress(screenshot.id)} style={styles.card}>
      <View style={styles.content}>
        <Image source={{ uri: screenshot.imageUri }} style={styles.thumbnail} />
        <View style={styles.details}>
          <View style={styles.topRow}>
            <IntentBadge
              bucket={screenshot.intent.primaryBucket}
              confidence={screenshot.intent.confidence}
              showConfidence={false}
            />
            <Text style={styles.date}>
              {new Date(screenshot.createdAt).toLocaleDateString()}
            </Text>
          </View>

          {location ? (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={16} color={colors.intent.travel} />
              <View style={styles.locationText}>
                <Text style={styles.locationName} numberOfLines={1}>
                  {location.name}
                </Text>
                {location.address && (
                  <Text style={styles.locationAddress} numberOfLines={1}>
                    {location.address}
                  </Text>
                )}
              </View>
            </View>
          ) : extractedPlaces.length > 0 ? (
            <View style={styles.placesContainer}>
              <Ionicons name="location-outline" size={14} color={colors.text.secondary} />
              <Text style={styles.placesText} numberOfLines={1}>
                {extractedPlaces.slice(0, 2).join(', ')}
                {extractedPlaces.length > 2 && ` +${extractedPlaces.length - 2}`}
              </Text>
            </View>
          ) : (
            <Text style={styles.rationale} numberOfLines={2}>
              {screenshot.intent.rationale}
            </Text>
          )}

          {screenshot.extractedData?.entities && screenshot.extractedData.entities.length > 0 && (
            <View style={styles.entitiesContainer}>
              {screenshot.extractedData.entities.slice(0, 3).map((entity, index) => (
                <View key={index} style={styles.entityTag}>
                  <Text style={styles.entityText}>{entity}</Text>
                </View>
              ))}
            </View>
          )}
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
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    gap: 14,
  },
  thumbnail: {
    width: 90,
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  details: {
    flex: 1,
    gap: 8,
    paddingVertical: 2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  locationText: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 20,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
    marginTop: 2,
  },
  placesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  placesText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  rationale: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: colors.text.muted,
  },
  entitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  entityTag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  entityText: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
});
