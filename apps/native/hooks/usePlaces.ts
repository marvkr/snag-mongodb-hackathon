import { useState, useEffect, useCallback } from 'react';
import { Place, PlaceCluster, MapRegion } from '../types';
import { placesService } from '../services';

export function usePlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [clusters, setClusters] = useState<PlaceCluster[]>([]);
  const [region, setRegion] = useState<MapRegion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [placesData, clustersData, regionData] = await Promise.all([
        placesService.getAll(),
        placesService.getClusters(),
        placesService.getMapRegion(),
      ]);
      setPlaces(placesData);
      setClusters(clustersData);
      setRegion(regionData);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch places'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    places,
    clusters,
    region,
    isLoading,
    error,
    refetch: fetchData,
  };
}
