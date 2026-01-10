import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'snag_onboarding_complete';

export function useOnboardingComplete() {
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setIsComplete(value === 'true');
    } catch {
      setIsComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setIsComplete(true);
    } catch {
      // Silent fail - still navigate
      setIsComplete(true);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setIsComplete(false);
    } catch {
      // Silent fail
    }
  }, []);

  return {
    isComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
