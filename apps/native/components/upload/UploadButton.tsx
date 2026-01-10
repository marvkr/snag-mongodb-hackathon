import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';

interface UploadButtonProps {
  onImageSelected: (uri: string) => void;
  isUploading?: boolean;
  disabled?: boolean;
}

export function UploadButton({
  onImageSelected,
  isUploading,
  disabled,
}: UploadButtonProps) {
  const handlePress = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      onImageSelected(result.assets[0].uri);
    }
  };

  const isDisabled = isUploading || disabled;

  return (
    <Pressable
      style={[styles.button, isDisabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={isDisabled}
    >
      {isUploading ? (
        <ActivityIndicator color={colors.text.inverse} size="small" />
      ) : (
        <Ionicons name="add-circle" size={22} color={colors.text.inverse} />
      )}
      <Text style={styles.text}>
        {isUploading ? 'Processing...' : 'Add Screenshot'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
  },
});
