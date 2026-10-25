import * as SecureStore from 'expo-secure-store';
import type { TokenStorage } from './session';
const key = 'ani-ren.session-token.v1';
export const tokenStorage: TokenStorage = {
  get: () => SecureStore.getItemAsync(key),
  set: (token) => SecureStore.setItemAsync(key, token),
  remove: () => SecureStore.deleteItemAsync(key),
};
