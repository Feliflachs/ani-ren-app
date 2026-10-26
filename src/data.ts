import type { ImageSourcePropType } from 'react-native';
export type { Review } from './publications';

// Datos compartidos porque los mismos animes, autores y listas aparecen en varias pantallas.
export type Anime = {
  id: string;
  title: string;
  japanese: string;
  image: ImageSourcePropType;
  rating: number;
  year: number;
  episodes: number;
  duration: number;
  genres: string[];
  season: string;
  studio: string;
  synopsis: string;
  synopsisEs?: string | null;
  watched: number;
  popularity: number;
};
export type User = {
  id: string;
  name: string;
  handle: string;
  image: ImageSourcePropType;
  bio: string;
  watched: number;
  reviews: number;
  watchlist: number;
  followers: number;
  following: number;
  favorites: string[];
  auraPoints?: number;
  rank?: string;
  rankProgress?: {
    points: number;
    progress: number;
    nextThreshold: number | null;
    nextRank: string | null;
  };
  isFollowing?: boolean;
  isFriend?: boolean;
};
export type AnimeList = {
  id: string;
  userId: string;
  title: string;
  description: string;
  animeIds: string[];
  ordered: boolean;
  likes: number;
};
export type Country = {
  id: string;
  name: string;
  flag: string;
  reviews: number;
  watched: number;
  top: string[];
  x: number;
  y: number;
  value?: number;
  intensity?: number;
  popularity?: number;
};

export const anime: Anime[] = [];
export const users: User[] = [];
export const lists: AnimeList[] = [];
export const reviews: import('./publications').Publication[] = [];
export const genres: string[] = [];
export const seasons: string[] = [];
export const countries: Country[] = [];
export const ranks = ['Novato', 'Aprendiz', 'Experto', 'Maestro', 'Leyenda'];
export const findAnime = (id: string | undefined) => anime.find((item) => item.id === id);
export const findUser = (id: string | undefined) => users.find((item) => item.id === id);
export const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
export const mapMetrics = {
  reviews: 'Cantidad de reviews',
  vistos: 'Anime más visto',
  popularidad: 'Anime más popular',
  anime: 'Vistos de un anime',
};
export type MapMetric = keyof typeof mapMetrics;
export const getMapMetric = (value?: string, fallback: MapMetric = 'reviews'): MapMetric =>
  (Object.keys(mapMetrics) as MapMetric[]).find(
    (key) => key === value || mapMetrics[key] === value,
  ) ?? fallback;
export const getCountryMetric = (country: Country, metric: MapMetric, _animeId?: string) =>
  metric === 'reviews'
    ? country.reviews
    : metric === 'vistos'
      ? country.watched
      : metric === 'popularidad'
        ? (country.popularity ?? 0)
        : (country.value ?? 0);
export const getCountryTop = (country: Country, _metric: MapMetric) =>
  country.top.map(findAnime).filter((item): item is Anime => !!item);
// Compatibility presentation only; rank selection comes from the server, never watched counts.
export const getRankProgress = (_value: number) => ({
  rank: 'Novato',
  nextRank: undefined as string | undefined,
  total: 0,
});
export function resetEntities() {
  for (const array of [anime, users, lists, reviews, genres, seasons, countries]) array.splice(0);
}
