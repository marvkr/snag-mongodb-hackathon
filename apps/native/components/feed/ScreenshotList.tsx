import React, { useCallback } from 'react';
import { FlatList, StyleSheet, RefreshControl, View, Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { ProcessedScreenshot } from '../../types';
import { ScreenshotCard } from './ScreenshotCard';
import { colors } from '../../constants';
import { SkeletonCard } from '../common/Skeleton';

interface ScreenshotListProps {
  screenshots: ProcessedScreenshot[];
  onScreenshotPress: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
}

export function ScreenshotList({
  screenshots,
  onScreenshotPress,
  onRefresh,
  isRefreshing,
  isLoading = false,
  onDelete,
}: ScreenshotListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: ProcessedScreenshot; index: number }) => (
      <Animated.View
        entering={FadeIn.delay(index * 50).springify()}
        exiting={FadeOut}
        layout={LinearTransition.springify()}
      >
        <ScreenshotCard
          screenshot={item}
          onPress={onScreenshotPress}
          onDelete={onDelete}
        />
      </Animated.View>
    ),
    [onScreenshotPress, onDelete]
  );

  if (isLoading) {
    return (
      <View style={styles.list}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Animated.View key={i} entering={FadeIn.delay(i * 100)}>
            <SkeletonCard />
          </Animated.View>
        ))}
      </View>
    );
  }

  if (screenshots.length === 0) {
    return (
      <Animated.View
        entering={FadeIn}
        style={styles.emptyContainer}
      >
        <Text style={styles.emptyTitle}>No screenshots yet</Text>
        <Text style={styles.emptySubtitle}>
          Share screenshots to this app to get started
        </Text>
      </Animated.View>
    );
  }

  return (
    <FlatList
      data={screenshots}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
