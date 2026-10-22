export type User = { id: string; handle: string; name: string; bio: string; createdAt: string };
export type Anime = {
  id: string;
  externalId: number;
  title: string;
  japanese: string | null;
  imageUrl: string | null;
  synopsis: string | null;
  episodes: number | null;
  year: number | null;
  season: string | null;
  genres: { id: string; name: string }[];
  statistics?: {
    averageRating: number | null;
    ratingCount: number;
    reviewCount: number;
    ratingUserCount: number;
  };
  metadataStale?: boolean;
};
export type Publication = {
  id: string;
  kind: 'review' | 'post';
  userId: string;
  author: User;
  animeId: string | null;
  anime: Anime | null;
  mentionedAnime: Anime[];
  animeIds: string[];
  ratingEntryId: string | null;
  rating: number | null;
  watchedOn: string | null;
  rewatched: boolean;
  title: string | null;
  text: string;
  spoiler: boolean;
  tags: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string | null;
};
export type Comment = { id: string; author: User; text: string; createdAt: string };
export type Rating = {
  id: string;
  animeId: string;
  rating: number;
  watchedOn: string | null;
  rewatched: boolean;
  publicationId: string | null;
  createdAt: string;
  updatedAt: string | null;
};
export type LibraryItem = {
  anime: Anime;
  watched: boolean;
  watchlist: boolean;
  favoritePosition: number | null;
};
export type Favorite = { anime: Anime; position: number };
export type AnimeList = {
  id: string;
  userId: string;
  author: User;
  title: string;
  description: string;
  ordered: boolean;
  animeIds: string[];
  items: Favorite[];
  itemCount: number;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string | null;
};
export type Rank = {
  name: string;
  index: number;
  watched: number;
  threshold: number;
  nextRank: string | null;
  nextThreshold: number | null;
  remaining: number;
  progress: number;
};
export type Profile = User & {
  rank: Rank;
  statistics: {
    watched: number;
    reviews: number;
    posts: number;
    followers: number;
    following: number;
    friends: number;
  };
  isMe: boolean;
  isFollowing: boolean;
  followsMe: boolean;
  isFriend: boolean;
  favorites: Favorite[];
};
export type Mission = {
  id: string;
  title: string;
  description: string;
  total: number;
  reward: string;
  value: number;
  state: string;
  claimed: boolean;
};
export type Aura = {
  statistics: {
    watched: number;
    reviews: number;
    genres: number;
    watchlist: number;
    favorites: number;
  };
  rank: Rank;
  ranks: { name: string; index: number; threshold: number; unlocked: boolean }[];
  missions: Mission[];
  rewards: { rewardId: string; reward: string; claimedAt: string }[];
};
export type Page<T> = {
  items: T[];
  total?: number;
  nextCursor?: string | null;
  nextPage?: number | null;
};
export type Activity = Page<Rating> & {
  watched: boolean;
  watchlist: boolean;
  favoritePosition: number | null;
  currentRating: Rating | null;
};
export type Extras = {
  streamingLinks: { id: string; site: string; url: string; language: string | null }[];
  characters: {
    role: string;
    character: { id: string; name: string | null; imageUrl: string | null };
    voiceActors: { id: string; name: string | null; imageUrl: string | null }[];
  }[];
  page: number;
  nextPage: number | null;
};
export const dateLabel = (date: string) => new Date(date).toLocaleString('es-AR');
