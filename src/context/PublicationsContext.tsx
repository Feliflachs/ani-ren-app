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
import { reviews as initialReviews, likedReviewsByUser, users, anime } from '../mock';
import { extractTags, normalizeTag, type Review, type PublicationEntry } from '../publications';

export type PostDraft = { text: string; spoiler: boolean; animeIds: string[] };
export type ReviewDraft = Pick<
  Review,
  'animeId' | 'rating' | 'title' | 'text' | 'spoiler' | 'date'
>;
export type Comment = { id: string; userId: string; text: string; time: string };
const REVIEWS_KEY = 'ani-ren:reviews:v1';

// Validar lo leído antes de reemplazar los ejemplos: no confiar en JSON arbitrario.
// Lee también las reviews guardadas antes de agregar tipos, etiquetas y fechas.
function readEntry(value: unknown): PublicationEntry {
  // TODO BACKEND [PUBLICACION-ADAPTAR]: adaptar la respuesta de la API; no validar autores/animes contra el mock completo.
  if (!value || typeof value !== 'object') throw new Error('Publicacion invalida');
  const entry = value as Record<string, unknown>;
  if (
    typeof entry.id !== 'string' ||
    !users.some((user) => user.id === entry.userId) ||
    typeof entry.text !== 'string' ||
    typeof entry.time !== 'string' ||
    typeof entry.spoiler !== 'boolean' ||
    (entry.title !== undefined && typeof entry.title !== 'string')
  )
    throw new Error('Datos invalidos');
  const kind = entry.kind ?? (entry.animeId ? 'review' : 'post');
  const seed = initialReviews.find((item) => item.id === entry.id);
  const createdAt = entry.createdAt ?? seed?.createdAt ?? '1970-01-01T00:00:00.000Z';
  const tags = entry.tags ?? extractTags(entry.text);
  if (
    typeof createdAt !== 'string' ||
    !Number.isFinite(Date.parse(createdAt)) ||
    !Array.isArray(tags) ||
    !tags.every((tag) => typeof tag === 'string')
  )
    throw new Error('Datos invalidos');
  const common = {
    id: entry.id,
    userId: entry.userId as string,
    text: entry.text,
    time: entry.time,
    title: entry.title as string | undefined,
    spoiler: entry.spoiler,
    createdAt,
    tags: [...new Set(tags.map(normalizeTag))].filter(Boolean),
  };
  if (kind === 'review') {
    if (
      !anime.some((item) => item.id === entry.animeId) ||
      (entry.date !== undefined && typeof entry.date !== 'string') ||
      (entry.rating !== undefined &&
        (typeof entry.rating !== 'number' ||
          entry.rating < 0.5 ||
          entry.rating > 5 ||
          !Number.isInteger(entry.rating * 2)))
    )
      throw new Error('Review invalida');
    return {
      ...common,
      kind,
      animeId: entry.animeId as string,
      rating: entry.rating as number | undefined,
      date: entry.date as string | undefined,
    };
  }
  const animeIds = entry.animeIds ?? [];
  if (
    kind !== 'post' ||
    entry.rating !== undefined ||
    entry.animeId !== undefined ||
    !Array.isArray(animeIds) ||
    !animeIds.every((id) => anime.some((item) => item.id === id))
  )
    throw new Error('Post invalido');
  return { ...common, kind, animeIds: [...new Set(animeIds)] };
}
// Los ejemplos no incluyen conversaciones completas: arrancan vacías y sus contadores coinciden.
function usePublicationsState() {
  const [entries, setEntries] = useState<PublicationEntry[]>(initialReviews);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const writing = useRef(false);
  // TODO BACKEND [PUBLICACIONES-CARGAR]: reemplazar ejemplos/lectura local por consultas paginadas y detalle por ID; definir la caché local.
  const loadPublications = useCallback(
    () =>
      AsyncStorage.getItem(REVIEWS_KEY)
        .then((json) => {
          if (json !== null) {
            const saved: unknown = JSON.parse(json);
            if (!Array.isArray(saved)) throw new Error('Datos inválidos');
            const restored = saved.map(readEntry);
            if (new Set(restored.map((entry) => entry.id)).size !== restored.length)
              throw new Error('IDs repetidos');
            setEntries(restored);
          }
          setLoadError('');
        })
        .catch(() => {
          setLoadError('No pudimos leer tus publicaciones guardadas. Reintentá para continuar.');
        })
        .finally(() => {
          setReady(true);
        }),
    [],
  );
  useEffect(() => {
    void loadPublications();
  }, [loadPublications]);
  const [likes, setLikes] = useState(likedReviewsByUser);
  const [commentsByReview, setComments] = useState<Record<string, Comment[]>>({});
  async function saveReview(userId: string, draft: ReviewDraft, id?: string) {
    // TODO BACKEND [REVIEW-GUARDAR]: crear/editar en servidor y aplicar su respuesta (ID, autor y fechas); mantener compatibilidad con logs.
    if (!ready || loadError || writing.current) throw new Error('No se puede guardar todavía');
    writing.current = true;
    try {
      const previous = entries;
      const existing = id
        ? previous.find((entry) => entry.id === id)
        : previous.find(
            (entry) =>
              entry.kind === 'review' && entry.userId === userId && entry.animeId === draft.animeId,
          );
      if (id && !existing) throw new Error('Review no encontrada');
      if (existing && (existing.userId !== userId || existing.kind !== 'review'))
        throw new Error('Esta review pertenece a otra persona');
      const next: PublicationEntry = {
        ...draft,
        kind: 'review',
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        tags: extractTags(draft.text),
        id: existing?.id ?? `review-${userId}-${draft.animeId}`,
        userId,
        time: existing?.time ?? 'Ahora',
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
  async function savePost(userId: string, draft: PostDraft, id?: string) {
    // TODO BACKEND [POSTEO-GUARDAR]: crear/editar texto, spoilers, tags y animeIds; confirmar antes de actualizar el estado.
    if (!ready || loadError || writing.current) throw new Error('No se puede guardar todavia');
    if (draft.text.trim().length < 3 || draft.text.trim().length > 2000)
      throw new Error('Revisa el texto');
    const existing = id ? entries.find((entry) => entry.id === id) : undefined;
    if (id && (!existing || existing.userId !== userId || existing.kind !== 'post'))
      throw new Error('No podes editar este post');
    const tags = extractTags(draft.text);
    const referenced = anime
      .filter(
        (item) => tags.includes(normalizeTag(item.id)) || tags.includes(normalizeTag(item.title)),
      )
      .map((item) => item.id);
    const next = readEntry({
      kind: 'post',
      id:
        existing?.id ??
        'post-' + userId + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      userId,
      text: draft.text.trim(),
      spoiler: draft.spoiler,
      tags,
      animeIds: [...new Set([...draft.animeIds, ...referenced])],
      time: existing?.time ?? 'Ahora',
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
    writing.current = true;
    try {
      const updated = existing
        ? entries.map((entry) => (entry.id === id ? next : entry))
        : [next, ...entries];
      await AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(updated));
      setEntries(updated);
      return next.id;
    } finally {
      writing.current = false;
    }
  }
  function toggleLike(userId: string, id: string) {
    // TODO BACKEND [PUBLICACION-LIKE]: enviar el estado deseado y recibir like propio/total; validar la cuenta en servidor.
    setLikes((previous) => {
      const ids = previous[userId] ?? [];
      return {
        ...previous,
        [userId]: ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id],
      };
    });
  }
  function addComment(userId: string, reviewId: string, text: string) {
    // TODO BACKEND [PUBLICACION-COMENTARIOS]: consultar comentarios paginados y crear con ID/fecha del servidor.
    if (!text.trim()) return;
    setComments((previous) => ({
      ...previous,
      [reviewId]: [
        ...(previous[reviewId] ?? []),
        { id: `comment-${Date.now()}-${Math.random()}`, userId, text: text.trim(), time: 'Ahora' },
      ],
    }));
  }
  const publications = useMemo(
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
    loadPublications,
    entries,
    publications,
    reviews: publications.filter((entry): entry is Review => entry.kind === 'review'),
    saveReview,
    savePost,
    toggleLike,
    addComment,
    getLikedIds: (id: string) => likes[id] ?? [],
    getComments: (id: string) => commentsByReview[id] ?? [],
  };
}
const PublicationsContext = createContext<ReturnType<typeof usePublicationsState> | null>(null);
export function PublicationsProvider({ children }: { children: ReactNode }) {
  const value = usePublicationsState();
  return (
    <PublicationsContext.Provider value={value}>
      {value.ready && <Fragment key={value.loadError || 'loaded'}>{children}</Fragment>}
    </PublicationsContext.Provider>
  );
}
export function usePublications() {
  const value = useContext(PublicationsContext);
  if (!value) throw new Error('Falta PublicationsProvider');
  return value;
}
