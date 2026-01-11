import {
  ProcessedScreenshot,
  ProcessingStatus,
  IntentBucket,
  InferredIntent,
  IntentCandidate,
  ScreenshotLocation,
  ExtractedData,
  SearchResults,
  TavilySearchResult,
} from '../types';
import { API_BASE_URL } from './api.client';

// Backend response types
interface BackendBucketCandidate {
  bucket: string;
  confidence: number;
}

interface BackendIntent {
  primary_bucket: string;
  bucket_candidates: BackendBucketCandidate[];
  confidence: number;
  rationale: string;
}

interface BackendPlace {
  name: string;
  latitude?: number;
  longitude?: number;
}

interface BackendExtractedData {
  ocrText?: string;
  entities?: string[];
  places?: (string | BackendPlace)[];
  products?: string[];
  metadata?: Record<string, unknown>;
}

interface BackendLocation {
  name: string;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
  googleMapsUrl?: string;
}

interface BackendTavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface BackendSearchResults {
  query: string;
  results: BackendTavilyResult[];
  searchedAt: string | Date;
  resultCount: number;
}

interface BackendScreenshot {
  id: string;
  bucketId: string;
  url?: string;
  imageBase64?: string;
  thumbnailBase64?: string;
  metadata?: {
    uploadedAt?: string | Date;
    filename?: string;
    contentType?: string;
  };
  intent?: BackendIntent;
  extractedData?: BackendExtractedData;
  extractedMetadata?: BackendExtractedData; // Backend uses this field name
  location?: BackendLocation;
  status?: string;
  processedAt?: string | Date;
  searchResults?: BackendSearchResults;
}

interface BackendProcessResponse {
  success: boolean;
  imageId: string;
  bucketId: string;
  intent: BackendIntent;
  extractedData?: BackendExtractedData;
  hasEmbedding: boolean;
  embeddingDimensions: number;
}

const VALID_BUCKETS: IntentBucket[] = ['travel', 'shopping', 'startup', 'general'];

function mapBucket(bucket: string): IntentBucket {
  // Map backend bucket names to frontend IntentBucket
  const bucketMap: Record<string, IntentBucket> = {
    travel: 'travel',
    products: 'shopping', // Backend uses 'products', frontend uses 'shopping'
    twitter: 'startup', // Backend uses 'twitter', frontend uses 'startup'
    general: 'general',
  };
  return bucketMap[bucket] || 'general';
}

function transformIntent(backendIntent: BackendIntent): InferredIntent {
  const candidates: IntentCandidate[] = (backendIntent.bucket_candidates || []).map(
    (c) => ({
      bucket: mapBucket(c.bucket),
      confidence: c.confidence,
    })
  );

  return {
    primaryBucket: mapBucket(backendIntent.primary_bucket),
    confidence: backendIntent.confidence,
    rationale: backendIntent.rationale,
    candidates,
    timestamp: new Date().toISOString(),
  };
}

function transformLocation(backendLocation?: BackendLocation): ScreenshotLocation | undefined {
  if (!backendLocation) return undefined;

  return {
    name: backendLocation.name,
    address: backendLocation.address,
    coordinates: backendLocation.coordinates
      ? {
          latitude: backendLocation.coordinates.lat,
          longitude: backendLocation.coordinates.lng,
        }
      : undefined,
    placeId: backendLocation.placeId,
    googleMapsUrl: backendLocation.googleMapsUrl,
  };
}

function normalizePlaceName(place: string | BackendPlace): string {
  if (typeof place === 'string') return place;
  return place.name;
}

function extractLocationFromPlaces(extracted?: BackendExtractedData): ScreenshotLocation | undefined {
  if (!extracted?.places || extracted.places.length === 0) return undefined;

  const firstPlace = extracted.places[0];
  if (typeof firstPlace === 'string') {
    return { name: firstPlace };
  }

  return {
    name: firstPlace.name,
    coordinates:
      firstPlace.latitude !== undefined && firstPlace.longitude !== undefined
        ? { latitude: firstPlace.latitude, longitude: firstPlace.longitude }
        : undefined,
  };
}

function transformExtractedData(extracted?: BackendExtractedData): ExtractedData | undefined {
  if (!extracted) return undefined;

  return {
    places: (extracted.places || []).map(normalizePlaceName),
    entities: extracted.entities || [],
    ocrText: extracted.ocrText,
  };
}

export function transformScreenshot(backend: BackendScreenshot): ProcessedScreenshot {
  console.log('[Transformer] Processing screenshot:', backend.id);
  console.log('[Transformer] Has URL:', !!backend.url);
  console.log('[Transformer] Has thumbnailBase64:', !!backend.thumbnailBase64);
  console.log('[Transformer] Has imageBase64:', !!backend.imageBase64);
  console.log('[Transformer] thumbnailBase64 length:', backend.thumbnailBase64?.length || 0);
  console.log('[Transformer] imageBase64 length:', backend.imageBase64?.length || 0);

  const uploadedAt =
    backend.metadata?.uploadedAt || backend.processedAt || new Date().toISOString();
  const createdAt =
    typeof uploadedAt === 'string' ? uploadedAt : uploadedAt.toISOString();

  // Build image URI - prefer URL, fallback to thumbnail, then full image, then API endpoint
  let imageUri = backend.url || '';
  if (imageUri && imageUri.startsWith('/')) {
    // Relative URL - prepend API base URL
    imageUri = `${API_BASE_URL}${imageUri}`;
    console.log('[Transformer] Using relative URL:', imageUri);
  } else if (!imageUri) {
    // Use thumbnail for faster loading, fallback to full image if thumbnail not available
    const base64Data = backend.thumbnailBase64 || backend.imageBase64;
    console.log('[Transformer] Using base64 data, length:', base64Data?.length || 0);
    if (base64Data) {
      const contentType = backend.metadata?.contentType || 'image/jpeg';
      imageUri = `data:${contentType};base64,${base64Data}`;
      console.log('[Transformer] Created data URI with contentType:', contentType);
    } else {
      // No base64 data available - use API endpoint to fetch image
      imageUri = `${API_BASE_URL}/api/screenshots/${backend.id}/image`;
      console.log('[Transformer] ⚠️ No base64 data, using image API endpoint:', imageUri);
    }
  }

  console.log('[Transformer] Final imageUri length:', imageUri.length);
  console.log('[Transformer] Final imageUri prefix:', imageUri.substring(0, 50));

  // Backend uses extractedMetadata, fallback to extractedData
  const extracted = backend.extractedMetadata || backend.extractedData;

  // Build intent from backend.intent or infer from bucketId
  let intent: InferredIntent;
  if (backend.intent) {
    intent = transformIntent(backend.intent);
  } else {
    // Fallback: create intent from bucketId
    intent = {
      primaryBucket: mapBucket(backend.bucketId),
      confidence: 0.8,
      rationale: extracted?.ocrText || 'Classified from screenshot',
      candidates: [{ bucket: mapBucket(backend.bucketId), confidence: 0.8 }],
      timestamp: createdAt,
    };
  }

  // Derive location: prefer backend.location, fallback to first place from extractedData
  const location = transformLocation(backend.location) || extractLocationFromPlaces(extracted);

  // Transform search results if present
  let searchResults: SearchResults | undefined;
  if (backend.searchResults) {
    const searchedAt = typeof backend.searchResults.searchedAt === 'string'
      ? backend.searchResults.searchedAt
      : backend.searchResults.searchedAt.toISOString();

    searchResults = {
      query: backend.searchResults.query,
      results: backend.searchResults.results.map(r => ({
        title: r.title,
        url: r.url,
        content: r.content,
        score: r.score,
      })),
      searchedAt,
      resultCount: backend.searchResults.resultCount,
    };
  }

  return {
    id: backend.id,
    imageUri,
    createdAt,
    source: 'share',
    processingStatus: (backend.status as ProcessingStatus) || 'completed',
    intent,
    extractedText: extracted?.ocrText,
    extractedPlaceIds: (extracted?.places || []).map(normalizePlaceName),
    location,
    extractedData: transformExtractedData(extracted),
    searchResults,
  };
}

export function transformProcessResponse(
  response: BackendProcessResponse,
  localImageUri: string
): ProcessedScreenshot {
  const extracted = response.extractedData;

  return {
    id: response.imageId,
    imageUri: localImageUri,
    createdAt: new Date().toISOString(),
    source: 'share',
    processingStatus: 'completed',
    intent: transformIntent(response.intent),
    extractedText: extracted?.ocrText,
    extractedPlaceIds: (extracted?.places || []).map(normalizePlaceName),
    location: extractLocationFromPlaces(extracted),
    extractedData: transformExtractedData(extracted),
  };
}

export type { BackendScreenshot, BackendProcessResponse };
