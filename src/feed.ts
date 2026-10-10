import { anime } from './mock';
import { normalizeTag, publicationAnimeIds, type Publication } from './publications';

// Reglas locales de la demo. Más adelante este criterio puede resolverse en la API.
// TODO BACKEND [FEED-SELECCION]: consultar Para ti/Siguiendo/Tendencia con paginación; no ordenar solo una página como si fuera todo el feed.
export function selectFeed(
  publications: Publication[],
  filter: string,
  userId: string,
  followingIds: string[],
  favoriteIds: string[],
  watchlistIds: string[],
  likedPublicationIds: string[],
) {
  const newest = (a: Publication, b: Publication) =>
    Date.parse(b.createdAt) - Date.parse(a.createdAt);
  if (filter === 'Siguiendo')
    return publications.filter((p) => followingIds.includes(p.userId)).sort(newest);
  if (filter === 'Tendencia')
    return [...publications].sort(
      (a, b) => b.likes + b.comments - a.likes - a.comments || newest(a, b),
    );

  const interests = new Set(
    anime
      .filter((item) => [...favoriteIds, ...watchlistIds].includes(item.id))
      .flatMap((item) => item.genres.map(normalizeTag)),
  );
  const likedTags = new Set(
    publications.filter((p) => likedPublicationIds.includes(p.id)).flatMap((p) => p.tags),
  );
  const score = (p: Publication) => {
    const ids = publicationAnimeIds(p);
    const genres = new Set(
      anime
        .filter((item) => ids.includes(item.id))
        .flatMap((item) => item.genres.map(normalizeTag)),
    );
    return (
      (ids.some((id) => watchlistIds.includes(id)) ? 3 : 0) +
      [...genres].filter((genre) => interests.has(genre)).length +
      p.tags.filter((tag) => interests.has(tag) || likedTags.has(tag)).length
    );
  };
  const ranked = publications
    .filter((p) => p.userId !== userId && !followingIds.includes(p.userId))
    .map((publication) => ({ publication, score: score(publication) }))
    .sort((a, b) => b.score - a.score || newest(a.publication, b.publication));
  // Sin señales coincidentes ofrecemos descubrimiento por fecha, siempre de otras cuentas.
  // Alternamos autores cuando es posible, sin ocultar el resto de sus publicaciones.
  const result: Publication[] = [];
  while (ranked.length) {
    const otherAuthor = ranked.findIndex(
      (item) => item.publication.userId !== result[result.length - 1]?.userId,
    );
    result.push(ranked.splice(otherAuthor < 0 ? 0 : otherAuthor, 1)[0].publication);
  }
  return result;
}
