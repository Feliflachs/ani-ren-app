import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { anime, currentLibrary, currentUser, lists, reviews } from './mock';

export type AnimeActivity = {
  watched: boolean;
  liked: boolean;
  watchlist: boolean;
  rating?: number;
  date?: string;
  reviewText?: string;
  spoiler: boolean;
  listIds: string[];
};

type ActivityDraft = AnimeActivity & { logged: boolean };

type AppStateValue = {
  activities: Record<string, AnimeActivity>;
  watchedIds: string[];
  likedIds: string[];
  watchlistIds: string[];
  watchedCount: number;
  getActivity: (animeId: string) => AnimeActivity;
  saveActivity: (animeId: string, draft: ActivityDraft) => void;
  updateActivity: (animeId: string, changes: Partial<AnimeActivity>) => void;
};

const emptyActivity: AnimeActivity = {
  watched: false,
  liked: false,
  watchlist: false,
  spoiler: false,
  listIds: [],
};

const initialActivities = anime.reduce<Record<string, AnimeActivity>>((result, item) => {
  const ownReview = reviews.find(
    (review) => review.animeId === item.id && review.userId === currentUser.id,
  );
  result[item.id] = {
    watched: currentLibrary.Vistos.includes(item.id) || ownReview !== undefined,
    liked: currentUser.favorites.includes(item.id),
    watchlist: currentLibrary.Watchlist.includes(item.id),
    rating: ownReview?.rating,
    reviewText: ownReview?.text,
    spoiler: ownReview?.spoiler ?? false,
    listIds: lists
      .filter((list) => list.userId === currentUser.id && list.animeIds.includes(item.id))
      .map((list) => list.id),
  };
  return result;
}, {});

const initiallyWatched = new Set(currentLibrary.Vistos);
const AppStateContext = createContext<AppStateValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState(initialActivities);

  const updateActivity = useCallback((animeId: string, changes: Partial<AnimeActivity>) => {
    setActivities((current) => ({
      ...current,
      [animeId]: { ...(current[animeId] ?? emptyActivity), ...changes },
    }));
  }, []);

  const saveActivity = useCallback(
    (animeId: string, draft: ActivityDraft) => {
      const watched = draft.watched || draft.rating !== undefined || draft.logged;
      updateActivity(animeId, { ...draft, watched });
    },
    [updateActivity],
  );

  const value = useMemo(() => {
    const entries = Object.entries(activities);
    const watchedIds = entries.filter(([, value]) => value.watched).map(([id]) => id);
    const likedIds = entries.filter(([, value]) => value.liked).map(([id]) => id);
    const watchlistIds = entries.filter(([, value]) => value.watchlist).map(([id]) => id);
    const newlyWatched = watchedIds.filter((id) => !initiallyWatched.has(id)).length;
    const removedWatched = [...initiallyWatched].filter((id) => !watchedIds.includes(id)).length;

    return {
      activities,
      watchedIds,
      likedIds,
      watchlistIds,
      watchedCount: currentUser.watched + newlyWatched - removedWatched,
      getActivity: (animeId: string) => activities[animeId] ?? emptyActivity,
      saveActivity,
      updateActivity,
    };
  }, [activities, saveActivity, updateActivity]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState debe usarse dentro de AppStateProvider');
  return value;
}
