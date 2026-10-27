import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { Text } from 'react-native';
import { useSession } from './SessionContext';
import { createRemoteStore, ApiError, type RemoteStore, type Wire } from '../api/remote';
import type { RequestOptions } from '../api/client';
import { theme } from '../theme';
const Context = createContext<RemoteStore | null>(null);
export function RemoteProvider({ children }: { children: ReactNode }) {
  const { api, user } = useSession();
  const [store] = useState(() => createRemoteStore(api));
  // The authenticated profile is already validated before this provider is mounted.
  store.activate();
  store.ingest(user);
  return (
    <Context.Provider value={store}>
      <AccountSync />
      {children}
    </Context.Provider>
  );
}
function AccountSync() {
  const { user } = useSession();
  useQuery(user ? `/users/${user.id}` : undefined);
  return null;
}
export function useRemote() {
  const store = useContext(Context);
  if (!store) throw new Error('Falta RemoteProvider');
  useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return store;
}
export function useQuery(route: string | undefined, query: RequestOptions['query'] = {}) {
  const store = useRemote();
  const [retry, setRetry] = useState(0);
  const revision = store.revision;
  const key = JSON.stringify([route, query, revision, retry]);
  const args = useMemo(
    () => JSON.parse(key) as [string | undefined, RequestOptions['query']],
    [key],
  );
  const [state, setState] = useState<{ key: string; data?: Wire; loading: boolean; error: string }>(
    { key: '', loading: true, error: '' },
  );
  useEffect(() => {
    let active = true;
    if (!args[0]) return;
    store
      .load(args[0], args[1], retry > 0)
      .then((data) => {
        if (active) setState({ key, data, loading: false, error: '' });
      })
      .catch((e) => {
        if (active)
          setState({
            key,
            loading: false,
            error: e instanceof Error ? e.message : 'No se pudo cargar.',
          });
      });
    return () => {
      active = false;
    };
  }, [store, key, args, retry, revision]);
  const current = state.key === key ? state : { key, loading: !!route, error: '' };
  return { ...current, reload: () => setRetry((n) => n + 1) };
}
export function usePage(
  route: string | undefined,
  query: RequestOptions['query'] = {},
  itemField = 'items',
) {
  const pendingPage = useRef<string | null>(null);
  const store = useRemote();
  const [retry, setRetry] = useState(0);
  const revision = store.pageRevision(route);
  const key = JSON.stringify([route, query, revision, retry]);
  const args = useMemo(
    () => JSON.parse(key) as [string | undefined, RequestOptions['query']],
    [key],
  );
  const [state, setState] = useState<{
    key: string;
    items: Wire[];
    data?: Wire;
    loading: boolean;
    error: string;
  }>({ key: '', items: [], loading: true, error: '' });
  useEffect(() => {
    let active = true;
    if (route)
      store
        .load(route, args[1], retry > 0)
        .then((data) => {
          if (active)
            setState({ key, items: data[itemField] ?? [], data, loading: false, error: '' });
        })
        .catch((e) => {
          if (active) setState({ key, items: [], loading: false, error: e.message });
        });
    return () => {
      active = false;
    };
  }, [store, key, args, route, retry, revision, itemField]);
  // Keep mounted comment threads and their expanded state while refreshing the same query.
  const sameQuery =
    state.key &&
    JSON.stringify(JSON.parse(state.key).slice(0, 2)) === JSON.stringify([route, query]);
  const current =
    state.key === key
      ? state
      : {
          key,
          items: sameQuery ? state.items : [],
          data: sameQuery ? state.data : undefined,
          loading: !!route,
          error: '',
        };
  async function more() {
    if (!route || current.loading || pendingPage.current === key) return;
    const next = current.data?.nextCursor ?? current.data?.nextPage;
    if (next == null) return;
    pendingPage.current = key;
    setState({ ...current, loading: true, error: '' });
    try {
      const data = await store.load(route, {
        ...args[1],
        ...(current.data?.nextCursor ? { cursor: next } : { page: next }),
      });
      setState((old) =>
        old.key === key
          ? {
              key,
              items: [...old.items, ...(data[itemField] ?? [])],
              data,
              loading: false,
              error: '',
            }
          : old,
      );
    } catch (e) {
      if (e instanceof ApiError && e.status === 410) {
        setRetry((n) => n + 1);
        return;
      }
      setState((old) =>
        old.key === key
          ? { ...old, loading: false, error: e instanceof Error ? e.message : 'No se pudo cargar.' }
          : old,
      );
    } finally {
      if (pendingPage.current === key) pendingPage.current = null;
    }
  }
  return {
    ...current,
    more,
    hasMore: !!(current.data?.nextCursor ?? current.data?.nextPage),
    reload: () => setRetry((n) => n + 1),
  };
}
export function RemoteNotice() {
  const store = useRemote();
  return store.error ? (
    <Text
      accessibilityRole="alert"
      style={{ color: theme.colors.accent }}
      onPress={() => store.dismiss()}
    >
      {store.error}
    </Text>
  ) : null;
}
