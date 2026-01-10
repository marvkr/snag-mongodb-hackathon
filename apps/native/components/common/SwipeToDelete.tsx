import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  LinearTransition,
} from 'react-native-reanimated';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.3;

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  height?: number;
}

export function SwipeToDelete({
  children,
  onDelete,
  height = 120,
}: SwipeToDeleteProps) {
  const translateX = useSharedValue(0);
  const itemHeight = useSharedValue(height);
  const marginVertical = useSharedValue(6);
  const opacity = useSharedValue(1);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      const shouldDelete = translateX.value < TRANSLATE_X_THRESHOLD;
      if (shouldDelete) {
        translateX.value = withTiming(-SCREEN_WIDTH);
        itemHeight.value = withTiming(0);
        marginVertical.value = withTiming(0);
        opacity.value = withTiming(0, undefined, (isFinished) => {
          if (isFinished) {
            runOnJS(onDelete)();
          }
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    height: itemHeight.value,
    marginVertical: marginVertical.value,
    opacity: opacity.value,
  }));

  const deleteIconStyle = useAnimatedStyle(() => {
    const showIcon = translateX.value < TRANSLATE_X_THRESHOLD;
    return {
      opacity: withTiming(showIcon ? 1 : 0),
    };
  });

  return (
    <Animated.View
      style={[styles.container, containerStyle]}
      layout={LinearTransition.springify()}
    >
      <Animated.View style={[styles.deleteIcon, deleteIconStyle]}>
        <FontAwesome5 name="trash-alt" size={24} color="#FF3B30" />
      </Animated.View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.content, contentStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    overflow: 'hidden',
  },
  content: {
    width: '100%',
  },
  deleteIcon: {
    position: 'absolute',
    right: 32,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
