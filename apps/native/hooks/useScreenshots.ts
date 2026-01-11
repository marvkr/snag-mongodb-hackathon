import { useState, useEffect, useCallback, useRef } from 'react';
import { ProcessedScreenshot } from '../types';
import { screenshotsService } from '../services';

export function useScreenshots() {
  const [screenshots, setScreenshots] = useState<ProcessedScreenshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hookIdRef = useRef(Math.random().toString(36).substring(7));

  console.log(`[useScreenshots:${hookIdRef.current}] 🎣 Hook initialized`);

  const fetchScreenshots = useCallback(async () => {
    const fetchId = Math.random().toString(36).substring(7);
    console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 🚀 Starting fetch...`);

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 🛑 Aborting previous request`);
      abortControllerRef.current.abort();
    }

    // Create a new abort controller for this request
    abortControllerRef.current = new AbortController();
    console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ✨ Created new AbortController`);

    try {
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ⏳ Setting loading=true`);
      setIsLoading(true);
      setError(null);

      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 📞 Calling screenshotsService.getAll()`);
      const data = await screenshotsService.getAll();

      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ✅ Received ${data.length} screenshots`);
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] Component mounted?`, isMountedRef.current);

      // Only update state if component is still mounted
      if (isMountedRef.current) {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 💾 Updating screenshots state`);
        setScreenshots(data);
      } else {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ⚠️ Component unmounted, skipping state update`);
      }
    } catch (e) {
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ❌ Error caught:`, e);
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] Error name:`, e instanceof Error ? e.name : 'unknown');
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] Component mounted?`, isMountedRef.current);

      // Only update error state if component is still mounted and it's not an abort error
      if (isMountedRef.current && e instanceof Error && e.name !== 'AbortError') {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 💥 Setting error state`);
        setError(e);
      } else if (e instanceof Error && e.name === 'AbortError') {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 🛑 AbortError - request was cancelled (expected)`);
      } else {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ⚠️ Error ignored (component unmounted or abort error)`);
      }
    } finally {
      console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] 🏁 Finally block - Component mounted?`, isMountedRef.current);
      // Only update loading state if component is still mounted
      if (isMountedRef.current) {
        console.log(`[useScreenshots:${hookIdRef.current}:${fetchId}] ⏳ Setting loading=false`);
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    console.log(`[useScreenshots:${hookIdRef.current}] 🔄 useEffect mounted`);
    isMountedRef.current = true;
    fetchScreenshots();

    return () => {
      console.log(`[useScreenshots:${hookIdRef.current}] 🧹 useEffect cleanup - unmounting`);
      isMountedRef.current = false;
      // Abort any ongoing requests when component unmounts
      if (abortControllerRef.current) {
        console.log(`[useScreenshots:${hookIdRef.current}] 🛑 Aborting request on unmount`);
        abortControllerRef.current.abort();
      }
    };
  }, [fetchScreenshots]);

  console.log(`[useScreenshots:${hookIdRef.current}] 📊 Current state - loading:`, isLoading, 'screenshots:', screenshots.length, 'error:', !!error);

  return {
    screenshots,
    isLoading,
    error,
    refetch: fetchScreenshots,
  };
}
