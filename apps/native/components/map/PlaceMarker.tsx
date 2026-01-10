import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Place, PlaceCluster } from '../../types';

interface PlaceMarkerProps {
  place: Place;
  cluster?: PlaceCluster;
  onPress: () => void;
}

export function PlaceMarker({ place, cluster, onPress }: PlaceMarkerProps) {
  const markerColor = cluster?.color || '#FF6B6B';

  return (
    <Marker
      coordinate={place.coordinates}
      title={place.name}
      description={place.address}
      onPress={onPress}
    >
      <View style={[styles.marker, { backgroundColor: markerColor }]}>
        <View style={styles.inner} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  inner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
  },
});
