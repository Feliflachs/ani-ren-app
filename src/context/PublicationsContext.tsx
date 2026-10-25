import { Fragment, type ReactNode } from 'react';
import { useRemote } from './RemoteContext';
import { reviews } from '../data';
import type { Review } from '../publications';
export type PostDraft = { text: string; spoiler: boolean; animeIds: string[] };
export type ReviewDraft = Pick<
  Review,
  'animeId' | 'rating' | 'title' | 'text' | 'spoiler' | 'date'
> & { countryCode?: string | null };
export type Comment = { id: string; userId: string; text: string; time: string };
export function PublicationsProvider({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
export function usePublications() {
  const store = useRemote();
  async function saveReview(_userId: string, draft: ReviewDraft, id?: string) {
    const { animeId, rating, title, text, spoiler, date, countryCode } = draft;
    if (rating === undefined) throw new Error('Elegí una puntuación.');
    const body = {
      rating,
      watchedOn: date ? date.split('/').reverse().join('-') : null,
      ...(text.trim() ? { title: title ?? null, text, spoiler } : {}),
    };
    await store.mutate(id ? `/reviews/${id}` : text.trim() ? '/reviews' : '/ratings', {
      method: id ? 'PATCH' : 'POST',
      body: id ? body : { ...body, animeId, countryCode },
    });
  }
  async function savePost(_userId: string, draft: PostDraft, id?: string) {
    const result = await store.mutate(id ? `/posts/${id}` : '/posts', {
      method: id ? 'PATCH' : 'POST',
      body: draft,
    });
    return result.publication.id as string;
  }
  return {
    ready: true,
    loadError: '',
    loadPublications: async () => {},
    entries: reviews,
    publications: reviews,
    reviews: reviews.filter((item): item is Review => item.kind === 'review'),
    saveReview,
    savePost,
    toggleLike: (_userId: string, id: string) =>
      store
        .action(`/publications/${id}/like`, {
          method: store.rawPublications.get(id)?.likedByMe ? 'DELETE' : 'PUT',
        })
        .then((result) => {
          if (result) {
            const raw = store.rawPublications.get(id);
            if (raw)
              store.ingest({ ...raw, likedByMe: result.likedByMe, likeCount: result.likeCount });
          }
        }),
    addComment: async (_userId: string, id: string, text: string) => {
      await store.mutate(`/publications/${id}/comments`, { method: 'POST', body: { text } });
    },
    getLikedIds: (_id: string) =>
      [...store.rawPublications.values()]
        .filter((item) => item.likedByMe)
        .map((item) => item.id as string),
    getComments: (id: string): Comment[] => {
      const data = store.get(JSON.stringify([`/publications/${id}/comments`, {}]));
      return (data?.items ?? []).map((item: any) => ({
        id: item.id,
        userId: item.userId,
        text: item.text,
        time: new Date(item.createdAt).toLocaleDateString('es-AR'),
      }));
    },
  };
}
