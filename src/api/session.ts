import { createAuthApi, type SessionUser } from './auth';
import { ApiError, type ApiClient } from './client';

export type Profile = SessionUser & {
  statistics: {
    watched: number;
    watchlist: number;
    reviews: number;
    posts: number;
    followers: number;
    following: number;
    friends: number;
  };
  favorites: { anime: { id: string }; position: number }[];
};
export type TokenStorage = {
  get: () => Promise<string | null>;
  set: (token: string) => Promise<void>;
  remove: () => Promise<void>;
};
type State = { user: Profile | null; ready: boolean; error: string; generation: number };

export function createSession(
  storage: TokenStorage,
  makeClient: (getToken: () => string | null) => ApiClient,
) {
  let token: string | null = null;
  let state: State = { user: null, ready: false, error: '', generation: 0 };
  const listeners = new Set<() => void>();
  let pending: Promise<unknown> | null = null;
  const publish = (patch: Partial<State>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  const raw = () => makeClient(() => token);
  async function clear() {
    await storage.remove();
    token = null;
    publish({ user: null, ready: true, error: '', generation: state.generation + 1 });
  }
  const api: ApiClient = {
    async request(route, options) {
      const startedToken = token;
      try {
        return await raw().request(route, options);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          options?.authenticated !== false &&
          startedToken &&
          token === startedToken
        )
          await clear();
        throw error;
      }
    },
  };
  const auth = createAuthApi(api);
  function exclusive<T>(work: () => Promise<T>): Promise<T> {
    if (pending) return Promise.reject(new Error('Esperá a que termine la operación actual.'));
    const task = work();
    pending = task;
    void task
      .finally(() => {
        if (pending === task) pending = null;
      })
      .catch(() => {});
    return task;
  }
  async function profile(id: string) {
    return (await api.request<{ user: Profile }>(`/users/${encodeURIComponent(id)}`)).user;
  }
  return {
    api,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    getSnapshot: () => state,
    restore: () => {
      if (pending) return pending;
      return exclusive(async () => {
        publish({ ready: false, error: '' });
        try {
          token = await storage.get();
          if (token) {
            const { user } = await auth.session();
            publish({ user: await profile(user.id), generation: state.generation + 1 });
          }
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401))
            publish({
              error: error instanceof Error ? error.message : 'No pudimos restaurar la sesión.',
            });
        } finally {
          publish({ ready: true });
        }
      });
    },
    signIn: (handle: string, password: string) =>
      exclusive(async () => {
        try {
          const login = await auth.login(handle.trim(), password);
          token = login.token;
          try {
            const user = await profile(login.user.id);
            await storage.set(token!);
            publish({ user, error: '', generation: state.generation + 1 });
          } catch (error) {
            await createAuthApi(raw())
              .logout()
              .catch(() => {});
            token = null;
            throw error;
          }
          return true;
        } catch (error) {
          if (error instanceof ApiError && error.code === 'INVALID_CREDENTIALS') return false;
          throw error;
        }
      }),
    register: (handle: string, password: string) =>
      exclusive(() => auth.register(handle.trim(), password)),
    signOut: () =>
      exclusive(async () => {
        try {
          await auth.logout();
        } catch (error) {
          if (!(error instanceof ApiError && error.status === 401)) throw error;
        }
        await clear();
      }),
    updateProfile: async (changes: { name: string; bio: string; avatarId?: string | null }) => {
      const startedToken = token;
      const { user } = await api.request<{ user: SessionUser }>('/me/profile', {
        method: 'PATCH',
        body: changes,
      });
      if (token === startedToken && state.user?.id === user.id)
        publish({ user: { ...state.user, ...user } });
    },
  };
}
