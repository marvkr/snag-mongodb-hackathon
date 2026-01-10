import { useState, useEffect, useCallback } from 'react';
import { ProcessedScreenshot } from '../types';
import { screenshotsService } from '../services';

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<ProcessedScreenshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchScreenshots = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await screenshotsService.getAll();
      setScreenshots(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch screenshots'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [fetchScreenshots]);

  return {
    screenshots,
    isLoading,
    error,
    refetch: fetchScreenshots,
  };
}
