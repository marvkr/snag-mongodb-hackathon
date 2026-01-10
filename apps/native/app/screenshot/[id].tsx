import React from 'react';
import { View, ScrollView, Image, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useScreenshotDetail } from '../../hooks';
import { IntentDetails, ExtractedPlaces, LoadingSpinner } from '../../components';
import { colors } from '../../constants';

export default function ScreenshotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { screenshot, places, isLoading } = useScreenshotDetail(id);

  const handleViewOnMap = () => {
    router.push('/(tabs)/map');
  };

  if (isLoading || !screenshot) {
    return <LoadingSpinner message="Loading details..." />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: screenshot.imageUri }} style={styles.image} resizeMode="cover" />

      <View style={styles.section}>
        <IntentDetails intent={screenshot.intent} />
      </View>

      <View style={styles.section}>
        <ExtractedPlaces
          places={places}
          onViewOnMap={places.length > 0 ? handleViewOnMap : undefined}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 32,
  },
  image: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surface,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
