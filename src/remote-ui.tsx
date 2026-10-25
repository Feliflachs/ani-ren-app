import { useEffect, useState, type ComponentType } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Screen, EmptyState, Action } from './components';
import { usePage, useRemote } from './context/RemoteContext';
import { useSession } from './context/SessionContext';
import { findAnime } from './data';
import type { RequestOptions } from './api/client';
export function QueryFooter({
  query,
}: {
  query: {
    loading: boolean;
    error: string;
    reload: () => void;
    hasMore?: boolean;
    more?: () => void;
  };
}) {
  return (
    <>
      {query.loading && <EmptyState loading title="Cargando…" text="Consultando los datos." />}
      {!!query.error && (
        <EmptyState
          title="No pudimos cargar los datos"
          text={query.error}
          action="Reintentar"
          onPress={query.reload}
        />
      )}
      {!query.loading && query.hasMore && <Action label="Cargar más" onPress={query.more!} />}
    </>
  );
}
export function useAnimeSearch(text: string) {
  const [query, setQuery] = useState(text);
  useEffect(() => {
    const timer = setTimeout(() => setQuery(text), 300);
    return () => clearTimeout(timer);
  }, [text]);
  const page = usePage('/search', { type: 'anime', q: query, page: 1 });
  return {
    ...page,
    animes: page.items
      .map((row) => findAnime(row.id))
      .filter((row): row is NonNullable<typeof row> => !!row),
  };
}
type Resource = [string, RequestOptions['query']?];
export function withResources(
  Component: ComponentType,
  resolve: (params: Record<string, string | string[]>, userId: string) => Resource[],
) {
  return function ResourceScreen() {
    const params = useLocalSearchParams<Record<string, string | string[]>>();
    const { user } = useSession();
    const store = useRemote();
    const resources = JSON.stringify(resolve(params, user?.id ?? ''));
    const [loaded, setLoaded] = useState('');
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    const revision = store.revision;
    useEffect(() => {
      let active = true;
      Promise.all(
        (JSON.parse(resources) as Resource[])
          .filter(([route]) => !route.endsWith('/undefined'))
          .map(([route, query]) => store.load(route, query ?? {}, retry > 0)),
      )
        .then(() => {
          if (active) {
            setError('');
            setLoaded(resources);
          }
        })
        .catch((e) => {
          if (active) {
            setError(e.message);
            if (loaded === resources) store.report(e);
          }
        });
      return () => {
        active = false;
      };
    }, [store, resources, retry, revision, loaded]);
    if (loaded !== resources)
      return (
        <Screen title="Ani-Ren" back>
          <EmptyState
            loading={!error}
            title={error ? 'No pudimos cargar esta pantalla' : 'Cargando…'}
            text={error || 'Consultando los datos.'}
            action={error ? 'Reintentar' : undefined}
            onPress={() => setRetry((n) => n + 1)}
          />
        </Screen>
      );
    return (
      <>
        <Component />
        {/* Subsequent mutation failures are shown in the screen notice. */}
      </>
    );
  };
}
