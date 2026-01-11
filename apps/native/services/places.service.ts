import { Place, PlaceCluster, MapRegion } from '../types';
import { apiClient } from './api.client';

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
    const response = await apiClient.get<BackendPlacesResponse>('/api/places');
    return response.places;
  },

  getByScreenshotId: async (screenshotId: string): Promise<Place[]> => {
    const response = await apiClient.get<BackendPlacesResponse>(
      `/api/screenshots/${screenshotId}/places`
    );
    return response.places;
  },

  getClusters: async (): Promise<PlaceCluster[]> => {
    const response = await apiClient.get<BackendClustersResponse>(
      '/api/places/clusters'
    );
    return response.clusters;
  },

  getMapRegion: async (): Promise<MapRegion> => {
    const response = await apiClient.get<BackendRegionResponse>(
      '/api/places/region'
    );
    return response.region;
  },
};
