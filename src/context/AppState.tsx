import { Fragment, type ReactNode } from 'react';
import { useSession } from './SessionContext';
import { useRemote } from './RemoteContext';
import { usePublications } from './PublicationsContext';
import { users } from '../data';
export type AnimeActivity = {
  watched: boolean;
  liked: boolean;
  watchlist: boolean;
  rating?: number;
  date?: string;
  reviewTitle?: string;
  reviewText?: string;
  spoiler: boolean;
  listIds: string[];
};
export function AppStateProvider({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
export function useActivities() {
  const store = useRemote();
  const getCollection = (id: string) => {
    const collect = (collection: string) =>
      (store.get(JSON.stringify([`/users/${id}/library`, { collection }]))?.items ?? []).map(
        (item: any) => item.anime.id,
      ) as string[];
    return {
      watchedIds: collect('watched'),
      watchlistIds: collect('watchlist'),
      likedIds: users.find((user) => user.id === id)?.favorites ?? [],
    };
  };
  async function setFavorites(_userId: string, animeIds: string[]) {
    await store.mutate('/me/favorites', { method: 'PUT', body: { animeIds } });
  }
  async function updateCollection(
    userId: string,
    animeId: string,
    changes: Partial<AnimeActivity>,
  ) {
    try {
      if (changes.liked !== undefined) {
        const ids = getCollection(userId).likedIds;
        await setFavorites(
          userId,
          changes.liked ? [...new Set([...ids, animeId])] : ids.filter((id) => id !== animeId),
        );
      }
      if (changes.watched !== undefined || changes.watchlist !== undefined)
        await store.mutate(`/me/library/${encodeURIComponent(animeId)}`, {
          method: 'PATCH',
          body: {
            ...(changes.watched !== undefined ? { watched: changes.watched } : {}),
            ...(changes.watchlist !== undefined ? { watchlist: changes.watchlist } : {}),
          },
        });
    } catch (e) {
      store.report(e);
    }
  }
  return { getCollection, setFavorites, updateCollection };
}
export function useAppState() {
  const { user } = useSession();
  const store = useRemote();
  const { saveReview } = usePublications();
  const { getCollection, updateCollection } = useActivities();
  const userId = user?.id ?? '';
  const collection = getCollection(userId);
  function getActivity(id: string): AnimeActivity {
    const data = store.activity.get(id);
    const current = data?.currentRating;
    return {
      watched: data?.watched ?? collection.watchedIds.includes(id),
      liked: data?.favoritePosition != null || collection.likedIds.includes(id),
      watchlist: data?.watchlist ?? collection.watchlistIds.includes(id),
      rating: current?.rating,
      date: current?.watchedOn?.split('-').reverse().join('/'),
      spoiler: false,
      listIds: data?.listIds ?? [],
    };
  }
  return {
    ...collection,
    watchedCount: users.find((row) => row.id === userId)?.watched ?? 0,
    getActivity,
    saveActivity: async (
      animeId: string,
      draft: AnimeActivity & { logged: boolean; reviewId?: string; countryCode?: string | null },
    ) => {
      await saveReview(
        userId,
        {
          animeId,
          rating: draft.rating,
          title: draft.reviewTitle,
          text: draft.reviewText ?? '',
          spoiler: draft.spoiler,
          date: draft.date,
          countryCode: draft.countryCode,
        },
        draft.reviewId,
      );
    },
    updateActivity: (id: string, changes: Partial<AnimeActivity>) =>
      updateCollection(userId, id, changes),
    followingIds: users.filter((row) => row.isFollowing).map((row) => row.id),
    friendIds: users.filter((row) => row.isFriend).map((row) => row.id),
    toggleFollowing: async (id: string) => {
      try {
        const raw = (await store.load(`/users/${id}`, {}, true)).user;
        await store.action(`/me/following/${id}`, { method: raw?.isFollowing ? 'DELETE' : 'PUT' });
      } catch (e) {
        store.report(e);
      }
    },
  };
}
