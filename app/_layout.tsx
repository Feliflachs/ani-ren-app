import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppStateProvider } from '../src/AppState';
import { theme } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts(Ionicons.font);
  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="light" />
        <View style={styles.background}>
          {/* El mismo contenedor limita pantallas y tabs en ventanas grandes. */}
          <View style={styles.app}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" />
            </Stack>
          </View>
        </View>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, alignItems: 'center', backgroundColor: theme.colors.surface },
  app: {
    flex: 1,
    width: '100%',
    maxWidth: theme.layout.maxWidth,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
});
