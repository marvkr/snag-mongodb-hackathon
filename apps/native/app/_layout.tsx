import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
