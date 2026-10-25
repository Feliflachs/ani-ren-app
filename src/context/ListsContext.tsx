import { Fragment, type ReactNode } from 'react';
import { useRemote } from './RemoteContext';
import { lists, type AnimeList } from '../data';
export function ListsProvider({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
export function useLists() {
  const store = useRemote();
  async function saveList(
    _userId: string,
    draft: Pick<AnimeList, 'title' | 'description' | 'ordered' | 'animeIds'>,
    id?: string,
  ) {
    const result = await store.mutate(id ? `/lists/${id}` : '/lists', {
      method: id ? 'PATCH' : 'POST',
      body: draft,
    });
    return result.list.id as string;
  }
  return {
    lists,
    saveList,
    toggleAnime: async (userId: string, listId: string, animeId: string) => {
      const list = lists.find((item) => item.id === listId);
      if (!list) return;
      try {
        await saveList(
          userId,
          {
            title: list.title,
            description: list.description,
            ordered: list.ordered,
            animeIds: list.animeIds.includes(animeId)
              ? list.animeIds.filter((id) => id !== animeId)
              : [...list.animeIds, animeId],
          },
          listId,
        );
      } catch (e) {
        store.report(e);
      }
    },
    toggleLike: (_userId: string, id: string) =>
      store
        .action(`/lists/${id}/like`, {
          method: store.rawLists.get(id)?.likedByMe ? 'DELETE' : 'PUT',
        })
        .then((result) => {
          if (result) {
            const raw = store.rawLists.get(id);
            if (raw)
              store.ingest({ ...raw, likedByMe: result.likedByMe, likeCount: result.likeCount });
          }
        }),
    isLiked: (_userId: string, id: string) => !!store.rawLists.get(id)?.likedByMe,
  };
}
