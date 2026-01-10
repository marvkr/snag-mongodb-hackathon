import React from 'react';
import { FlatList, StyleSheet, RefreshControl, View, Text } from 'react-native';
import { ProcessedScreenshot } from '../../types';
import { ScreenshotCard } from './ScreenshotCard';
import { colors } from '../../constants';

interface ScreenshotListProps {
  screenshots: ProcessedScreenshot[];
  onScreenshotPress: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ScreenshotList({
  screenshots,
  onScreenshotPress,
  onRefresh,
  isRefreshing,
}: ScreenshotListProps) {
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
      renderItem={({ item }) => (
        <ScreenshotCard screenshot={item} onPress={onScreenshotPress} />
      )}
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
