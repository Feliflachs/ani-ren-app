import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter } from '../../src/remote-ui';
import { adaptAnime, adaptPublication } from '../../src/api/remote';
import { useLists } from '../../src/context/ListsContext';
import { usePublications } from '../../src/context/PublicationsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Chips,
  EmptyState,
  ListCard,
  PublicationCard,
  Screen,
  SearchBar,
  Section,
} from '../../src/components';
import { getParam } from '../../src/data';
import { useAppState } from '../../src/context/AppState';
import { theme } from '../../src/theme';

export default function BibliotecaScreen() {
  const { lists } = useLists();
  usePublications();

  const currentUser = useCurrentUser();

  const params = useLocalSearchParams();
  const options = ['Watchlist', 'Vistos', 'Favoritos', 'Listas', 'Likes'];
  const requested =
    getParam(params.tab) ?? getParam(params.filter) ?? getParam(params.filtro) ?? 'Watchlist';
  const [tab, setTab] = useState(
    options.find((option) => option.toLowerCase() === requested.toLowerCase()) ?? 'Watchlist',
  );
  const [query, setQuery] = useState('');
  const { updateActivity } = useAppState();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const page = usePage(
    tab === 'Listas'
      ? '/lists'
      : tab === 'Likes'
        ? `/users/${currentUser.id}/publications`
        : `/users/${currentUser.id}/library`,
    tab === 'Listas'
      ? { userId: currentUser.id, q: query }
      : tab === 'Likes'
        ? { collection: 'likes', q: query }
        : {
            collection:
              tab === 'Watchlist' ? 'watchlist' : tab === 'Vistos' ? 'watched' : 'favorites',
            q: query,
          },
  );
  const results =
    tab === 'Listas' || tab === 'Likes' ? [] : page.items.map((row) => adaptAnime(row.anime));
  const ownLists =
    tab === 'Listas'
      ? page.items.map((row) => lists.find((list) => list.id === row.id)!).filter(Boolean)
      : [];
  const likedReviews = tab === 'Likes' ? page.items.map(adaptPublication) : [];
  const count =
    tab === 'Listas' ? ownLists.length : tab === 'Likes' ? likedReviews.length : results.length;
  const removeAnime = (animeId: string) => {
    if (tab === 'Watchlist') updateActivity(animeId, { watchlist: false });
    if (tab === 'Vistos') updateActivity(animeId, { watched: false });
    if (tab === 'Favoritos') updateActivity(animeId, { liked: false });
  };

  return (
    <Screen
      title="Mi biblioteca"
      subtitle="Las historias que viste, guardaste y querés recordar."
      back
    >
      <Chips options={options} value={tab} onChange={setTab} variant="underline" />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={`Buscar en ${tab.toLowerCase()}`}
      />
      <Section
        title={`${count} ${tab === 'Listas' ? 'listas' : tab === 'Likes' ? 'publicaciones' : 'animes'}`}
        onPress={tab === 'Listas' ? () => router.push('/perfil/listas/editar') : undefined}
        action="Nueva lista"
      />
      {count === 0 && (
        <EmptyState
          title={query ? 'Sin coincidencias' : 'Tu colección está vacía'}
          text={query ? 'Probá con otro nombre.' : 'Descubrí una historia y guardala para después.'}
          action={query ? 'Limpiar búsqueda' : tab === 'Listas' ? 'Crear lista' : 'Explorar anime'}
          onPress={() =>
            query
              ? setQuery('')
              : router.push(tab === 'Listas' ? '/perfil/listas/editar' : '/explorar')
          }
        />
      )}
      {!['Listas', 'Likes'].includes(tab) && (
        <View style={styles.grid}>
          {results.map((item) => (
            <View key={item.id} style={styles.item}>
              <AnimeCard item={item} width={Math.min(180, (width - 44) / 2)} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${item.title} de ${tab}`}
                onPress={() => removeAnime(item.id)}
                style={styles.remove}
              >
                <Text style={styles.link}>Quitar de {tab.toLowerCase()}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
      {tab === 'Listas' && ownLists.map((item) => <ListCard key={item.id} list={item} />)}
      {tab === 'Likes' &&
        likedReviews.map((item) => <PublicationCard key={item.id} review={item} />)}
      <View style={styles.note}>
        <Text style={styles.meta}>Tus colecciones se guardan en tu cuenta.</Text>
      </View>
      {tab !== 'Listas' && (
        <Action
          label="Organizar una nueva lista"
          icon="albums-outline"
          onPress={() => router.push('/perfil/listas/editar')}
        />
      )}
      <QueryFooter query={page} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  item: { gap: 3 },
  remove: { paddingVertical: 8 },
  meta: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  link: { color: theme.colors.primarySoft, fontSize: 11 },
  note: { paddingVertical: 8 },
});
