import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Callout } from 'react-native-maps';
import { Place } from '../../types';
import { colors } from '../../constants';

interface PlaceCalloutProps {
  place: Place;
  onViewDetails?: () => void;
}

export function PlaceCallout({ place, onViewDetails }: PlaceCalloutProps) {
  return (
    <Callout onPress={onViewDetails} tooltip>
      <View style={styles.container}>
        <Text style={styles.name}>{place.name}</Text>
        {place.metadata?.neighborhood && (
          <Text style={styles.neighborhood}>{place.metadata.neighborhood}</Text>
        )}
        {place.address && (
          <Text style={styles.address} numberOfLines={2}>
            {place.address}
          </Text>
        )}
        {onViewDetails && (
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>View Details</Text>
          </Pressable>
        )}
      </View>
    </Callout>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    minWidth: 180,
    maxWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  neighborhood: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  address: {
    fontSize: 11,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
  },
});
