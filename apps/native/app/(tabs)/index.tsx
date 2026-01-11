import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useScreenshots, useUploadScreenshot } from '../../hooks';
import { useSharedImage } from '../../contexts';
import {
  ScreenshotList,
  LoadingSpinner,
  UploadButton,
  ProcessingModal,
  SearchBar,
} from '../../components';
import { colors } from '../../constants';

export default function FeedScreen() {
  const router = useRouter();
  const { screenshots, isLoading, refetch } = useScreenshots();
  const { upload, status, progress, error, result, reset } = useUploadScreenshot();
  const { sharedImageUri, clearSharedImage } = useSharedImage();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const processingSharedRef = useRef(false);

  // Filter screenshots based on search query
  const filteredScreenshots = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return screenshots;
    }

    const query = searchQuery.toLowerCase().trim();

    return screenshots.filter((screenshot) => {
      // Search in extracted text
      if (screenshot.extractedText?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in location
      if (screenshot.location?.name?.toLowerCase().includes(query)) {
        return true;
      }
      if (screenshot.location?.address?.toLowerCase().includes(query)) {
        return true;
      }

      // Search in extracted data
      if (screenshot.extractedData?.ocrText?.toLowerCase().includes(query)) {
        return true;
      }
      if (screenshot.extractedData?.places?.some(place =>
        place.toLowerCase().includes(query)
      )) {
        return true;
      }
      if (screenshot.extractedData?.entities?.some(entity =>
        entity.toLowerCase().includes(query)
      )) {
        return true;
      }

      // Search in search results
      if (screenshot.searchResults?.query?.toLowerCase().includes(query)) {
        return true;
      }
      if (screenshot.searchResults?.results?.some(result =>
        result.title.toLowerCase().includes(query) ||
        result.content.toLowerCase().includes(query)
      )) {
        return true;
      }

      // Search in intent
      if (screenshot.intent?.primaryBucket?.toLowerCase().includes(query)) {
        return true;
      }
      if (screenshot.intent?.rationale?.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [screenshots, searchQuery]);

  // Handle shared images from share extension
  useEffect(() => {
    if (sharedImageUri && !processingSharedRef.current) {
      processingSharedRef.current = true;
      handleImageSelected(sharedImageUri).finally(() => {
        clearSharedImage();
        processingSharedRef.current = false;
      });
    }
  }, [sharedImageUri]);

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
        screenshots={filteredScreenshots}
        onScreenshotPress={handleScreenshotPress}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        ListHeaderComponent={
          <View style={styles.uploadContainer}>
            <UploadButton
              onImageSelected={handleImageSelected}
              isUploading={isUploading}
            />
            <SearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by location, text, places..."
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
    gap: 12,
  },
});
