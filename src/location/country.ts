import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type CountryResult = { code: string | null; message: string };
let cached: { code: string; expires: number } | undefined;
let pending: Promise<CountryResult> | undefined;
let asked = false;

// Only the country leaves this helper. Coordinates are neither persisted nor sent to our API.
export async function detectCountry(force = false): Promise<CountryResult> {
  if (Platform.OS === 'web')
    return { code: null, message: 'Elegí el país donde querés consultar las plataformas.' };
  if (!force && cached && cached.expires > Date.now()) return { code: cached.code, message: '' };
  if (pending) return pending;
  pending = (async () => {
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && permission.canAskAgain && (!asked || force)) {
        asked = true;
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted)
        return {
          code: null,
          message: 'Sin permiso de ubicación. Podés elegir el país manualmente.',
        };
      if (!(await Location.hasServicesEnabledAsync()))
        return {
          code: null,
          message: 'La ubicación está desactivada. Elegí un país o activala e intentá nuevamente.',
        };
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const code = await Promise.race([
          (async () => {
            const position = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Low,
            });
            const [address] = await Location.reverseGeocodeAsync({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            return address?.isoCountryCode?.toUpperCase() ?? null;
          })(),
          new Promise<null>((resolve) => {
            timer = setTimeout(() => resolve(null), 12000);
          }),
        ]);
        if (!code || !/^[A-Z]{2}$/.test(code))
          return {
            code: null,
            message: 'No pudimos detectar el país. Podés elegirlo manualmente.',
          };
        cached = { code, expires: Date.now() + 10 * 60_000 };
        return { code, message: '' };
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return { code: null, message: 'No pudimos detectar el país. Podés elegirlo manualmente.' };
    }
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
