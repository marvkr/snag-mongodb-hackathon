import React, { useRef, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { Place, PlaceCluster, MapRegion } from '../../types';
import { PlaceMarker } from './PlaceMarker';

interface TravelMapProps {
  places: Place[];
  clusters: PlaceCluster[];
  initialRegion?: MapRegion;
  onPlacePress?: (place: Place) => void;
}

export function TravelMap({
  places,
  clusters,
  initialRegion,
  onPlacePress,
}: TravelMapProps) {
  const mapRef = useRef<MapView>(null);

  const getClusterForPlace = (place: Place): PlaceCluster | undefined => {
    return clusters.find((c) => c.id === place.clusterId);
  };

  useEffect(() => {
    if (places.length > 0 && mapRef.current) {
      const coordinates = places.map((p) => p.coordinates);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [places]);

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation
      showsCompass
    >
      {places.map((place) => (
        <PlaceMarker
          key={place.id}
          place={place}
          cluster={getClusterForPlace(place)}
          onPress={() => onPlacePress?.(place)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
