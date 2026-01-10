import { useState, useEffect } from 'react';
import { ProcessedScreenshot, Place } from '../types';
import { screenshotsService, placesService } from '../services';

export function useScreenshotDetail(id: string) {
  const [screenshot, setScreenshot] = useState<ProcessedScreenshot | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setIsLoading(true);
        setError(null);
        const [screenshotData, placesData] = await Promise.all([
          screenshotsService.getById(id),
          placesService.getByScreenshotId(id),
        ]);
        setScreenshot(screenshotData);
        setPlaces(placesData);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to fetch details'));
      } finally {
        setIsLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  return {
    screenshot,
    places,
    isLoading,
    error,
  };
}
