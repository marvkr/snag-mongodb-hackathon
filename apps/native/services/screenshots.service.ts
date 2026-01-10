import { File } from 'expo-file-system';
import { ProcessedScreenshot } from '../types';
import { mockScreenshots } from '../mocks';
import { apiClient, USE_MOCK } from './api.client';
import {
  transformScreenshot,
  transformProcessResponse,
  BackendScreenshot,
  BackendProcessResponse,
} from './transformers';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface BackendListResponse {
  success: boolean;
  screenshots: BackendScreenshot[];
  count: number;
}

interface BackendGetResponse {
  success: boolean;
  screenshot: BackendScreenshot;
}

export const screenshotsService = {
  getAll: async (): Promise<ProcessedScreenshot[]> => {
    if (USE_MOCK) {
      await delay(500);
      return mockScreenshots;
    }
    const response = await apiClient.get<BackendListResponse>('/api/screenshots');
    return response.screenshots.map(transformScreenshot);
  },

  getById: async (id: string): Promise<ProcessedScreenshot | null> => {
    if (USE_MOCK) {
      await delay(300);
      return mockScreenshots.find((s) => s.id === id) || null;
    }
    const response = await apiClient.get<BackendGetResponse>(`/api/screenshots/${id}`);
    return response.screenshot ? transformScreenshot(response.screenshot) : null;
  },

  submit: async (imageUri: string): Promise<ProcessedScreenshot> => {
    if (USE_MOCK) {
      throw new Error('Submit not available in mock mode');
    }

    // Read image and convert to base64 using new File API
    const file = new File(imageUri);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binaryString);

    // Determine media type from URI
    const lowerUri = imageUri.toLowerCase();
    let mediaType = 'image/jpeg';
    if (lowerUri.includes('.png')) {
      mediaType = 'image/png';
    } else if (lowerUri.includes('.webp')) {
      mediaType = 'image/webp';
    }

    const response = await apiClient.post<BackendProcessResponse>(
      '/api/screenshots/process',
      {
        imageBase64: base64,
        imageMediaType: mediaType,
      }
    );

    return transformProcessResponse(response, imageUri);
  },
};
