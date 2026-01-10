import React, { useRef } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, View } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRANSLATE_X_THRESHOLD = -SCREEN_WIDTH * 0.3;

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeToDelete({
  children,
  onDelete,
}: SwipeToDeleteProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemHeight = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < TRANSLATE_X_THRESHOLD) {
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(itemHeight, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: false,
            }),
          ]).start(() => {
            onDelete();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const deleteIconOpacity = translateX.interpolate({
    inputRange: [TRANSLATE_X_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          transform: [{ scaleY: itemHeight }],
        },
      ]}
    >
      <Animated.View style={[styles.deleteIcon, { opacity: deleteIconOpacity }]}>
        <FontAwesome5 name="trash-alt" size={24} color="#FF3B30" />
      </Animated.View>
      <Animated.View
        style={[styles.content, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
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
