import { createContext, useContext, useState, type ReactNode } from 'react';
import { librariesByUser, users } from '../mock';
import { useSession } from './SessionContext';
import { useReviews, type ReviewEntry } from './ReviewsContext';
import { useLists } from './ListsContext';
import { useSocial } from './SocialContext';

// Solo colecciones de anime. Textos/puntuaciones y listas pertenecen a sus contextos.
type Collection = { watchedIds: string[]; likedIds: string[]; watchlistIds: string[] };
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
const empty: Collection = { watchedIds: [], likedIds: [], watchlistIds: [] };
const createCollections = (entries: ReviewEntry[]) =>
  Object.fromEntries(
    users.map((user) => [
      user.id,
      {
        watchedIds: [
          ...new Set([
            ...(librariesByUser[user.id]?.Vistos ?? []),
            ...entries.filter((r) => r.userId === user.id && r.animeId).map((r) => r.animeId!),
          ]),
        ],
        likedIds: [...user.favorites],
        watchlistIds: [...(librariesByUser[user.id]?.Watchlist ?? [])],
      },
    ]),
  );
function useActivityState() {
  const [claimedByUser, setClaimed] = useState<Record<string, string[]>>({});
  function claimReward(userId: string, missionId: string) {
    setClaimed((previous) => ({
      ...previous,
      [userId]: [...new Set([...(previous[userId] ?? []), missionId])],
    }));
  }
  const { entries } = useReviews();
  const [collections, setCollections] = useState<Record<string, Collection>>(() =>
    createCollections(entries),
  );
  const getCollection = (id: string) => collections[id] ?? empty;
  function updateCollection(
    userId: string,
    animeId: string,
    changes: Partial<Pick<AnimeActivity, 'watched' | 'liked' | 'watchlist'>>,
  ) {
    setCollections((previous) => {
      const next = { ...(previous[userId] ?? empty) };
      for (const [flag, key] of [
        ['watched', 'watchedIds'],
        ['liked', 'likedIds'],
        ['watchlist', 'watchlistIds'],
      ] as const) {
        if (changes[flag] !== undefined)
          next[key] = changes[flag]
            ? [...new Set([...next[key], animeId])]
            : next[key].filter((id) => id !== animeId);
      }
      return { ...previous, [userId]: next };
    });
  }
  function setFavorites(userId: string, ids: string[]) {
    setCollections((previous) => ({
      ...previous,
      [userId]: { ...(previous[userId] ?? empty), likedIds: [...new Set(ids)] },
    }));
  }
  return { getCollection, updateCollection, setFavorites, claimedByUser, claimReward };
}
const ActivityContext = createContext<ReturnType<typeof useActivityState> | null>(null);
export function AppStateProvider({ children }: { children: ReactNode }) {
  return <ActivityContext.Provider value={useActivityState()}>{children}</ActivityContext.Provider>;
}
export function useActivities() {
  const value = useContext(ActivityContext);
  if (!value) throw new Error('Falta AppStateProvider');
  return value;
}
// Compatibilidad para las pantallas de actividad: combina datos sin duplicar su almacenamiento.
export function useAppState() {
  const { user } = useSession();
  const userId = user?.id ?? '';
  const { getCollection, updateCollection } = useActivities();
  const { entries, saveReview } = useReviews();
  const { lists } = useLists();
  const social = useSocial();
  const collection = getCollection(userId);
  function getActivity(animeId: string): AnimeActivity {
    const entry = entries.find((r) => r.userId === userId && r.animeId === animeId);
    return {
      watched: collection.watchedIds.includes(animeId),
      liked: collection.likedIds.includes(animeId),
      watchlist: collection.watchlistIds.includes(animeId),
      rating: entry?.rating,
      date: entry?.date,
      reviewTitle: entry?.title,
      reviewText: entry?.text,
      spoiler: entry?.spoiler ?? false,
      listIds: lists
        .filter((l) => l.userId === userId && l.animeIds.includes(animeId))
        .map((l) => l.id),
    };
  }
  async function saveActivity(animeId: string, draft: AnimeActivity & { logged: boolean }) {
    await saveReview(userId, {
      animeId,
      rating: draft.rating,
      date: draft.date,
      title: draft.reviewTitle,
      text: draft.reviewText ?? '',
      spoiler: draft.spoiler,
    });
    updateCollection(userId, animeId, {
      watched: draft.watched || draft.rating !== undefined || draft.logged,
      liked: draft.liked,
      watchlist: draft.watchlist,
    });
  }
  return {
    ...collection,
    watchedCount: collection.watchedIds.length,
    getActivity,
    saveActivity,
    updateActivity: (id: string, changes: Partial<AnimeActivity>) =>
      updateCollection(userId, id, changes),
    followingIds: social.getFollowingIds(userId),
    friendIds: social.getFriendIds(userId),
    toggleFollowing: (id: string) => social.toggleFollowing(userId, id),
  };
}
