// Datos comunes a los dos tipos de publicación. No son clases ni otro contexto.
// TODO BACKEND [PUBLICACION-CONTRATO]: acordar estos campos con la API; adaptar respuestas en PublicationsContext sin atar la UI al esquema de la base.
export type PublicationBase = {
  id: string;
  userId: string;
  text: string;
  title?: string;
  time: string;
  createdAt: string;
  tags: string[];
  spoiler: boolean;
  likes: number;
  comments: number;
};

export type Review = PublicationBase & {
  kind: 'review';
  animeId: string;
  // Los logs y reviews anteriores pueden no tener puntuación.
  rating?: number;
  date?: string;
};

export type Post = PublicationBase & {
  kind: 'post';
  animeIds: string[];
  // Impide agregar puntuación o un único anime como si fuera una review.
  animeId?: never;
  rating?: never;
};

export type Publication = Review | Post;
export type PublicationEntry =
  | Omit<Review, 'likes' | 'comments'>
  | Omit<Post, 'likes' | 'comments'>;

export const normalizeTag = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '');

export function extractTags(text: string) {
  return [...new Set((text.match(/#[\p{L}\p{N}_-]+/gu) ?? []).map(normalizeTag))].filter(Boolean);
}

export const publicationAnimeIds = (entry: PublicationEntry) =>
  entry.kind === 'review' ? [entry.animeId] : entry.animeIds;
