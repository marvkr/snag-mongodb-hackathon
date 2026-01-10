import { Place, PlaceCluster, MapRegion } from '../types';
import { mockPlaces, mockClusters, mockMapRegion } from '../mocks';
import { apiClient, USE_MOCK } from './api.client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const placesService = {
  getAll: async (): Promise<Place[]> => {
    if (USE_MOCK) {
      await delay(400);
      return mockPlaces;
    }
    return apiClient.get<Place[]>('/places');
  },

  getByScreenshotId: async (screenshotId: string): Promise<Place[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockPlaces.filter((p) => p.sourceScreenshotId === screenshotId);
    }
    return apiClient.get<Place[]>(`/screenshots/${screenshotId}/places`);
  },

  getClusters: async (): Promise<PlaceCluster[]> => {
    if (USE_MOCK) {
      await delay(300);
      return mockClusters;
    }
    return apiClient.get<PlaceCluster[]>('/places/clusters');
  },

  getMapRegion: async (): Promise<MapRegion> => {
    if (USE_MOCK) {
      await delay(200);
      return mockMapRegion;
    }
    return apiClient.get<MapRegion>('/places/region');
  },
};
