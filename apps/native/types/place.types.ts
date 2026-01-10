export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface PlaceMetadata {
  neighborhood?: string;
  city?: string;
  country?: string;
  placeType?: string;
}

export interface Place {
  id: string;
  name: string;
  address?: string;
  coordinates: Coordinates;
  category?: string;
  sourceScreenshotId: string;
  clusterId?: string;
  metadata?: PlaceMetadata;
}

export interface PlaceCluster {
  id: string;
  name: string;
  centroid: Coordinates;
  placeIds: string[];
  color: string;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
