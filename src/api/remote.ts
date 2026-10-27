import type { ApiClient, RequestOptions } from './client';
import { ApiError } from './client';
import {
  anime,
  users,
  lists,
  reviews,
  genres,
  seasons,
  resetEntities,
  type Anime,
  type User,
  type AnimeList,
} from '../data';
import type { Publication } from '../publications';

// DTO boundary: transport fields are adapted here, never used as application rules.
export type Wire = Record<string, any>;
const image = (url?: string) => (url ? { uri: url } : require('../../assets/mascota.png'));
const seasonNames: Record<string, string> = {
  spring: 'Primavera',
  summer: 'Verano',
  fall: 'Otoño',
  winter: 'Invierno',
};
export const seasonLabel = (season: string, year: number) =>
  `${seasonNames[season] ?? season} ${year}`;
export const genreIds = new Map<string, string>();
const put = <T extends { id: string }>(items: T[], item: T) => {
  const index = items.findIndex((value) => value.id === item.id);
  if (index < 0) items.push(item);
  else items[index] = { ...items[index], ...item };
};
export function adaptAnime(row: Wire): Anime {
  const metadata = row.statistics ?? {};
  const previous = anime.find((item) => item.id === row.id);
  const labels = (typeof row.genres === 'string' ? JSON.parse(row.genres) : (row.genres ?? [])).map(
    (genre: Wire) => {
      genreIds.set(genre.name, genre.id);
      return genre.name;
    },
  );
  return {
    id: row.id,
    title: row.title,
    japanese: row.japanese ?? '',
    image: image(row.imageUrl),
    rating: metadata.averageRating ?? row.averageRating ?? previous?.rating ?? 0,
    year: row.year ?? 0,
    episodes: row.episodes ?? 0,
    duration: row.durationMinutes ?? 0,
    genres: labels,
    season: seasonLabel(row.season ?? '', row.year ?? 0),
    studio: (typeof row.studios === 'string' ? JSON.parse(row.studios) : (row.studios ?? [])).join(
      ' · ',
    ),
    synopsisEs: row.synopsisEs === undefined ? previous?.synopsisEs : row.synopsisEs,
    synopsis: (
      row.synopsisEs ??
      (row.synopsisEs === undefined ? previous?.synopsisEs : null) ??
      row.synopsis ??
      ''
    )
      .replace(/\s*\[Written by MAL Rewrite\]\s*$/i, '')
      .trim(),
    watched: metadata.watched ?? row.views ?? previous?.watched ?? 0,
    popularity: row.popularity ?? previous?.popularity ?? 0,
  };
}
export function adaptUser(row: Wire): User {
  const previous = users.find((item) => item.id === row.id);
  return {
    id: row.id,
    name: row.name,
    handle: row.handle,
    bio: row.bio ?? '',
    image: image(row.avatarUrl),
    watched: row.statistics?.watched ?? previous?.watched ?? 0,
    watchlist: row.statistics?.watchlist ?? previous?.watchlist ?? 0,
    reviews: row.statistics?.reviews ?? previous?.reviews ?? 0,
    followers: row.statistics?.followers ?? previous?.followers ?? 0,
    following: row.statistics?.following ?? previous?.following ?? 0,
    favorites: row.favorites?.map((item: Wire) => item.anime.id) ?? previous?.favorites ?? [],
    auraPoints: row.auraPoints ?? previous?.auraPoints,
    rank: row.rank?.name ?? previous?.rank,
    rankProgress: row.rank ?? previous?.rankProgress,
    isFollowing: row.isFollowing ?? previous?.isFollowing,
    isFriend: row.isFriend ?? previous?.isFriend,
  };
}
export function adaptPublication(row: Wire): Publication {
  const common = {
    id: String(row.id),
    userId: row.userId,
    text: row.text,
    title: row.title ?? undefined,
    time: new Date(row.createdAt).toLocaleDateString('es-AR'),
    createdAt: row.createdAt,
    tags: row.tags ?? [],
    spoiler: row.spoiler,
    likes: row.likeCount,
    comments: row.commentCount,
  };
  return row.kind === 'review'
    ? {
        ...common,
        kind: 'review',
        animeId: row.animeId,
        rating: row.rating ?? undefined,
        date: row.watchedOn?.split('-').reverse().join('/'),
      }
    : { ...common, kind: 'post', animeIds: row.animeIds };
}
let owner: object | null = null;
export function createRemoteStore(api: ApiClient) {
  const identity = {};
  let version = 0,
    revision = 0,
    feedRevision = 0,
    error = '';
  const listeners = new Set<() => void>();
  const pendingActions = new Set<string>();
  const cache = new Map<string, Wire>();
  const inflight = new Map<string, Promise<Wire>>();
  const operations = new Map<string, string>();
  const rawUsers = new Map<string, Wire>();
  const rawPublications = new Map<string, Wire>();
  const rawLists = new Map<string, Wire>();
  const activity = new Map<string, Wire>();
  const emit = () => {
    if (owner !== identity) return;
    version++;
    listeners.forEach((fn) => fn());
  };
  function ingest(value: unknown) {
    if (owner !== identity || !value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(ingest);
      return;
    }
    const row = value as Wire;
    Object.values(row).forEach(ingest);
    if (typeof row.id !== 'string') return;
    if (row.externalId && row.title) put(anime, adaptAnime(row));
    else if (row.handle && row.name) {
      rawUsers.set(row.id, { ...rawUsers.get(row.id), ...row });
      put(users, adaptUser(row));
    } else if (row.kind && row.author && row.createdAt) {
      rawPublications.set(row.id, row);
      put(reviews, adaptPublication(row));
    } else if (row.author && Array.isArray(row.animeIds) && row.ordered !== undefined) {
      rawLists.set(row.id, row);
      put(lists, {
        id: row.id,
        userId: row.userId,
        title: row.title,
        description: row.description,
        ordered: row.ordered,
        animeIds: row.animeIds,
        likes: row.likeCount,
      } as AnimeList);
    }
  }
  async function request(route: string, options: RequestOptions = {}): Promise<Wire> {
    const startedRevision = revision;
    const result = await api.request<Wire>(route, options);
    if (owner !== identity) throw new Error('La sesión cambió.');
    if ((!options.method || options.method === 'GET') && startedRevision !== revision)
      return result;
    ingest(result);
    if (route.includes('/activity')) activity.set(decodeURIComponent(route.split('/')[3]), result);
    if (route === '/explore') {
      genres.splice(
        0,
        genres.length,
        ...result.genres.map((g: Wire) => {
          genreIds.set(g.name, g.id);
          return g.name;
        }),
      );
      seasons.splice(
        0,
        seasons.length,
        ...result.seasons.map((s: Wire) => seasonLabel(s.season, s.year)),
      );
    }
    emit();
    return result;
  }
  const store = {
    activate() {
      if (owner !== identity) {
        owner = identity;
        resetEntities();
        genreIds.clear();
      }
    },
    api,
    ingest,
    rawUsers,
    rawPublications,
    rawLists,
    activity,
    get version() {
      return version;
    },
    get revision() {
      return revision;
    },
    pageRevision(route?: string) {
      return route === '/feed' || route === '/discover' ? feedRevision : revision;
    },
    get error() {
      return error;
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: () => version,
    report(reason: unknown) {
      error = reason instanceof Error ? reason.message : 'No se pudo completar la operación.';
      emit();
    },
    dismiss() {
      error = '';
      emit();
    },
    get(key: string) {
      return cache.get(key);
    },
    async load(route: string, query: RequestOptions['query'] = {}, force = false) {
      const key = JSON.stringify([route, query]);
      if (!force && cache.has(key)) return cache.get(key)!;
      const flightKey = revision + ':' + key;
      if (inflight.has(flightKey)) return inflight.get(flightKey)!;
      const started = revision;
      const task = request(route, { query })
        .then((result) => {
          if (started === revision) {
            cache.set(key, result);
            emit();
          }
          return result;
        })
        .finally(() => inflight.delete(flightKey));
      inflight.set(flightKey, task);
      return task;
    },
    async mutate(route: string, options: RequestOptions) {
      const signature = JSON.stringify([route, options.method, options.body]);
      if (options.method === 'POST') {
        if (!operations.has(signature))
          operations.set(
            signature,
            `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`,
          );
        options = { ...options, operationId: operations.get(signature) };
      }
      const result = await request(route, options);
      operations.delete(signature);
      const likeOnly = /^\/publications\/[^/]+\/like$/.test(route);
      if (likeOnly) {
        const raw = rawPublications.get(String(result.publicationId));
        if (raw) ingest({ ...raw, likedByMe: result.likedByMe, likeCount: result.likeCount });
      }
      if (result.deletedPublicationId) {
        rawPublications.delete(result.deletedPublicationId);
        const index = reviews.findIndex((row) => row.id === result.deletedPublicationId);
        if (index >= 0) reviews.splice(index, 1);
      }
      cache.clear();
      revision++;
      if (!likeOnly) feedRevision++;
      emit();
      return result;
    },
    async action(route: string, options: RequestOptions) {
      if (pendingActions.has(route)) return undefined;
      pendingActions.add(route);
      try {
        return await store.mutate(route, options);
      } catch (e) {
        store.report(e);
        return undefined;
      } finally {
        pendingActions.delete(route);
      }
    },
  };
  return store;
}
export type RemoteStore = ReturnType<typeof createRemoteStore>;
export { ApiError };
