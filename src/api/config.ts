import { createApiClient } from './client';

/** Called when the real session is wired in; no hardcoded production or demo server. */
export function createConfiguredApi(getToken: () => string | null) {
  return createApiClient({
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? '',
    getToken,
  });
}
