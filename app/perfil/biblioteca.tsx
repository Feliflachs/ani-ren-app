import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Chips, Action, ListCard } from '../../src/components';
import { useSession } from '../../src/context/SessionContext';
import { usePage, useQuery, useMutation } from '../../src/remote';
import { query } from '../../src/api';
import { AnimeRow, LoadState, Notice, PageEnd, ui } from '../../src/remote-ui';
import type { LibraryItem, Favorite, AnimeList } from '../../src/models';
export default function Biblioteca() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState(
    ['Watchlist', 'Vistos', 'Favoritos', 'Listas'].includes(params.tab ?? '')
      ? params.tab!
      : 'Watchlist',
  );
  const { user } = useSession();
  const library = usePage<LibraryItem>(
    tab === 'Watchlist' || tab === 'Vistos'
      ? query('/me/library', { collection: tab === 'Vistos' ? 'watched' : 'watchlist' })
      : null,
  );
  const favorites = useQuery<{ items: Favorite[]; total: number }>(
    tab === 'Favoritos' ? '/me/favorites' : null,
  );
  const lists = usePage<AnimeList>(tab === 'Listas' ? query('/lists', { userId: user?.id }) : null);
  const mutation = useMutation();
  const ids = favorites.data?.items.map((item) => item.anime.id) ?? [];
  async function move(index: number, delta: number) {
    const next = [...ids];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    await mutation.run('/me/favorites', { method: 'PUT', body: { animeIds: next } });
  }
  return (
    <Screen
      title="Mi biblioteca"
      subtitle="Las historias que viste, guardaste y querés recordar."
      back
    >
      <Chips
        options={['Watchlist', 'Vistos', 'Favoritos', 'Listas']}
        value={tab}
        onChange={setTab}
        variant="underline"
      />
      <Notice error={mutation.error} />
      {tab === 'Listas' ? (
        <>
          <Action
            label="Crear lista"
            primary
            onPress={() => router.push('/perfil/listas/editar')}
          />
          {lists.items.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
          <PageEnd page={lists} />
        </>
      ) : tab === 'Favoritos' ? (
        <>
          <LoadState {...favorites} empty={!!favorites.data && !ids.length} />
          <Text style={ui.muted}>{favorites.data?.total ?? 0} favoritos</Text>
          {favorites.data?.items.map((item, index) => (
            <AnimeRow key={item.anime.id} anime={item.anime}>
              <View style={ui.wrap}>
                <Action
                  label="Quitar"
                  disabled={mutation.pending}
                  onPress={() =>
                    void mutation.run('/me/favorites', {
                      method: 'PUT',
                      body: { animeIds: ids.filter((id) => id !== item.anime.id) },
                    })
                  }
                />
                <Action
                  label="Subir"
                  disabled={index === 0 || mutation.pending}
                  onPress={() => void move(index, -1)}
                />
                <Action
                  label="Bajar"
                  disabled={index === ids.length - 1 || mutation.pending}
                  onPress={() => void move(index, 1)}
                />
              </View>
            </AnimeRow>
          ))}
        </>
      ) : (
        <>
          {library.data?.total !== undefined && (
            <Text style={ui.muted}>{library.data.total} animes</Text>
          )}
          {library.items.map((item) => (
            <AnimeRow key={item.anime.id} anime={item.anime}>
              {tab === 'Watchlist' && (
                <Action
                  label="Quitar de watchlist"
                  disabled={mutation.pending}
                  onPress={() =>
                    void mutation.run('/me/library/' + encodeURIComponent(item.anime.id), {
                      method: 'PATCH',
                      body: { watchlist: false },
                    })
                  }
                />
              )}
            </AnimeRow>
          ))}
          <PageEnd page={library} />
        </>
      )}
    </Screen>
  );
}
