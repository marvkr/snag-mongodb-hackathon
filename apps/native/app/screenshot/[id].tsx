import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScreenshotDetail } from '../../hooks';
import {
  IntentDetails,
  ExtractedPlaces,
  LocationDetails,
  ResearchInsights,
  LoadingSpinner,
} from '../../components';
import { colors } from '../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ScreenshotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { screenshot, places, isLoading, error } = useScreenshotDetail(id);
  const [imageExpanded, setImageExpanded] = useState(false);

  const handleViewOnMap = () => {
    // Dismiss the modal and navigate to the map tab
    router.dismissTo('/(tabs)/map');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading details..." />;
  }

  if (error || !screenshot) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.text.secondary} />
        <Text style={styles.errorText}>Screenshot not found</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const imageHeight = imageExpanded ? SCREEN_HEIGHT * 0.7 : SCREEN_HEIGHT * 0.5;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => setImageExpanded(!imageExpanded)}>
        <Image
          source={{ uri: screenshot.imageUri }}
          style={[styles.image, { height: imageHeight }]}
          resizeMode="contain"
        />
        <View style={styles.expandHint}>
          <Ionicons
            name={imageExpanded ? 'contract' : 'expand'}
            size={16}
            color={colors.text.inverse}
          />
          <Text style={styles.expandHintText}>
            {imageExpanded ? 'Tap to shrink' : 'Tap to expand'}
          </Text>
        </View>
      </Pressable>

      {screenshot.location && (
        <View style={styles.section}>
          <LocationDetails location={screenshot.location} />
        </View>
      )}

      <View style={styles.section}>
        <ResearchInsights searchResults={screenshot.searchResults} />
      </View>

      {places.length > 0 && (
        <View style={styles.section}>
          <ExtractedPlaces
            places={places}
            onViewOnMap={handleViewOnMap}
            onPlacePress={handleViewOnMap}
          />
        </View>
      )}

      {screenshot.extractedData?.entities && screenshot.extractedData.entities.length > 0 && (
        <View style={styles.section}>
          <View style={styles.entitiesCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.entitiesContainer}>
              {screenshot.extractedData.entities.map((entity, index) => (
                <View key={index} style={styles.entityTag}>
                  <Text style={styles.entityText}>{entity}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {screenshot.extractedText && (
        <View style={styles.section}>
          <View style={styles.ocrCard}>
            <Text style={styles.sectionTitle}>Text from image</Text>
            <Text style={styles.ocrText}>{screenshot.extractedText}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  image: {
    width: SCREEN_WIDTH,
    backgroundColor: colors.surface,
  },
  expandHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expandHintText: {
    fontSize: 12,
    color: colors.text.inverse,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 12,
  },
  entitiesCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  entitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  entityTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  entityText: {
    fontSize: 13,
    color: colors.text.primary,
    fontWeight: '500',
  },
  ocrCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  ocrText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
