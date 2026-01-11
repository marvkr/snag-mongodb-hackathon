import { randomUUID } from 'crypto';

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

interface GeocodingResult {
  name: string;
  coordinates: Coordinates;
  address?: string;
  metadata?: PlaceMetadata;
}

/**
 * Travel Agent - Handles place extraction, geocoding, and clustering
 */
export class TravelAgent {
  private geocodingApiKey: string;

  constructor(geocodingApiKey: string) {
    this.geocodingApiKey = geocodingApiKey;
  }

  /**
   * Main orchestration method: extract places, geocode, and cluster
   */
  async extractAndProcessPlaces(
    extractedData: any,
    imageId: string
  ): Promise<{ places: Place[]; clusters: PlaceCluster[] }> {
    try {
      // Extract place names from vision output
      const placeNames = extractedData?.places || [];

      if (placeNames.length === 0) {
        console.log(`No places found in screenshot ${imageId}`);
        return { places: [], clusters: [] };
      }

      console.log(`🗺️  Travel Agent: Processing ${placeNames.length} places from screenshot ${imageId}`);

      // Geocode all places
      const geocodedResults = await this.geocodePlaces(placeNames);

      // Convert to Place objects
      const places: Place[] = geocodedResults.map((result) => ({
        id: randomUUID(),
        name: result.name,
        address: result.address,
        coordinates: result.coordinates,
        sourceScreenshotId: imageId,
        metadata: result.metadata,
      }));

      console.log(`✅ Geocoded ${places.length} out of ${placeNames.length} places`);

      // Cluster places by proximity (if we have multiple places)
      const clusters = places.length > 1 ? this.clusterPlaces(places) : [];

      console.log(`✅ Created ${clusters.length} clusters`);

      return { places, clusters };
    } catch (error) {
      console.error('Error in Travel Agent processing:', error);
      throw error;
    }
  }

  /**
   * Geocode multiple place names
   */
  private async geocodePlaces(placeNames: string[]): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = [];

    for (const placeName of placeNames) {
      try {
        const result = await this.geocodePlace(placeName);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        console.warn(`Failed to geocode place: ${placeName}`, error);
        // Continue with other places
      }
    }

    return results;
  }

  /**
   * Geocode a single place name using OpenCage API
   */
  private async geocodePlace(placeName: string): Promise<GeocodingResult | null> {
    try {
      const encodedPlace = encodeURIComponent(placeName);
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodedPlace}&key=${this.geocodingApiKey}&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const components = result.components || {};

        return {
          name: placeName,
          coordinates: {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng,
          },
          address: result.formatted,
          metadata: {
            neighborhood: components.neighbourhood || components.suburb,
            city: components.city || components.town || components.village,
            country: components.country,
            placeType: result.components._type,
          },
        };
      }

      console.warn(`No geocoding results found for: ${placeName}`);
      return null;
    } catch (error) {
      console.error(`Error geocoding place ${placeName}:`, error);
      throw error;
    }
  }

  /**
   * Cluster places by geographic proximity using simple distance-based clustering
   * Uses a threshold of ~5km (0.045 degrees ~ 5km at equator)
   */
  clusterPlaces(places: Place[]): PlaceCluster[] {
    const CLUSTER_THRESHOLD_DEGREES = 0.045; // Approximately 5km
    const clusters: PlaceCluster[] = [];
    const assignedPlaces = new Set<string>();

    // Predefined colors for clusters
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

    places.forEach((place, index) => {
      if (assignedPlaces.has(place.id)) {
        return;
      }

      // Start a new cluster with this place
      const clusterPlaces: Place[] = [place];
      assignedPlaces.add(place.id);

      // Find nearby places
      places.forEach((otherPlace) => {
        if (assignedPlaces.has(otherPlace.id)) {
          return;
        }

        const distance = this.calculateDistance(
          place.coordinates,
          otherPlace.coordinates
        );

        if (distance <= CLUSTER_THRESHOLD_DEGREES) {
          clusterPlaces.push(otherPlace);
          assignedPlaces.add(otherPlace.id);
        }
      });

      // Only create cluster if we have 2+ places
      if (clusterPlaces.length >= 2) {
        const centroid = this.calculateCentroid(clusterPlaces.map(p => p.coordinates));
        const clusterId = randomUUID();

        // Update places with cluster ID
        clusterPlaces.forEach(p => {
          p.clusterId = clusterId;
        });

        clusters.push({
          id: clusterId,
          name: this.generateClusterName(clusterPlaces),
          centroid,
          placeIds: clusterPlaces.map(p => p.id),
          color: colors[clusters.length % colors.length],
        });
      }
    });

    return clusters;
  }

  /**
   * Calculate simple Euclidean distance between coordinates (good enough for short distances)
   */
  private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const latDiff = coord1.latitude - coord2.latitude;
    const lonDiff = coord1.longitude - coord2.longitude;
    return Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
  }

  /**
   * Calculate centroid of multiple coordinates
   */
  private calculateCentroid(coordinates: Coordinates[]): Coordinates {
    const sum = coordinates.reduce(
      (acc, coord) => ({
        latitude: acc.latitude + coord.latitude,
        longitude: acc.longitude + coord.longitude,
      }),
      { latitude: 0, longitude: 0 }
    );

    return {
      latitude: sum.latitude / coordinates.length,
      longitude: sum.longitude / coordinates.length,
    };
  }

  /**
   * Generate a meaningful name for a cluster based on its places
   */
  private generateClusterName(places: Place[]): string {
    // Try to find common city/neighborhood from metadata
    const cities = places
      .map(p => p.metadata?.city)
      .filter((city): city is string => !!city);

    if (cities.length > 0) {
      const mostCommonCity = this.getMostCommon(cities);
      return `${mostCommonCity} Area (${places.length} places)`;
    }

    // Fallback to place count
    return `Cluster of ${places.length} places`;
  }

  /**
   * Get most common element in array
   */
  private getMostCommon(arr: string[]): string {
    const counts = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).reduce((a, b) => (counts[a] > counts[b] ? a : b));
  }

  /**
   * Calculate map region to fit all places (for React Native Maps)
   */
  static calculateMapRegion(places: Place[]): MapRegion | null {
    if (places.length === 0) {
      return null;
    }

    if (places.length === 1) {
      // Single place - return focused region
      return {
        latitude: places[0].coordinates.latitude,
        longitude: places[0].coordinates.longitude,
        latitudeDelta: 0.05, // ~5km zoom
        longitudeDelta: 0.05,
      };
    }

    // Multiple places - calculate bounding box
    const latitudes = places.map(p => p.coordinates.latitude);
    const longitudes = places.map(p => p.coordinates.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;

    const latDelta = (maxLat - minLat) * 1.5; // Add 50% padding
    const lonDelta = (maxLon - minLon) * 1.5;

    return {
      latitude: centerLat,
      longitude: centerLon,
      latitudeDelta: Math.max(latDelta, 0.05), // Minimum delta
      longitudeDelta: Math.max(lonDelta, 0.05),
    };
  }
}
