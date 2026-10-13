import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError, errorMessage, request, type RequestOptions } from '../api';
import type { User } from '../models';
const KEY = 'ani-ren-session-v2';
let credentialWrite = Promise.resolve();
const saveToken = (token: string | null) => {
  if (Platform.OS === 'web') return Promise.resolve();
  credentialWrite = credentialWrite
    .catch(() => {})
    .then(() => (token ? SecureStore.setItemAsync(KEY, token) : SecureStore.deleteItemAsync(KEY)));
  return credentialWrite;
};
type SessionValue = {
  user: User | null;
  token: string | null;
  ready: boolean;
  restoreError: string;
  retry: () => void;
  signIn: (handle: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => void;
  api: <T>(path: string, options?: RequestOptions) => Promise<T>;
};
const SessionContext = createContext<SessionValue | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ user: User; token: string } | null>(null);
  const [ready, setReady] = useState(false);
  const [restoreError, setRestoreError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const generation = useRef(0);
  const activeToken = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = Platform.OS === 'web' ? null : await SecureStore.getItemAsync(KEY);
        if (token) {
          const { user } = await request<{ user: User }>('/auth/me', token);
          if (active) {
            activeToken.current = token;
            setSession({ user, token });
          }
        }
      } catch (error) {
        if (active && error instanceof ApiError && error.status === 401) await saveToken(null);
        else if (active) setRestoreError(errorMessage(error));
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, [retryCount]);
  const token = session?.token ?? null;
  const api = useCallback(
    async <T,>(path: string, options?: RequestOptions) => {
      if (token !== activeToken.current) throw new Error('La sesión cambió.');
      const current = generation.current;
      try {
        const result = await request<T>(path, token, options);
        if (current !== generation.current) throw new Error('La sesión cambió.');
        return result;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401 && current === generation.current) {
          generation.current++;
          activeToken.current = null;
          setSession(null);
          await saveToken(null);
        }
        throw error;
      }
    },
    [token],
  );
  async function signIn(handle: string, password: string) {
    const response = await request<{ user: User; token: string }>('/auth/login', null, {
      method: 'POST',
      body: { handle: handle.trim(), password },
    });
    await saveToken(response.token);
    generation.current++;
    activeToken.current = response.token;
    setSession(response);
    return true;
  }
  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    await saveToken(null);
    generation.current++;
    activeToken.current = null;
    setSession(null);
  }
  return (
    <SessionContext.Provider
      value={{
        user: session?.user ?? null,
        token,
        ready,
        restoreError,
        retry: () => {
          setReady(false);
          setRestoreError('');
          setRetryCount((n) => n + 1);
        },
        signIn,
        signOut,
        updateUser: (user) =>
          setSession((current) => (current?.user.id === user.id ? { ...current, user } : current)),
        api,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Falta SessionProvider');
  return value;
}
