import { createContext, useContext, useState, type ReactNode } from 'react';
import { lists as initialLists, type AnimeList } from '../mock';

// animeIds es la fuente del contenido Y del orden de cada lista.
function useListsState() {
  const [lists, setLists] = useState(initialLists);
  const [likes, setLikes] = useState<Record<string, string[]>>({});
  function saveList(
    userId: string,
    draft: Pick<AnimeList, 'title' | 'description' | 'ordered' | 'animeIds'>,
    id?: string,
  ) {
    const listId = id ?? `list-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setLists((previous) => {
      const existing = previous.find((list) => list.id === listId);
      if (existing && existing.userId !== userId) return previous;
      const next = { ...draft, animeIds: [...new Set(draft.animeIds)], id: listId, userId };
      return existing
        ? previous.map((list) => (list.id === listId ? next : list))
        : [...previous, next];
    });
    return listId;
  }
  function toggleAnime(userId: string, listId: string, animeId: string) {
    setLists((previous) =>
      previous.map((list) => {
        if (list.id !== listId || list.userId !== userId) return list;
        return {
          ...list,
          animeIds: list.animeIds.includes(animeId)
            ? list.animeIds.filter((id) => id !== animeId)
            : [...list.animeIds, animeId],
        };
      }),
    );
  }
  function toggleLike(userId: string, listId: string) {
    setLikes((previous) => {
      const ids = previous[userId] ?? [];
      return {
        ...previous,
        [userId]: ids.includes(listId) ? ids.filter((id) => id !== listId) : [...ids, listId],
      };
    });
  }
  return {
    lists: lists.map((list) => ({
      ...list,
      likes: Object.values(likes).filter((ids) => ids.includes(list.id)).length,
    })),
    saveList,
    toggleAnime,
    toggleLike,
    isLiked: (userId: string, id: string) => (likes[userId] ?? []).includes(id),
  };
}
const ListsContext = createContext<ReturnType<typeof useListsState> | null>(null);
export function ListsProvider({ children }: { children: ReactNode }) {
  return <ListsContext.Provider value={useListsState()}>{children}</ListsContext.Provider>;
}
export function useLists() {
  const value = useContext(ListsContext);
  if (!value) throw new Error('Falta ListsProvider');
  return value;
}
