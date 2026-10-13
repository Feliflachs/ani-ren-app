/* Remote query effects explicitly publish loading state when their subscription changes. */
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { randomUUID } from 'expo-crypto';
import { useFocusEffect } from 'expo-router';
import {
  ApiError,
  Submission,
  appendUnique,
  errorMessage,
  query,
  type RequestOptions,
} from './api';
import { useSession } from './context/SessionContext';
import type { Page } from './models';

const RemoteContext = createContext({ revision: 0, invalidate: () => {} });
export function RemoteProvider({ children }: { children: ReactNode }) {
  const [revision, setRevision] = useState(0);
  const invalidate = useCallback(() => setRevision((n) => n + 1), []);
  return (
    <RemoteContext.Provider value={{ revision, invalidate }}>{children}</RemoteContext.Provider>
  );
}
export function useQuery<T>(path: string | null) {
  const focused = useScreenActive();
  const { api } = useSession();
  const { revision } = useContext(RemoteContext);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    path: string | null;
    data?: T;
    error: string;
    loading: boolean;
  }>({ path, error: '', loading: !!path });
  useEffect(() => {
    if (!focused) return;
    const controller = new AbortController();
    if (!path) {
      setState({ path, error: '', loading: false });
      return;
    }
    setState((old) => ({
      path,
      data: old.path === path ? old.data : undefined,
      error: '',
      loading: true,
    }));
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ path, data, error: '', loading: false });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState((old) => ({ ...old, error: errorMessage(error), loading: false }));
      });
    return () => controller.abort();
  }, [path, api, revision, attempt, focused]);
  return {
    ...(state.path === path ? state : { data: undefined, error: '', loading: !!path }),
    reload: () => setAttempt((n) => n + 1),
  };
}
const defaultIdentity = (item: unknown) => {
  const value = item as { id?: string; anime?: { id: string }; user?: { id: string } };
  return value.id ?? value.anime?.id ?? value.user?.id ?? JSON.stringify(value);
};
export function usePage<T>(path: string | null, numbered = false) {
  const focused = useScreenActive();
  const { api } = useSession();
  const { revision } = useContext(RemoteContext);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<{
    path: string | null;
    items: T[];
    data?: Page<T>;
    next: string | number | null;
    loading: boolean;
    error: string;
  }>({ path, items: [], next: null, loading: !!path, error: '' });
  const active = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    generation.current++;
    const requestGeneration = generation.current;
    active.current?.abort();
    busy.current = false;
    if (!focused) return;
    setState({ path, items: [], next: null, loading: !!path, error: '' });
    if (!path) return;
    const controller = new AbortController();
    active.current = controller;
    busy.current = true;
    api<Page<T>>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({
            path,
            data,
            items: appendUnique([], data.items, defaultIdentity),
            next: (numbered ? data.nextPage : data.nextCursor) ?? null,
            loading: false,
            error: '',
          });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState((old) => ({ ...old, loading: false, error: errorMessage(error) }));
      })
      .finally(() => {
        if (!controller.signal.aborted) busy.current = false;
      });
    return () => {
      generation.current = requestGeneration + 1;
      active.current?.abort();
    };
  }, [path, api, revision, refresh, numbered, focused]);
  async function more() {
    if (!focused || !path || busy.current || state.next === null || state.path !== path) return;
    busy.current = true;
    const current = generation.current;
    const controller = new AbortController();
    active.current = controller;
    setState((old) => ({ ...old, loading: true, error: '' }));
    try {
      const data = await api<Page<T>>(query(path, { [numbered ? 'page' : 'cursor']: state.next }), {
        signal: controller.signal,
      });
      if (current === generation.current && !controller.signal.aborted)
        setState((old) => ({
          path,
          data,
          items: appendUnique(old.items, data.items, defaultIdentity),
          next: (numbered ? data.nextPage : data.nextCursor) ?? null,
          loading: false,
          error: '',
        }));
    } catch (error) {
      if (current !== generation.current || controller.signal.aborted) return;
      if (error instanceof ApiError && error.status === 410) setRefresh((n) => n + 1);
      else setState((old) => ({ ...old, loading: false, error: errorMessage(error) }));
    } finally {
      if (current === generation.current) busy.current = false;
    }
  }
  const visible =
    state.path === path
      ? state
      : { items: [] as T[], data: undefined, next: null, loading: !!path, error: '' };
  return {
    ...visible,
    more,
    reload: () => setRefresh((n) => n + 1),
    retry: () => (state.next === null ? setRefresh((n) => n + 1) : void more()),
  };
}
export function useMutation() {
  const { api } = useSession();
  const { invalidate } = useContext(RemoteContext);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const attempt = useRef(new Submission());
  const busy = useRef(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function run<T>(path: string, options: RequestOptions): Promise<T | undefined> {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const key =
        options.method === 'POST'
          ? attempt.current.prepare(path, options.body, randomUUID)
          : undefined;
      const result = await api<T>(path, { ...options, key });
      attempt.current.resolve();
      if (!alive.current) return;
      setUncertain(false);
      invalidate();
      return result;
    } catch (failure) {
      if (!alive.current) return;
      const ambiguous =
        failure instanceof ApiError && (failure.status === 0 || failure.status >= 500);
      if (!ambiguous) attempt.current.resolve();
      setUncertain(ambiguous);
      setError(errorMessage(failure));
    } finally {
      busy.current = false;
      if (alive.current) setPending(false);
    }
  }
  return { run, pending, error, uncertain };
}
export function useDebounce(value: string, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// Hidden stack screens and inactive tabs do not refetch private data on every mutation.
function useScreenActive() {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused;
}
