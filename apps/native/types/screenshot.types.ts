import { InferredIntent } from './intent.types';

export type ScreenshotSource = 'share' | 'camera' | 'gallery';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchResults {
  query: string;
  results: TavilySearchResult[];
  searchedAt: string;
  resultCount: number;
}

export interface Screenshot {
  id: string;
  imageUri: string;
  createdAt: string;
  source: ScreenshotSource;
}

export interface ProcessedScreenshot extends Screenshot {
  intent: InferredIntent;
  extractedText?: string;
  extractedPlaceIds: string[];
  processingStatus: ProcessingStatus;
  searchResults?: SearchResults;
}
