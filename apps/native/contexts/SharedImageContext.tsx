import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as Linking from 'expo-linking';

interface SharedImageContextValue {
  sharedImageUri: string | null;
  clearSharedImage: () => void;
}

const SharedImageContext = createContext<SharedImageContextValue | null>(null);

export function SharedImageProvider({ children }: { children: React.ReactNode }) {
  const [sharedImageUri, setSharedImageUri] = useState<string | null>(null);

  useEffect(() => {
    // Handle initial URL (app opened via deep link)
    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (url) {
        handleDeepLink(url);
      }
    };

    handleInitialURL();

    // Handle URLs when app is already open
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    const parsed = Linking.parse(url);

    // Handle snag://share?image=...
    if (parsed.path === 'share' && parsed.queryParams?.image) {
      const imageUri = decodeURIComponent(parsed.queryParams.image as string);
      setSharedImageUri(imageUri);
    }
  };

  const clearSharedImage = useCallback(() => {
    setSharedImageUri(null);
  }, []);

  return (
    <SharedImageContext.Provider value={{ sharedImageUri, clearSharedImage }}>
      {children}
    </SharedImageContext.Provider>
  );
}

export function useSharedImage() {
  const context = useContext(SharedImageContext);
  if (!context) {
    throw new Error('useSharedImage must be used within a SharedImageProvider');
  }
  return context;
}
