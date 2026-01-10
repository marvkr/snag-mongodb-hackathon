import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  FadeIn,
} from 'react-native-reanimated';

const SparkleLines = () => {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
        withDelay(1600, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.8, { duration: 400 }),
        withDelay(1600, withTiming(0.5, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.sparkleContainer, animatedStyle]}>
      <View style={[styles.sparkleLine, styles.sparkleTopLeft]} />
      <View style={[styles.sparkleLine, styles.sparkleTopRight]} />
      <View style={[styles.sparkleLine, styles.sparkleLeft]} />
    </Animated.View>
  );
};

export function AnimatedLogo() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Snagging/grabbing motion - like catching something
    rotation.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 200, easing: Easing.ease }),
        withTiming(10, { duration: 150, easing: Easing.ease }),
        withTiming(-5, { duration: 100, easing: Easing.ease }),
        withTiming(0, { duration: 100, easing: Easing.ease }),
        withDelay(2000, withTiming(0, { duration: 0 }))
      ),
      -1,
      false
    );

    // Subtle scale pulse on the grab
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 200 }),
        withTiming(1, { duration: 300 }),
        withDelay(2050, withTiming(1, { duration: 0 }))
      ),
      -1,
      false
    );
  }, [rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(100).duration(600)}
      style={styles.container}
    >
      <SparkleLines />
      <Animated.View style={animatedStyle}>
        <Text style={styles.emoji}>🎣</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  emoji: {
    fontSize: 80,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -15,
    left: -25,
    width: 130,
    height: 100,
  },
  sparkleLine: {
    position: 'absolute',
    backgroundColor: '#FFD93D',
    borderRadius: 2,
  },
  sparkleTopLeft: {
    width: 4,
    height: 18,
    top: 0,
    left: 15,
    transform: [{ rotate: '-30deg' }],
  },
  sparkleTopRight: {
    width: 4,
    height: 14,
    top: 8,
    left: 40,
    transform: [{ rotate: '30deg' }],
  },
  sparkleLeft: {
    width: 4,
    height: 12,
    top: 30,
    left: 0,
    transform: [{ rotate: '-45deg' }],
  },
});
