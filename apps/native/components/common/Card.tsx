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
    borderRadius: 16,
    padding: 12,
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
});
