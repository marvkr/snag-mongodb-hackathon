import { File } from 'expo-file-system';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { ProcessedScreenshot } from '../types';
import { apiClient } from './api.client';
import {
  transformScreenshot,
  transformProcessResponse,
  BackendScreenshot,
  BackendProcessResponse,
} from './transformers';

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
    const response = await apiClient.get<BackendListResponse>('/api/screenshots');
    return response.screenshots.map(transformScreenshot);
  },

  getById: async (id: string): Promise<ProcessedScreenshot | null> => {
    const response = await apiClient.get<BackendGetResponse>(`/api/screenshots/${id}`);
    return response.screenshot ? transformScreenshot(response.screenshot) : null;
  },

  submit: async (imageUri: string): Promise<ProcessedScreenshot> => {

    // Compress image to ensure it's under 5 MB
    const compressedImage = await manipulateAsync(
      imageUri,
      [{ resize: { width: 2048 } }],
      { compress: 0.7, format: SaveFormat.JPEG }
    );

    // Read compressed image and convert to base64
    const file = new File(compressedImage.uri);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binaryString);

    // Always use JPEG media type for compressed images
    const response = await apiClient.post<BackendProcessResponse>(
      '/api/screenshots/process',
      {
        imageBase64: base64,
        imageMediaType: 'image/jpeg',
      }
    );

    return transformProcessResponse(response, compressedImage.uri);
  },
};
