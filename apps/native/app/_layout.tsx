import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { OnboardingProvider, useOnboardingContext, ShareIntentProvider } from '../contexts';
import { colors } from '../constants/colors';

function LoadingScreen() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

function RootNavigator() {
  const { isComplete, isLoading } = useOnboardingContext();
  const router = useRouter();
  const segments = useSegments();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';

    if (!isComplete && !inOnboarding) {
      router.replace('/onboarding');
    } else if (isComplete && inOnboarding) {
      router.replace('/(tabs)');
    }

    setIsNavigationReady(true);
  }, [isComplete, isLoading, segments, router]);

  if (isLoading || !isNavigationReady) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="screenshot/[id]"
          options={{
            presentation: 'modal',
            headerTitle: 'Screenshot Details',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <OnboardingProvider>
        <RootNavigator />
      </OnboardingProvider>
    </ShareIntentProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
