import { Place, PlaceCluster, MapRegion } from '../types';
import { mockPlaces, mockClusters, mockMapRegion } from '../mocks';
import { apiClient, USE_MOCK } from './api.client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BackendPlacesResponse {
  success: boolean;
  places: Place[];
}

interface BackendClustersResponse {
  success: boolean;
  clusters: PlaceCluster[];
}

interface BackendRegionResponse {
  success: boolean;
  region: MapRegion;
}

export const placesService = {
  getAll: async (): Promise<Place[]> => {
    if (USE_MOCK) {
      await delay(400);
      return mockPlaces;
    }
    try {
      const response = await apiClient.get<BackendPlacesResponse>('/api/places');
      return response.places;
    } catch {
      // Fallback to mock if endpoint not available yet
      return mockPlaces;
    }
  },

  getByScreenshotId: async (screenshotId: string): Promise<Place[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockPlaces.filter((p) => p.sourceScreenshotId === screenshotId);
    }
    try {
      const response = await apiClient.get<BackendPlacesResponse>(
        `/api/screenshots/${screenshotId}/places`
      );
      return response.places;
    } catch {
      // Fallback to mock if endpoint not available yet
      return mockPlaces.filter((p) => p.sourceScreenshotId === screenshotId);
    }
  },

  getClusters: async (): Promise<PlaceCluster[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockClusters;
    }
    try {
      const response = await apiClient.get<BackendClustersResponse>(
        '/api/places/clusters'
      );
      return response.clusters;
    } catch {
      // Fallback to mock if endpoint not available yet
      return mockClusters;
    }
  },

  getMapRegion: async (): Promise<MapRegion> => {
    if (USE_MOCK) {
      await delay(200);
      return mockMapRegion;
    }
    try {
      const response = await apiClient.get<BackendRegionResponse>(
        '/api/places/region'
      );
      return response.region;
    } catch {
      // Fallback to mock if endpoint not available yet
      return mockMapRegion;
    }
  },
};
