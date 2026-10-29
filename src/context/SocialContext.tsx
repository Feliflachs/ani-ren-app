import { users } from '../data';
import { Fragment, type ReactNode } from 'react';
import { useRemote } from './RemoteContext';
export function SocialProvider({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
export function useSocial() {
  const store = useRemote();
  const ids = (id: string, collection: string) =>
    (store.get(JSON.stringify([`/users/${id}/${collection}`, {}]))?.items ?? []).map(
      (row: any) => row.id ?? row.user?.id,
    ) as string[];
  return {
    getFollowingIds: (_id: string) =>
      users.filter((user) => user.isFollowing).map((user) => user.id),
    getFollowerIds: (id: string) => ids(id, 'followers'),
    getFriendIds: (_id: string) => users.filter((user) => user.isFriend).map((user) => user.id),
    toggleFollowing: async (_userId: string, id: string) => {
      try {
        const raw = (await store.load(`/users/${id}`, {}, true)).user;
        const result = await store.action(`/me/following/${id}`, {
          method: raw?.isFollowing ? 'DELETE' : 'PUT',
        });
        if (result && raw)
          store.ingest({ ...raw, isFollowing: result.isFollowing, isFriend: result.isFriend });
      } catch (e) {
        store.report(e);
      }
    },
  };
}
