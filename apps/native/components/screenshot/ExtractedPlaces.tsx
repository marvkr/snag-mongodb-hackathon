import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Place } from '../../types';
import { colors } from '../../constants';

interface ExtractedPlacesProps {
  places: Place[];
  onPlacePress?: (place: Place) => void;
  onViewOnMap?: () => void;
}

export function ExtractedPlaces({ places, onPlacePress, onViewOnMap }: ExtractedPlacesProps) {
  if (places.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Extracted Places</Text>
        {onViewOnMap && (
          <Pressable onPress={onViewOnMap} style={styles.viewMapButton}>
            <Text style={styles.viewMapText}>View on Map</Text>
            <Ionicons name="map-outline" size={16} color={colors.primary} />
          </Pressable>
        )}
      </View>

      {places.map((place) => (
        <Pressable
          key={place.id}
          style={styles.placeItem}
          onPress={() => onPlacePress?.(place)}
        >
          <View style={styles.placeIcon}>
            <Ionicons name="location" size={20} color={colors.primary} />
          </View>
          <View style={styles.placeDetails}>
            <Text style={styles.placeName}>{place.name}</Text>
            {place.metadata?.neighborhood && (
              <Text style={styles.placeNeighborhood}>{place.metadata.neighborhood}</Text>
            )}
            {place.address && (
              <Text style={styles.placeAddress} numberOfLines={1}>
                {place.address}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.text.muted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewMapText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  placeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeDetails: {
    flex: 1,
  },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeNeighborhood: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  placeAddress: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
