import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface BadgeProps {
  label: string;
  color: string;
  size?: 'small' | 'medium' | 'large';
}

const sizeConfig = {
  small: {
    container: {
      paddingHorizontal: 6,
      paddingVertical: 2,
    } as ViewStyle,
    text: {
      fontSize: 10,
    } as TextStyle,
  },
  medium: {
    container: {
      paddingHorizontal: 10,
      paddingVertical: 4,
    } as ViewStyle,
    text: {
      fontSize: 12,
    } as TextStyle,
  },
  large: {
    container: {
      paddingHorizontal: 14,
      paddingVertical: 6,
    } as ViewStyle,
    text: {
      fontSize: 14,
    } as TextStyle,
  },
};

export function Badge({ label, color, size = 'medium' }: BadgeProps) {
  const sizeStyles = sizeConfig[size];

  return (
    <View style={[styles.container, sizeStyles.container, { backgroundColor: color }]}>
      <Text style={[styles.text, sizeStyles.text]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
