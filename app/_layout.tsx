import { RemoteProvider } from '../src/remote';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SessionProvider, useSession } from '../src/context/SessionContext';
import { theme } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <SessionScope />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function SessionScope() {
  const { token } = useSession();
  return (
    <RemoteProvider key={token ?? 'guest'}>
      <SessionNavigation />
    </RemoteProvider>
  );
}
function SessionNavigation() {
  const { user, ready, restoreError, retry } = useSession();
  const [loaded, error] = useFonts(Ionicons.font);
  useEffect(() => {
    if (ready && (loaded || error)) void SplashScreen.hideAsync();
  }, [ready, loaded, error]);
  if (!ready || (!loaded && !error)) return null;
  if (restoreError)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <Text style={{ color: theme.colors.text }}>{restoreError}</Text>
        <Button title="Reintentar sesión" onPress={retry} />
      </View>
    );

  return (
    <View key={user?.id ?? 'guest'} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View style={styles.background}>
        {/* El mismo contenedor limita pantallas y tabs en ventanas grandes. */}
        <View style={styles.app}>
          <Stack
            initialRouteName="index"
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: theme.colors.background },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Protected guard={!user}>
              <Stack.Screen name="login/index" />
              <Stack.Screen name="login/crear-cuenta" />
            </Stack.Protected>
            <Stack.Protected guard={!!user}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="aura/misiones" />
              <Stack.Screen name="aura/rangos" />
              <Stack.Screen name="aura/ranking" />
              <Stack.Screen name="crear/review/escribir" />
              <Stack.Screen name="crear/posteo" />
              <Stack.Screen name="explorar/anime/[id]" />
              <Stack.Screen name="explorar/busqueda" />
              <Stack.Screen name="explorar/mapa/index" />
              <Stack.Screen name="explorar/mapa/[pais]" />
              <Stack.Screen name="explorar/tops" />
              <Stack.Screen name="inicio/review/[id]" />
              <Stack.Screen name="perfil/biblioteca" />
              <Stack.Screen name="perfil/reviews" />
              <Stack.Screen name="perfil/comunidad" />
              <Stack.Screen name="perfil/editar" />
              <Stack.Screen name="perfil/listas/[id]" />
              <Stack.Screen name="perfil/listas/editar" />
              <Stack.Screen name="perfil/usuario/[id]" />
            </Stack.Protected>
          </Stack>
        </View>
      </View>
    </View>
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
