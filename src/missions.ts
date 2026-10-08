import { anime, type Review } from './mock';

// Los objetivos son reglas de la demo; el progreso nunca se guarda como número fijo.
export const missionDefinitions = [
  {
    id: 'romance',
    title: 'Amante del Romance',
    description: 'Mirá 2 animes del género Romance.',
    metric: 'genre',
    genre: 'Romance',
    total: 2,
    reward: 'Corazón de anime',
    icon: 'heart-outline',
  },
  {
    id: 'shonen',
    title: 'La vida es un shonen',
    description: 'Mirá 3 animes del género Acción.',
    metric: 'genre',
    genre: 'Acción',
    total: 3,
    reward: 'Espíritu shonen',
    icon: 'flash-outline',
  },
  {
    id: 'generos',
    title: 'Explorador de géneros',
    description: 'Mirá 4 géneros diferentes.',
    metric: 'genres',
    total: 4,
    reward: 'Explorador',
    icon: 'compass-outline',
  },
  {
    id: 'reviews',
    title: 'Una nueva voz',
    description: 'Escribí 3 reviews.',
    metric: 'reviews',
    total: 3,
    reward: 'Voz de la comunidad',
    icon: 'chatbox-outline',
  },
  {
    id: 'primera',
    title: 'Primera historia',
    description: 'Marcá tu primer anime como visto.',
    metric: 'watched',
    total: 1,
    reward: 'Primer capítulo',
    icon: 'ribbon-outline',
  },
] as const;

export function calculateMissions(watchedIds: string[], reviews: Review[]) {
  const watched = anime.filter((item) => watchedIds.includes(item.id));
  return missionDefinitions.map((mission) => {
    const progress =
      mission.metric === 'genre'
        ? watched.filter((item) => item.genres.includes(mission.genre)).length
        : mission.metric === 'genres'
          ? new Set(watched.flatMap((item) => item.genres)).size
          : mission.metric === 'reviews'
            ? reviews.filter((review) => review.animeId && review.text.trim()).length
            : watched.length;
    const value = Math.min(progress, mission.total);
    const state = value >= mission.total ? 'Completada' : value > 0 ? 'En curso' : 'Pendiente';
    return { ...mission, value, state };
  });
}
