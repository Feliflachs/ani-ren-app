import {
  Fragment,
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { reviews as initialReviews, likedReviewsByUser, users, anime, type Review } from '../mock';

export type ReviewEntry = Omit<Review, 'likes' | 'comments'> & { date?: string };
export type ReviewDraft = Pick<
  ReviewEntry,
  'animeId' | 'rating' | 'title' | 'text' | 'spoiler' | 'date'
>;
export type Comment = { id: string; userId: string; text: string; time: string };
const REVIEWS_KEY = 'ani-ren:reviews:v1';

// Validar lo leído antes de reemplazar los ejemplos: no confiar en JSON arbitrario.
function isReviewEntry(value: unknown): value is ReviewEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === 'string' &&
    users.some((user) => user.id === entry.userId) &&
    (entry.animeId === undefined || anime.some((item) => item.id === entry.animeId)) &&
    typeof entry.text === 'string' &&
    typeof entry.time === 'string' &&
    typeof entry.spoiler === 'boolean' &&
    (entry.title === undefined || typeof entry.title === 'string') &&
    (entry.date === undefined || typeof entry.date === 'string') &&
    (entry.rating === undefined ||
      (typeof entry.rating === 'number' &&
        entry.rating >= 0.5 &&
        entry.rating <= 5 &&
        Number.isInteger(entry.rating * 2)))
  );
}
// Los ejemplos no incluyen conversaciones completas: arrancan vacías y sus contadores coinciden.
function useReviewsState() {
  const [entries, setEntries] = useState<ReviewEntry[]>(initialReviews);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const writing = useRef(false);
  const loadReviews = useCallback(
    () =>
      AsyncStorage.getItem(REVIEWS_KEY)
        .then((json) => {
          if (json !== null) {
            const saved: unknown = JSON.parse(json);
            if (
              !Array.isArray(saved) ||
              !saved.every(isReviewEntry) ||
              new Set(saved.map((entry) => entry.id)).size !== saved.length
            )
              throw new Error('Datos inválidos');
            setEntries(saved);
          }
          setLoadError('');
        })
        .catch(() => {
          setLoadError('No pudimos leer tus reviews guardadas. Reintentá para continuar.');
        })
        .finally(() => {
          setReady(true);
        }),
    [],
  );
  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);
  const [likes, setLikes] = useState(likedReviewsByUser);
  const [commentsByReview, setComments] = useState<Record<string, Comment[]>>({});
  const [savedByUser, setSaved] = useState<Record<string, string[]>>({});
  async function saveReview(userId: string, draft: ReviewDraft, id?: string) {
    if (!ready || loadError || writing.current) throw new Error('No se puede guardar todavía');
    writing.current = true;
    try {
      const previous = entries;
      const existing = id
        ? previous.find((entry) => entry.id === id)
        : previous.find((entry) => entry.userId === userId && entry.animeId === draft.animeId);
      if (existing && existing.userId !== userId)
        throw new Error('Esta review pertenece a otra persona');
      const next: ReviewEntry = {
        ...draft,
        id: existing?.id ?? `review-${userId}-${draft.animeId}`,
        userId,
        time: 'Ahora',
      };
      const updated = existing
        ? previous.map((entry) => (entry.id === existing.id ? next : entry))
        : [next, ...previous];
      // Confirmar solo después de guardar. Un fallo conserva el borrador y los datos anteriores.
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      setEntries(updated);
    } finally {
      writing.current = false;
    }
  }
  function toggleLike(userId: string, id: string) {
    setLikes((previous) => {
      const ids = previous[userId] ?? [];
      return {
        ...previous,
        [userId]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
      };
    });
  }
  function toggleSaved(userId: string, id: string) {
    setSaved((previous) => {
      const ids = previous[userId] ?? [];
      return {
        ...previous,
        [userId]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
      };
    });
  }
  function addComment(userId: string, reviewId: string, text: string) {
    if (!text.trim()) return;
    setComments((previous) => ({
      ...previous,
      [reviewId]: [
        ...(previous[reviewId] ?? []),
        { id: `comment-${Date.now()}-${Math.random()}`, userId, text: text.trim(), time: 'Ahora' },
      ],
    }));
  }
  const reviews = useMemo(
    () =>
      entries
        .filter((entry) => entry.text.trim())
        .map((entry) => {
          const count = Object.values(likes).filter((ids) => ids.includes(entry.id)).length;
          return { ...entry, likes: count, comments: (commentsByReview[entry.id] ?? []).length };
        }),
    [entries, likes, commentsByReview],
  );
  return {
    ready,
    loadError,
    loadReviews,
    entries,
    reviews,
    saveReview,
    toggleLike,
    toggleSaved,
    addComment,
    getLikedIds: (id: string) => likes[id] ?? [],
    getSavedIds: (id: string) => savedByUser[id] ?? [],
    getComments: (id: string) => commentsByReview[id] ?? [],
  };
}
const ReviewsContext = createContext<ReturnType<typeof useReviewsState> | null>(null);
export function ReviewsProvider({ children }: { children: ReactNode }) {
  const value = useReviewsState();
  return (
    <ReviewsContext.Provider value={value}>
      {value.ready && <Fragment key={value.loadError || 'loaded'}>{children}</Fragment>}
    </ReviewsContext.Provider>
  );
}
export function useReviews() {
  const value = useContext(ReviewsContext);
  if (!value) throw new Error('Falta ReviewsProvider');
  return value;
}
