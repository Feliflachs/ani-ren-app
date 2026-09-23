import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Chips,
  EmptyState,
  ListCard,
  ReviewCard,
  Screen,
  SearchBar,
  Section,
} from '../src/components';
import {
  anime,
  currentLibrary,
  currentLikedReviewIds,
  currentUser,
  findAnime,
  getParam,
  lists,
  reviews,
} from '../src/mock';
import { theme } from '../src/theme';

export default function BibliotecaScreen() {
  const params = useLocalSearchParams();
  const options = ['Watchlist', 'Vistos', 'Favoritos', 'Listas', 'Likes'];
  const requested =
    getParam(params.tab) ?? getParam(params.filter) ?? getParam(params.filtro) ?? 'Watchlist';
  const [tab, setTab] = useState(
    options.find((option) => option.toLowerCase() === requested.toLowerCase()) ?? 'Watchlist',
  );
  const [query, setQuery] = useState('');
  const [removed, setRemoved] = useState<Record<string, string[]>>({});
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  // TODO BACKEND [BIBLIOTECA]: consultar colecciones y likes de currentUser.id según el selector y texto.
  const collectionIds =
    tab === 'Watchlist'
      ? currentLibrary.Watchlist
      : tab === 'Vistos'
        ? currentLibrary.Vistos
        : currentUser.favorites;
  const results = anime.filter(
    (item) =>
      collectionIds.includes(item.id) &&
      !(removed[tab] ?? []).includes(item.id) &&
      item.title.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const ownLists = lists.filter(
    (item) =>
      item.userId === currentUser.id &&
      `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase().trim()),
  );
  const likedReviews = reviews.filter(
    (item) =>
      currentLikedReviewIds.includes(item.id) &&
      `${item.text} ${findAnime(item.animeId)?.title ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const count =
    tab === 'Listas' ? ownLists.length : tab === 'Likes' ? likedReviews.length : results.length;
  const removeAnime = (animeId: string) => {
    // TODO BACKEND [COLECCION-QUITAR]: hoy se oculta localmente; guardar eliminación para currentUser.id, animeId y tab.
    setRemoved((previous) => ({ ...previous, [tab]: [...(previous[tab] ?? []), animeId] }));
  };

  return (
    <Screen
      title="Mi biblioteca"
      subtitle="Las historias que viste, guardaste y querés recordar."
      back
    >
      <Chips options={options} value={tab} onChange={setTab} />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={`Buscar en ${tab.toLowerCase()}`}
      />
      <Section
        title={`${count} ${tab === 'Listas' ? 'listas' : tab === 'Likes' ? 'publicaciones' : 'animes'}`}
        onPress={tab === 'Listas' ? () => router.push('/lista/editar') : undefined}
        action="Nueva lista"
      />
      {count === 0 && (
        <EmptyState
          title={query ? 'Sin coincidencias' : 'Tu colección está vacía'}
          text={query ? 'Probá con otro nombre.' : 'Descubrí una historia y guardala para después.'}
          action={query ? 'Limpiar búsqueda' : tab === 'Listas' ? 'Crear lista' : 'Explorar anime'}
          onPress={() =>
            query ? setQuery('') : router.push(tab === 'Listas' ? '/lista/editar' : '/explorar')
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
      {tab === 'Likes' && likedReviews.map((item) => <ReviewCard key={item.id} review={item} />)}
      <View style={styles.note}>
        <Text style={styles.meta}>
          Colecciones de ejemplo. Los cambios se muestran en esta vista.
        </Text>
      </View>
      {tab !== 'Listas' && (
        <Action
          label="Organizar una nueva lista"
          icon="albums-outline"
          onPress={() => router.push('/lista/editar')}
        />
      )}
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
