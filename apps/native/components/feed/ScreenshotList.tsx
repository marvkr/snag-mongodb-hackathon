import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, StyleSheet, RefreshControl, View, Text, Animated } from 'react-native';
import { ProcessedScreenshot } from '../../types';
import { ScreenshotCard } from './ScreenshotCard';
import { SkeletonCard } from '../common/Skeleton';
import { colors } from '../../constants';

interface ScreenshotListProps {
  screenshots: ProcessedScreenshot[];
  onScreenshotPress: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isLoading?: boolean;
  onDelete?: (id: string) => void;
  ListHeaderComponent?: React.ReactElement;
}

function AnimatedCard({ children, index }: { children: React.ReactNode; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      {children}
    </Animated.View>
  );
}

export function ScreenshotList({
  screenshots,
  onScreenshotPress,
  onRefresh,
  isRefreshing,
  isLoading = false,
  onDelete,
  ListHeaderComponent,
}: ScreenshotListProps) {
  const renderItem = useCallback(
    ({ item, index }: { item: ProcessedScreenshot; index: number }) => (
      <AnimatedCard index={index}>
        <ScreenshotCard
          screenshot={item}
          onPress={onScreenshotPress}
          onDelete={onDelete}
        />
      </AnimatedCard>
    ),
    [onScreenshotPress, onDelete]
  );

  if (isLoading) {
    return (
      <View style={styles.list}>
        {[0, 1, 2, 3, 4].map((i) => (
          <AnimatedCard key={i} index={i}>
            <SkeletonCard />
          </AnimatedCard>
        ))}
      </View>
    );
  }

  if (screenshots.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No screenshots yet</Text>
        <Text style={styles.emptySubtitle}>
          Share screenshots to this app to get started
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={screenshots}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      contentContainerStyle={styles.list}
      ListHeaderComponent={ListHeaderComponent}
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
