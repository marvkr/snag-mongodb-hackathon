export type IntentBucket = 'travel' | 'shopping' | 'startup' | 'general';

export interface IntentCandidate {
  bucket: IntentBucket;
  confidence: number;
}

export interface InferredIntent {
  primaryBucket: IntentBucket;
  confidence: number;
  rationale: string;
  candidates: IntentCandidate[];
  timestamp: string;
}
