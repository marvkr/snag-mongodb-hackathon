import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { colors } from '../../constants';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, onPress, style }: CardProps) {
  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={[styles.container, style]}>
        {children}
      </PressableScale>
    );
  }

  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 16,
    shadowColor: '#9A9083',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
});
