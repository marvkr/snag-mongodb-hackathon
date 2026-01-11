import { useState, useCallback } from 'react';
import { ProcessedScreenshot } from '../types';
import { screenshotsService } from '../services';

export type UploadStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

interface UseUploadScreenshotReturn {
  upload: (imageUri: string) => Promise<ProcessedScreenshot | null>;
  status: UploadStatus;
  progress: string;
  error: Error | null;
  result: ProcessedScreenshot | null;
  reset: () => void;
}

export function useUploadScreenshot(): UseUploadScreenshotReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<Error | null>(null);
  const [result, setResult] = useState<ProcessedScreenshot | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress('');
    setError(null);
    setResult(null);
  }, []);

  const upload = useCallback(
    async (imageUri: string): Promise<ProcessedScreenshot | null> => {
      try {
        setError(null);
        setResult(null);

        setStatus('uploading');
        setProgress('');

        const screenshot = await screenshotsService.submit(imageUri);

        setResult(screenshot);
        setStatus('completed');
        setProgress('');

        return screenshot;
      } catch (e) {
        setStatus('error');
        setError(e instanceof Error ? e : new Error('Upload failed'));
        return null;
      }
    },
    []
  );

  return { upload, status, progress, error, result, reset };
}
