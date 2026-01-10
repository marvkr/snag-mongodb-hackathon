import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useScreenshots } from '../../hooks';
import { ScreenshotList, LoadingSpinner } from '../../components';
import { colors } from '../../constants';

export default function FeedScreen() {
  const router = useRouter();
  const { screenshots, isLoading, refetch } = useScreenshots();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleScreenshotPress = (id: string) => {
    router.push(`/screenshot/${id}`);
  };

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner message="Loading screenshots..." />;
  }

  return (
    <View style={styles.container}>
      <ScreenshotList
        screenshots={screenshots}
        onScreenshotPress={handleScreenshotPress}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
