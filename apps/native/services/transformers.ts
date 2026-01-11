import {
  ProcessedScreenshot,
  ProcessingStatus,
  IntentBucket,
  InferredIntent,
  IntentCandidate,
  SearchResults,
  TavilySearchResult,
} from '../types';

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

interface BackendExtractedData {
  ocrText?: string;
  entities?: string[];
  places?: string[];
  products?: string[];
  metadata?: Record<string, unknown>;
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
  metadata?: {
    uploadedAt?: string | Date;
    filename?: string;
  };
  intent?: BackendIntent;
  extractedData?: BackendExtractedData;
  extractedMetadata?: BackendExtractedData; // Backend uses this field name
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

export function transformScreenshot(backend: BackendScreenshot): ProcessedScreenshot {
  const uploadedAt =
    backend.metadata?.uploadedAt || backend.processedAt || new Date().toISOString();
  const createdAt =
    typeof uploadedAt === 'string' ? uploadedAt : uploadedAt.toISOString();

  // Build image URI - prefer URL, fallback to base64 data URI
  let imageUri = backend.url || '';
  if (!imageUri && backend.imageBase64) {
    imageUri = `data:image/jpeg;base64,${backend.imageBase64}`;
  }

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
    extractedPlaceIds: extracted?.places || [],
    searchResults,
  };
}

export function transformProcessResponse(
  response: BackendProcessResponse,
  localImageUri: string
): ProcessedScreenshot {
  return {
    id: response.imageId,
    imageUri: localImageUri,
    createdAt: new Date().toISOString(),
    source: 'share',
    processingStatus: 'completed',
    intent: transformIntent(response.intent),
    extractedText: response.extractedData?.ocrText,
    extractedPlaceIds: response.extractedData?.places || [],
  };
}

export type { BackendScreenshot, BackendProcessResponse };
