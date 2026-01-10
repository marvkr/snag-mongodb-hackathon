import { ProcessedScreenshot } from '../types';

export const mockScreenshots: ProcessedScreenshot[] = [
  {
    id: 'ss-001',
    imageUri: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=600&fit=crop',
    createdAt: '2024-01-15T10:30:00Z',
    source: 'share',
    processingStatus: 'completed',
    intent: {
      primaryBucket: 'travel',
      confidence: 0.86,
      rationale: 'Screenshot contains restaurant recommendation from LA food blogger with specific location mentions in Silver Lake area',
      candidates: [
        { bucket: 'travel', confidence: 0.86 },
        { bucket: 'general', confidence: 0.14 },
      ],
      timestamp: '2024-01-15T10:31:00Z',
    },
    extractedText: 'Best brunch spot in Silver Lake! @cafe_stella has the most amazing avocado toast and the vibes are immaculate...',
    extractedPlaceIds: ['place-001'],
  },
  {
    id: 'ss-002',
    imageUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=600&fit=crop',
    createdAt: '2024-01-16T14:20:00Z',
    source: 'share',
    processingStatus: 'completed',
    intent: {
      primaryBucket: 'travel',
      confidence: 0.92,
      rationale: 'Beach sunset photo from Venice with geotag visible and location-specific hashtags',
      candidates: [
        { bucket: 'travel', confidence: 0.92 },
        { bucket: 'general', confidence: 0.08 },
      ],
      timestamp: '2024-01-16T14:21:00Z',
    },
    extractedText: 'Golden hour at Venice Beach never disappoints. This is why I moved to LA.',
    extractedPlaceIds: ['place-002'],
  },
  {
    id: 'ss-003',
    imageUri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&h=600&fit=crop',
    createdAt: '2024-01-17T09:00:00Z',
    source: 'share',
    processingStatus: 'completed',
    intent: {
      primaryBucket: 'travel',
      confidence: 0.78,
      rationale: 'Hiking trail recommendation post mentioning Malibu Creek State Park with outdoor activity context',
      candidates: [
        { bucket: 'travel', confidence: 0.78 },
        { bucket: 'general', confidence: 0.22 },
      ],
      timestamp: '2024-01-17T09:01:00Z',
    },
    extractedText: 'Finally did the Rock Pool trail at Malibu Creek! Only 3.5 miles but the views are worth it.',
    extractedPlaceIds: ['place-003'],
  },
];
