import { createContext, useContext, useState, type ReactNode } from 'react';
import { followingByUser } from '../mock';

// Una sola definición de las relaciones para perfiles, feed, comunidad y ranking.
export function friendIdsFor(id: string, following: Record<string, string[]>) {
  return (following[id] ?? []).filter((other) => (following[other] ?? []).includes(id));
}
function useSocialState() {
  const [following, setFollowing] = useState(followingByUser);
  const getFollowingIds = (id: string) => following[id] ?? [];
  const getFollowerIds = (id: string) =>
    Object.keys(following).filter((other) => getFollowingIds(other).includes(id));
  const getFriendIds = (id: string) => friendIdsFor(id, following);
  function toggleFollowing(userId: string, otherId: string) {
    if (userId === otherId) return;
    setFollowing((previous) => {
      const ids = previous[userId] ?? [];
      return {
        ...previous,
        [userId]: ids.includes(otherId) ? ids.filter((id) => id !== otherId) : [...ids, otherId],
      };
    });
  }
  return { getFollowingIds, getFollowerIds, getFriendIds, toggleFollowing };
}
const SocialContext = createContext<ReturnType<typeof useSocialState> | null>(null);
export function SocialProvider({ children }: { children: ReactNode }) {
  return <SocialContext.Provider value={useSocialState()}>{children}</SocialContext.Provider>;
}
export function useSocial() {
  const value = useContext(SocialContext);
  if (!value) throw new Error('Falta SocialProvider');
  return value;
}
