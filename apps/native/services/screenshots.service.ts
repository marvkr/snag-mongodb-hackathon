import { ProcessedScreenshot } from '../types';
import { mockScreenshots } from '../mocks';
import { apiClient, USE_MOCK } from './api.client';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const screenshotsService = {
  getAll: async (): Promise<ProcessedScreenshot[]> => {
    if (USE_MOCK) {
      await delay(500);
      return mockScreenshots;
    }
    return apiClient.get<ProcessedScreenshot[]>('/screenshots');
  },

  getById: async (id: string): Promise<ProcessedScreenshot | null> => {
    if (USE_MOCK) {
      await delay(300);
      return mockScreenshots.find((s) => s.id === id) || null;
    }
    return apiClient.get<ProcessedScreenshot>(`/screenshots/${id}`);
  },

  submit: async (imageUri: string): Promise<ProcessedScreenshot> => {
    if (USE_MOCK) {
      throw new Error('Submit not available in mock mode');
    }
    return apiClient.post<ProcessedScreenshot>('/screenshots', { imageUri });
  },
};
