import { useProfiles } from './context/ProfilesContext';
import { useActivities } from './context/AppState';
import { usePublications } from './context/PublicationsContext';
import { useSocial } from './context/SocialContext';

// Datos derivados, no otro contexto: todos los perfiles consultan las mismas colecciones.
// TODO BACKEND [PERFIL-TOTALES]: usar totales del servidor cuando haya paginación; contar elementos cargados no da el total real.
export function useDirectory() {
  const { profiles } = useProfiles();
  const { getCollection } = useActivities();
  const { reviews } = usePublications();
  const { getFollowerIds, getFollowingIds } = useSocial();
  const users = profiles.map((profile) => {
    const activity = getCollection(profile.id);
    return {
      ...profile,
      favorites: activity.likedIds,
      watched: activity.watchedIds.length,
      watchlist: activity.watchlistIds.length,
      reviews: reviews.filter((review) => review.userId === profile.id).length,
      followers: getFollowerIds(profile.id).length,
      following: getFollowingIds(profile.id).length,
    };
  });
  return { users, findUser: (id: string | undefined) => users.find((user) => user.id === id) };
}
