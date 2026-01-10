import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { colors } from '../../constants';

interface SkeletonProps {
  width: number;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width, height, radius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.border,
          opacity,
        },
        style,
      ]}
    />
  );
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.cardContent}>
        <Skeleton width={80} height={100} radius={8} />
        <View style={styles.cardDetails}>
          <Skeleton width={80} height={24} radius={12} />
          <View style={{ height: 8 }} />
          <Skeleton width={200} height={16} radius={4} />
          <View style={{ height: 4 }} />
          <Skeleton width={150} height={16} radius={4} />
          <View style={{ height: 8 }} />
          <Skeleton width={60} height={12} radius={4} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    gap: 12,
  },
  cardDetails: {
    flex: 1,
  },
});
