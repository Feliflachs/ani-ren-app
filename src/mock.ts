import type { ImageSourcePropType } from 'react-native';

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
};
export type Review = {
  id: string;
  userId: string;
  animeId?: string;
  rating?: number;
  text: string;
  time: string;
  likes: number;
  comments: number;
  spoiler: boolean;
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
};

// TODO BACKEND [CATALOGO]: consultar anime por id y reutilizar el formato que consume la interfaz.
// Portadas temporales guardadas en assets/ desde MyAnimeList; procedencia en assets/FUENTES.md.
export const anime: Anime[] = [
  {
    id: 'frieren',
    title: 'Frieren',
    japanese: '葬送のフリーレン',
    image: require('../assets/frieren.jpg'),
    rating: 4.8,
    year: 2023,
    episodes: 28,
    duration: 24,
    genres: ['Fantasía', 'Aventura', 'Drama'],
    season: 'Otoño 2026',
    studio: 'Madhouse',
    synopsis:
      'Después de derrotar al Rey Demonio, la elfa Frieren comienza un nuevo viaje. Mientras conoce a nuevos compañeros, aprende a comprender el tiempo, los recuerdos y los vínculos que dejó atrás.',
    watched: 98400,
    popularity: 98,
  },
  {
    id: 'solo-leveling',
    title: 'Solo Leveling',
    japanese: '俺だけレベルアップな件',
    image: require('../assets/solo-leveling.jpg'),
    rating: 4.7,
    year: 2024,
    episodes: 12,
    duration: 24,
    genres: ['Acción', 'Fantasía'],
    season: 'Invierno 2026',
    studio: 'A-1 Pictures',
    synopsis:
      'Sung Jinwoo, un cazador considerado el más débil, descubre un sistema que le permite aumentar su poder. Cada desafío abre la puerta a un mundo de sombras y secretos.',
    watched: 87200,
    popularity: 96,
  },
  {
    id: 'blue-lock',
    title: 'Blue Lock',
    japanese: 'ブルーロック',
    image: require('../assets/blue-lock.jpg'),
    rating: 4.6,
    year: 2022,
    episodes: 24,
    duration: 24,
    genres: ['Acción', 'Deportes'],
    season: 'Primavera 2026',
    studio: 'Eight Bit',
    synopsis:
      'Un programa reúne a los mejores delanteros jóvenes de Japón. Isagi debe descubrir su propio estilo y competir para convertirse en un atacante capaz de cambiar el fútbol.',
    watched: 64100,
    popularity: 92,
  },
  {
    id: 'vinland-saga',
    title: 'Vinland Saga',
    japanese: 'ヴィンランド・サガ',
    image: require('../assets/vinland-saga.jpg'),
    rating: 4.5,
    year: 2019,
    episodes: 24,
    duration: 24,
    genres: ['Acción', 'Aventura', 'Drama'],
    season: 'Verano 2026',
    studio: 'Wit Studio',
    synopsis:
      'Thorfinn crece entre guerras y venganza. Su camino entre vikingos lo lleva a preguntarse qué significa ser un verdadero guerrero y si existe una tierra donde vivir en paz.',
    watched: 58400,
    popularity: 86,
  },
  {
    id: 'mob-psycho',
    title: 'Mob Psycho 100',
    japanese: 'モブサイコ100',
    image: require('../assets/mob-psycho.jpg'),
    rating: 4.4,
    year: 2016,
    episodes: 12,
    duration: 24,
    genres: ['Comedia', 'Acción'],
    season: 'Verano 2026',
    studio: 'Bones',
    synopsis:
      'Mob es un estudiante con enormes poderes psíquicos. Entre exorcismos, amigos y emociones que no sabe expresar, intenta encontrar una vida normal y crecer a su manera.',
    watched: 47500,
    popularity: 84,
  },
  {
    id: 'haikyuu',
    title: 'Haikyuu!!',
    japanese: 'ハイキュー!!',
    image: require('../assets/haikyuu.jpg'),
    rating: 4.4,
    year: 2014,
    episodes: 25,
    duration: 24,
    genres: ['Deportes', 'Comedia'],
    season: 'Primavera 2026',
    studio: 'Production I.G',
    synopsis:
      'Hinata quiere llegar a lo más alto del vóley pese a su estatura. Al unirse a Karasuno, encuentra rivales, compañeros y una pasión que transforma cada partido.',
    watched: 72000,
    popularity: 89,
  },
  {
    id: 'demon-slayer',
    title: 'Demon Slayer',
    japanese: '鬼滅の刃',
    image: require('../assets/demon-slayer.jpg'),
    rating: 4.3,
    year: 2019,
    episodes: 26,
    duration: 24,
    genres: ['Acción', 'Fantasía'],
    season: 'Otoño 2026',
    studio: 'ufotable',
    synopsis:
      'Tanjiro emprende un viaje para salvar a su hermana Nezuko. Su determinación lo une a otros cazadores que luchan contra demonios mientras protegen a quienes aman.',
    watched: 112000,
    popularity: 99,
  },
  {
    id: 'spy-family',
    title: 'Spy × Family',
    japanese: 'SPY×FAMILY',
    image: require('../assets/spy-family.jpg'),
    rating: 4.3,
    year: 2022,
    episodes: 12,
    duration: 24,
    genres: ['Comedia', 'Romance'],
    season: 'Invierno 2026',
    studio: 'Wit Studio / CloverWorks',
    synopsis:
      'Un espía, una asesina y una niña telépata forman una familia llena de secretos. Entre misiones y pequeños momentos cotidianos, descubren que sus vínculos son muy reales.',
    watched: 81000,
    popularity: 91,
  },
];

// TODO BACKEND [USUARIOS]: recuperar perfiles, relaciones y estadísticas reales por id.
export const users: User[] = [
  {
    id: 'felipe',
    name: 'Felipe',
    handle: 'felipeanime',
    image: anime[1].image,
    bio: 'Anime, reviews y temporadas favoritas. Siempre buscando la próxima gran historia.',
    watched: 128,
    reviews: 27,
    watchlist: 42,
    followers: 184,
    following: 96,
    favorites: ['frieren', 'vinland-saga', 'blue-lock', 'mob-psycho'],
  },
  {
    id: 'sofi',
    name: 'Sofi_23',
    handle: 'sofi_23',
    image: anime[0].image,
    bio: 'Fantasía, romances y finales que me dejan pensando ✨',
    watched: 164,
    reviews: 45,
    watchlist: 31,
    followers: 256,
    following: 110,
    favorites: ['frieren', 'spy-family', 'haikyuu', 'mob-psycho'],
  },
  {
    id: 'nico',
    name: 'NicoChan',
    handle: 'nicochan',
    image: anime[2].image,
    bio: 'La segunda temporada siempre merece una oportunidad.',
    watched: 142,
    reviews: 36,
    watchlist: 25,
    followers: 192,
    following: 84,
    favorites: ['vinland-saga', 'blue-lock', 'solo-leveling', 'haikyuu'],
  },
  {
    id: 'luli',
    name: 'LuliOtaku',
    handle: 'luliotaku',
    image: anime[7].image,
    bio: 'Colecciono historias y personajes favoritos.',
    watched: 96,
    reviews: 22,
    watchlist: 48,
    followers: 145,
    following: 76,
    favorites: ['spy-family', 'frieren', 'mob-psycho', 'haikyuu'],
  },
  {
    id: 'shonen',
    name: 'ShonenKing',
    handle: 'shonenking',
    image: anime[6].image,
    bio: 'Un capítulo más. Siempre.',
    watched: 328,
    reviews: 81,
    watchlist: 63,
    followers: 720,
    following: 150,
    favorites: ['demon-slayer', 'solo-leveling', 'blue-lock', 'vinland-saga'],
  },
];
export const currentUser = users[0];

// TODO BACKEND [FEED]: cargar publicaciones, reviews, likes y comentarios según el filtro solicitado.
export const reviews: Review[] = [
  {
    id: 'review-sofi',
    userId: 'sofi',
    animeId: 'frieren',
    rating: 4.5,
    text: 'Acabo de terminar Frieren y no tengo palabras... Una obra maestra. La voy a extrañar mucho. 💜✨ La forma en que habla del tiempo y de las personas que nos acompañan me llegó muchísimo.',
    time: 'Hace 2 h',
    likes: 128,
    comments: 23,
    spoiler: false,
  },
  {
    id: 'review-nico',
    userId: 'nico',
    animeId: 'vinland-saga',
    rating: 4.5,
    text: 'La segunda temporada es cine. Una historia que se toma su tiempo y encuentra algo enorme en los momentos más pequeños.',
    time: 'Hace 4 h',
    likes: 96,
    comments: 15,
    spoiler: false,
  },
  {
    id: 'review-felipe',
    userId: 'felipe',
    animeId: 'frieren',
    rating: 5,
    text: 'Una obra maestra. La forma en que habla del paso del tiempo, de la amistad y de los recuerdos hace que cada capítulo valga la pena. Me quedo con su calma y con todo lo que transmite sin decirlo.',
    time: 'Hace 2 h',
    likes: 42,
    comments: 8,
    spoiler: false,
  },
  {
    id: 'post-luli',
    userId: 'luli',
    text: 'Recomienden animes de misterio o psicológicos 🙏 Quiero armar una lista para este fin de semana.',
    time: 'Hace 6 h',
    likes: 34,
    comments: 42,
    spoiler: false,
  },
  {
    id: 'review-shonen',
    userId: 'shonen',
    animeId: 'blue-lock',
    rating: 4.5,
    text: 'Blue Lock es otro nivel de hype. ¡Equipo Z para siempre! ⚽',
    time: 'Ayer',
    likes: 87,
    comments: 12,
    spoiler: true,
  },
];

// TODO BACKEND [LISTAS]: consultar colecciones por id y preservar el orden de animeIds.
export const lists: AnimeList[] = [
  {
    id: 'favoritos-felipe',
    userId: 'felipe',
    title: 'Historias que se quedan',
    description: 'Mi top de animes que volvería a ver una y mil veces.',
    animeIds: currentUser.favorites,
    ordered: true,
    likes: 38,
  },
  {
    id: 'finde-sofi',
    userId: 'sofi',
    title: 'Un finde de fantasía',
    description: 'Mundos donde perderse y personajes para recordar.',
    animeIds: ['frieren', 'solo-leveling', 'demon-slayer'],
    ordered: false,
    likes: 62,
  },
  {
    id: 'equipo-nico',
    userId: 'nico',
    title: 'Pasión por el equipo',
    description: 'Competir, crecer y darlo todo juntos.',
    animeIds: ['haikyuu', 'blue-lock', 'mob-psycho'],
    ordered: true,
    likes: 25,
  },
];

// TODO BACKEND [MAPA]: consultar métricas por país y anime; coordenadas solo para el dibujo de esta demo.
export const countries: Country[] = [
  {
    id: 'argentina',
    name: 'Argentina',
    flag: '🇦🇷',
    reviews: 12480,
    watched: 56400,
    top: ['frieren', 'blue-lock', 'haikyuu', 'solo-leveling', 'vinland-saga'],
    x: 32.2,
    y: 84.8,
  },
  {
    id: 'japon',
    name: 'Japón',
    flag: '🇯🇵',
    reviews: 98500,
    watched: 342000,
    top: ['demon-slayer', 'frieren', 'spy-family', 'haikyuu', 'blue-lock'],
    x: 88.3,
    y: 33.8,
  },
  {
    id: 'brasil',
    name: 'Brasil',
    flag: '🇧🇷',
    reviews: 24800,
    watched: 98000,
    top: ['solo-leveling', 'demon-slayer', 'blue-lock', 'frieren', 'haikyuu'],
    x: 35.8,
    y: 68.3,
  },
  {
    id: 'espana',
    name: 'España',
    flag: '🇪🇸',
    reviews: 18200,
    watched: 73100,
    top: ['frieren', 'vinland-saga', 'spy-family', 'mob-psycho', 'solo-leveling'],
    x: 48.9,
    y: 31,
  },
  {
    id: 'estados-unidos',
    name: 'Estados Unidos',
    flag: '🇺🇸',
    reviews: 67200,
    watched: 218000,
    top: ['solo-leveling', 'frieren', 'demon-slayer', 'blue-lock', 'vinland-saga'],
    x: 22.8,
    y: 31.7,
  },
  {
    id: 'islandia',
    name: 'Islandia',
    flag: '🇮🇸',
    reviews: 0,
    watched: 0,
    top: [],
    x: 44.7,
    y: 13.8,
  },
];

export const ranks = ['Novato', 'Aprendiz', 'Experto', 'Maestro', 'Leyenda'];
// TODO BACKEND [RANGOS]: reemplazar los umbrales ilustrativos por las reglas confirmadas del servidor.
export function getRankProgress(watched: number) {
  const index = Math.min(ranks.length - 1, Math.max(0, Math.floor(watched / 100)));
  return {
    rank: ranks[index],
    nextRank: ranks[index + 1],
    total: Math.min(index + 1, ranks.length - 1) * 100,
  };
}

// TODO BACKEND [MISIONES]: consultar objetivos, progreso y recompensas por usuario.
export const auraMissions = [
  {
    id: 'romance',
    title: 'Amante del Romance',
    description: 'Mirá 100 animes del género Romance.',
    value: 30,
    total: 100,
    reward: 'Corazón de anime',
    state: 'En curso',
    icon: 'heart-outline' as const,
  },
  {
    id: 'shonen',
    title: 'La vida es un shonen',
    description: 'Mirá 100 animes del género Acción.',
    value: 64,
    total: 100,
    reward: 'Espíritu shonen',
    state: 'En curso',
    icon: 'flash-outline' as const,
  },
  {
    id: 'generos',
    title: 'Explorador de géneros',
    description: 'Mirá 10 géneros diferentes.',
    value: 7,
    total: 10,
    reward: 'Explorador',
    state: 'En curso',
    icon: 'compass-outline' as const,
  },
  {
    id: 'reviews',
    title: 'Una nueva voz',
    description: 'Escribí 3 nuevas reviews esta semana.',
    value: 0,
    total: 3,
    reward: 'Voz de la comunidad',
    state: 'Pendiente',
    icon: 'chatbox-outline' as const,
  },
  {
    id: 'primera',
    title: 'Primera historia',
    description: 'Marcá tu primer anime como visto.',
    value: 1,
    total: 1,
    reward: 'Primer capítulo',
    state: 'Completada',
    icon: 'ribbon-outline' as const,
  },
];

export const mapMetrics = {
  reviews: 'Cantidad de reviews',
  vistos: 'Anime más visto',
  popularidad: 'Anime más popular',
  anime: 'Vistos de un anime',
};
export type MapMetric = keyof typeof mapMetrics;

export function getMapMetric(value?: string, fallback: MapMetric = 'reviews'): MapMetric {
  return (
    (Object.keys(mapMetrics) as MapMetric[]).find(
      (key) => key === value || mapMetrics[key] === value,
    ) ?? fallback
  );
}

// TODO BACKEND [MAPA-METRICAS]: consultar la métrica por país y animeId; sustituir estas fórmulas de ejemplo.
// El mapa, el ranking de países y el detalle usan el mismo cálculo.
export function getCountryMetric(country: Country, metric: MapMetric, animeId?: string) {
  if (metric === 'reviews') return country.reviews;
  if (metric === 'vistos') return country.watched;
  if (metric === 'popularidad')
    return country.top.length ? 100 - countries.indexOf(country) * 6 : 0;
  const position = country.top.indexOf(animeId ?? '');
  return position < 0 ? 0 : Math.round(country.watched * (0.06 + (5 - position) * 0.025));
}

export function getCountryTop(country: Country, metric: MapMetric) {
  const items = country.top.map(findAnime).filter((item) => item !== undefined);
  if (metric === 'popularidad') items.sort((a, b) => b.popularity - a.popularity);
  if (metric === 'vistos') items.sort((a, b) => b.watched - a.watched);
  return items.slice(0, 5);
}
// TODO BACKEND [RELACIONES-USUARIO]: obtener colecciones, likes, amigos y seguidos de currentUser.id.
// Son muestras del historial; los totales del perfil representan un historial de ejemplo más amplio.
export const currentLibrary = {
  Watchlist: ['solo-leveling', 'demon-slayer', 'haikyuu', 'spy-family'],
  Vistos: ['frieren', 'vinland-saga', 'blue-lock', 'mob-psycho'],
};
export const currentLikedReviewIds = ['review-sofi', 'post-luli', 'review-nico'];
export const currentFriendIds = ['sofi', 'nico'];
export const currentFollowingIds = ['sofi', 'nico'];
export const genres = ['Acción', 'Comedia', 'Fantasía', 'Romance', 'Aventura', 'Drama', 'Deportes'];
export const seasons = ['Primavera 2026', 'Verano 2026', 'Otoño 2026', 'Invierno 2026'];

export const findAnime = (id: string | undefined) => anime.find((item) => item.id === id);
export const findUser = (id: string | undefined) => users.find((item) => item.id === id);
export const getParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;
