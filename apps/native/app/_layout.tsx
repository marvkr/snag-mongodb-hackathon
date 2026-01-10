import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack>
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
