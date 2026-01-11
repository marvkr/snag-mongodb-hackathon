import React from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenshotLocation } from '../../types';
import { colors } from '../../constants';

interface LocationDetailsProps {
  location: ScreenshotLocation;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  const handleOpenMaps = () => {
    if (location.googleMapsUrl) {
      Linking.openURL(location.googleMapsUrl);
    } else if (location.coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${location.coordinates.latitude},${location.coordinates.longitude}`;
      Linking.openURL(url);
    }
  };

  const canOpenMaps = location.googleMapsUrl || location.coordinates;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={22} color={colors.intent.travel} />
        <Text style={styles.sectionTitle}>Location</Text>
      </View>

      <View style={styles.locationInfo}>
        <Text style={styles.locationName}>{location.name}</Text>
        {location.address && (
          <Text style={styles.locationAddress}>{location.address}</Text>
        )}
      </View>

      {canOpenMaps && (
        <Pressable style={styles.mapsButton} onPress={handleOpenMaps}>
          <Ionicons name="navigate" size={18} color={colors.text.inverse} />
          <Text style={styles.mapsButtonText}>Open in Google Maps</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  locationInfo: {
    gap: 4,
  },
  locationName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 24,
  },
  locationAddress: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  coordinates: {
    fontSize: 12,
    color: colors.text.muted,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.intent.travel,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 4,
  },
  mapsButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.inverse,
  },
});
