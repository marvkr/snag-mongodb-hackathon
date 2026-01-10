import { InferredIntent } from './intent.types';

export type ScreenshotSource = 'share' | 'camera' | 'gallery';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

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
}
