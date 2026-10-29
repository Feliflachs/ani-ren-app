import type { TokenStorage } from './session';
// Web stores the token for the current tab only; native uses SecureStore.
const key = 'ani-ren.session-token.v1';
export const tokenStorage: TokenStorage = {
  get: async () => (typeof window === 'undefined' ? null : window.sessionStorage.getItem(key)),
  set: async (token) => {
    window.sessionStorage.setItem(key, token);
  },
  remove: async () => {
    window.sessionStorage.removeItem(key);
  },
};
