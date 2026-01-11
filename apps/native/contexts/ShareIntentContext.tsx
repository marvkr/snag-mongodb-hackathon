import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ShareIntentProvider as LibraryShareIntentProvider,
  useShareIntentContext as useLibraryShareIntentContext,
} from 'expo-share-intent';

interface ShareIntentFile {
  uri: string;
  mimeType: string;
  fileName: string;
}

interface ShareIntentContextValue {
  sharedFiles: ShareIntentFile[];
  hasSharedFiles: boolean;
  clearSharedFiles: () => void;
}

const ShareIntentContext = createContext<ShareIntentContextValue | null>(null);

function ShareIntentHandler({ children }: { children: React.ReactNode }) {
  const { hasShareIntent, shareIntent, resetShareIntent } = useLibraryShareIntentContext();
  const [sharedFiles, setSharedFiles] = useState<ShareIntentFile[]>([]);

  useEffect(() => {
    if (hasShareIntent && shareIntent?.files && shareIntent.files.length > 0) {
      const imageFiles = shareIntent.files
        .filter((file) => file.mimeType?.startsWith('image/'))
        .map((file) => ({
          uri: file.path,
          mimeType: file.mimeType || 'image/jpeg',
          fileName: file.fileName || 'shared-image',
        }));

      if (imageFiles.length > 0) {
        setSharedFiles(imageFiles);
      }
    }
  }, [hasShareIntent, shareIntent]);

  const clearSharedFiles = useCallback(() => {
    setSharedFiles([]);
    resetShareIntent();
  }, [resetShareIntent]);

  return (
    <ShareIntentContext.Provider
      value={{
        sharedFiles,
        hasSharedFiles: sharedFiles.length > 0,
        clearSharedFiles,
      }}
    >
      {children}
    </ShareIntentContext.Provider>
  );
}

export function ShareIntentProvider({ children }: { children: React.ReactNode }) {
  return (
    <LibraryShareIntentProvider>
      <ShareIntentHandler>{children}</ShareIntentHandler>
    </LibraryShareIntentProvider>
  );
}

export function useShareIntentContext() {
  const context = useContext(ShareIntentContext);
  if (!context) {
    throw new Error('useShareIntentContext must be used within a ShareIntentProvider');
  }
  return context;
}
