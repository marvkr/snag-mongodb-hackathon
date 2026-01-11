import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { close } from 'expo-share-extension';

type InitialProps = {
  files?: string[];
  images?: string[];
  videos?: string[];
  text?: string;
  url?: string;
};

export default function ShareExtension({ images }: InitialProps) {
  const imageUri = images?.[0];

  const handleOpenInSnag = async () => {
    if (imageUri) {
      // Open the main app with the shared image
      const encodedUri = encodeURIComponent(imageUri);
      await Linking.openURL(`snag://share?image=${encodedUri}`);
    }
    close();
  };

  const handleCancel = () => {
    close();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Share to Snag</Text>
        <TouchableOpacity onPress={handleOpenInSnag}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
        ) : (
          <Text style={styles.noImage}>No image to share</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          This screenshot will be analyzed and saved to your Snag collection
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  saveText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  preview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  noImage: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
