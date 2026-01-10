import { Place, PlaceCluster, MapRegion } from '../types';

export const mockPlaces: Place[] = [
  {
    id: 'place-001',
    name: 'Cafe Stella',
    address: '3932 W Sunset Blvd, Los Angeles, CA 90029',
    coordinates: { latitude: 34.0875, longitude: -118.2766 },
    category: 'restaurant',
    sourceScreenshotId: 'ss-001',
    clusterId: 'cluster-silverlake',
    metadata: {
      neighborhood: 'Silver Lake',
      city: 'Los Angeles',
      country: 'USA',
      placeType: 'cafe',
    },
  },
  {
    id: 'place-002',
    name: 'Venice Beach Boardwalk',
    address: 'Ocean Front Walk, Venice, CA 90291',
    coordinates: { latitude: 33.985, longitude: -118.4695 },
    category: 'landmark',
    sourceScreenshotId: 'ss-002',
    clusterId: 'cluster-venice',
    metadata: {
      neighborhood: 'Venice',
      city: 'Los Angeles',
      country: 'USA',
      placeType: 'beach',
    },
  },
  {
    id: 'place-003',
    name: 'Malibu Creek State Park',
    address: '1925 Las Virgenes Rd, Calabasas, CA 91302',
    coordinates: { latitude: 34.1047, longitude: -118.7129 },
    category: 'outdoor',
    sourceScreenshotId: 'ss-003',
    clusterId: 'cluster-malibu',
    metadata: {
      neighborhood: 'Malibu',
      city: 'Calabasas',
      country: 'USA',
      placeType: 'park',
    },
  },
];

export const mockClusters: PlaceCluster[] = [
  {
    id: 'cluster-silverlake',
    name: 'Silver Lake spots',
    centroid: { latitude: 34.0875, longitude: -118.2766 },
    placeIds: ['place-001'],
    color: '#FF6B6B',
  },
  {
    id: 'cluster-venice',
    name: 'Venice vibes',
    centroid: { latitude: 33.985, longitude: -118.4695 },
    placeIds: ['place-002'],
    color: '#4ECDC4',
  },
  {
    id: 'cluster-malibu',
    name: 'Malibu adventures',
    centroid: { latitude: 34.1047, longitude: -118.7129 },
    placeIds: ['place-003'],
    color: '#45B7D1',
  },
];

export const mockMapRegion: MapRegion = {
  latitude: 34.0522,
  longitude: -118.4,
  latitudeDelta: 0.35,
  longitudeDelta: 0.55,
};
