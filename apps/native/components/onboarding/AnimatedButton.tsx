import React, { useEffect } from 'react';
import { StyleSheet, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  onPress: () => void;
  label?: string;
}

export function AnimatedButton({
  onPress,
  label = 'get started',
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const arrowX = useSharedValue(0);

  useEffect(() => {
    // Arrow pulsing animation
    arrowX.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [arrowX]);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      entering={FadeInDown.delay(800).duration(800)}
      style={[styles.button, buttonAnimatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Text style={styles.partyEmoji}>🎉</Text>
      <Text style={styles.buttonText}>{label}</Text>
      <Animated.Text style={[styles.arrowText, arrowAnimatedStyle]}>
        →
      </Animated.Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    borderRadius: 50,
    paddingVertical: 18,
    paddingHorizontal: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  partyEmoji: {
    fontSize: 22,
    marginRight: 10,
  },
  buttonText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
  arrowText: {
    color: colors.text.inverse,
    fontSize: 22,
    fontWeight: '600',
  },
});
