import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Skeleton as MotiSkeleton } from 'moti/skeleton';

const SkeletonCommonProps = {
  colorMode: 'light',
  transition: {
    type: 'timing',
    duration: 1500,
  },
  backgroundColor: '#E1E9EE',
} as const;

interface SkeletonProps {
  width: number;
  height: number;
  radius?: number | 'round' | 'square';
  style?: ViewStyle;
}

export function Skeleton({
  width,
  height,
  radius = 8,
  style,
}: SkeletonProps) {
  return (
    <View style={style}>
      <MotiSkeleton
        width={width}
        height={height}
        radius={radius}
        {...SkeletonCommonProps}
      />
    </View>
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <MotiSkeleton.Group show>
        <View style={styles.cardContent}>
          <MotiSkeleton
            width={80}
            height={100}
            radius={8}
            {...SkeletonCommonProps}
          />
          <View style={styles.cardDetails}>
            <MotiSkeleton
              width={80}
              height={24}
              radius={12}
              {...SkeletonCommonProps}
            />
            <View style={{ height: 8 }} />
            <MotiSkeleton
              width={200}
              height={16}
              radius={4}
              {...SkeletonCommonProps}
            />
            <View style={{ height: 4 }} />
            <MotiSkeleton
              width={150}
              height={16}
              radius={4}
              {...SkeletonCommonProps}
            />
            <View style={{ height: 8 }} />
            <MotiSkeleton
              width={60}
              height={12}
              radius={4}
              {...SkeletonCommonProps}
            />
          </View>
        </View>
      </MotiSkeleton.Group>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  cardDetails: {
    flex: 1,
  },
});
