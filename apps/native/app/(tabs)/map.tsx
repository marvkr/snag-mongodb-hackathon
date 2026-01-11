import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { usePlaces } from '../../hooks';
import { TravelMap, MapHeader, LoadingSpinner } from '../../components';
import { Place } from '../../types';

export default function MapScreen() {
  const router = useRouter();
  const { places, clusters, region, isLoading } = usePlaces();

  const handlePlacePress = (place: Place) => {
    router.push(`/screenshot/${place.sourceScreenshotId}`);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading map..." />;
  }

  return (
    <View style={styles.container}>
      <TravelMap
        places={places}
        clusters={clusters}
        initialRegion={region ?? undefined}
        onPlacePress={handlePlacePress}
      />
      <MapHeader
        title={places.length > 0 ? "Places you need to visit!" : "No places yet"}
        placeCount={places.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
