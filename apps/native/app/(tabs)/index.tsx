import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useScreenshots, useUploadScreenshot } from '../../hooks';
import {
  ScreenshotList,
  LoadingSpinner,
  UploadButton,
  ProcessingModal,
} from '../../components';
import { colors } from '../../constants';

export default function FeedScreen() {
  const router = useRouter();
  const { screenshots, isLoading, refetch } = useScreenshots();
  const { upload, status, progress, error, result, reset } = useUploadScreenshot();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleScreenshotPress = (id: string) => {
    router.push(`/screenshot/${id}`);
  };

  const handleImageSelected = async (uri: string) => {
    setShowModal(true);
    const uploadedScreenshot = await upload(uri);

    if (uploadedScreenshot) {
      await refetch();
    }
  };

  const handleDismissModal = () => {
    setShowModal(false);
    reset();
  };

  const handleViewResult = (id: string) => {
    setShowModal(false);
    reset();
    router.push(`/screenshot/${id}`);
  };

  if (isLoading && !isRefreshing) {
    return <LoadingSpinner message="Loading screenshots..." />;
  }

  const isUploading = status === 'uploading' || status === 'processing';

  return (
    <View style={styles.container}>
      <ScreenshotList
        screenshots={screenshots}
        onScreenshotPress={handleScreenshotPress}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        ListHeaderComponent={
          <View style={styles.uploadContainer}>
            <UploadButton
              onImageSelected={handleImageSelected}
              isUploading={isUploading}
            />
          </View>
        }
      />

      <ProcessingModal
        visible={showModal}
        status={status}
        progress={progress}
        error={error}
        result={result}
        onDismiss={handleDismissModal}
        onViewResult={handleViewResult}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  uploadContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
});
