import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Avatar,
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
  findAnime,
  findUser,
  genres,
  getParam,
  getRankProgress,
  lists,
  reviews,
  seasons,
  users,
} from '../src/mock';
import { theme } from '../src/theme';

export default function BusquedaScreen() {
  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const [query, setQuery] = useState(getParam(params.q) ?? getParam(params.query) ?? '');
  const requestedCategory = getParam(params.type) ?? 'Anime';
  const requestedGenre = getParam(params.genre) ?? getParam(params.genero);
  const requestedSeason = getParam(params.season) ?? getParam(params.temporada);
  const [category, setCategory] = useState(
    ['Anime', 'Reviews', 'Usuarios', 'Listas'].find(
      (option) => option.toLowerCase() === requestedCategory.toLowerCase(),
    ) ?? 'Anime',
  );
  const [genre, setGenre] = useState(
    requestedGenre && genres.includes(requestedGenre) ? requestedGenre : 'Todos los géneros',
  );
  const [season, setSeason] = useState(
    requestedSeason && seasons.includes(requestedSeason) ? requestedSeason : 'Todas las temporadas',
  );
  const [status, setStatus] = useState(getParam(params.state) ?? 'ready');
  const normalize = (value: string) =>
    value
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  const normalizedQuery = normalize(query.trim());
  const matches = (value: string) => normalize(value).includes(normalizedQuery);
  // TODO BACKEND [BUSQUEDA]: hoy se filtran datos de ejemplo; consultar texto, categoría, género y temporada.
  const matchingAnime = anime.filter(
    (item) =>
      matches(`${item.title} ${item.japanese} ${item.genres.join(' ')}`) &&
      (genre === 'Todos los géneros' || item.genres.includes(genre)) &&
      (season === 'Todas las temporadas' || item.season === season),
  );
  const matchesContext = (animeId: string | undefined) => {
    const item = findAnime(animeId);
    return (
      (genre === 'Todos los géneros' || item?.genres.includes(genre)) &&
      (season === 'Todas las temporadas' || item?.season === season)
    );
  };
  const matchingReviews = reviews.filter(
    (item) =>
      matches(
        `${item.text} ${findUser(item.userId)?.name ?? ''} ${findAnime(item.animeId)?.title ?? ''}`,
      ) && matchesContext(item.animeId),
  );
  const matchingUsers = users.filter((item) => matches(`${item.name} ${item.handle} ${item.bio}`));
  const matchingLists = lists.filter(
    (item) =>
      matches(`${item.title} ${item.description}`) &&
      ((genre === 'Todos los géneros' && season === 'Todas las temporadas') ||
        item.animeIds.some(matchesContext)),
  );
  const count =
    category === 'Anime'
      ? matchingAnime.length
      : category === 'Reviews'
        ? matchingReviews.length
        : category === 'Usuarios'
          ? matchingUsers.length
          : matchingLists.length;
  const clearSearch = () => {
    setQuery('');
    setGenre('Todos los géneros');
    setSeason('Todas las temporadas');
    setStatus('ready');
  };

  return (
    <Screen title="Buscar" subtitle="Encontrá tu próxima historia y a quienes la comparten." back>
      <SearchBar
        value={query}
        onChangeText={(text) => {
          setQuery(text);
          setStatus('ready');
        }}
        onSubmit={() => setStatus('ready')}
      />
      <Chips
        options={['Anime', 'Reviews', 'Usuarios', 'Listas']}
        value={category}
        onChange={setCategory}
      />
      {category !== 'Usuarios' && (
        <>
          <Chips options={['Todos los géneros', ...genres]} value={genre} onChange={setGenre} />
          <Chips
            options={['Todas las temporadas', ...seasons]}
            value={season}
            onChange={setSeason}
          />
        </>
      )}
      <Section title={`${count} ${count === 1 ? 'resultado' : 'resultados'}`} />
      {status === 'loading' ? (
        <EmptyState
          loading
          title="Buscando historias…"
          text="En un momento aparecen los resultados."
          action="Ver resultados"
          onPress={() => setStatus('ready')}
        />
      ) : status === 'error' ? (
        <EmptyState
          title="No pudimos cargar la búsqueda"
          text="Probá nuevamente dentro de un momento."
          action="Reintentar"
          onPress={() => setStatus('ready')}
        />
      ) : count === 0 ? (
        <EmptyState
          action={category === 'Anime' ? 'Solicitar un anime' : 'Limpiar búsqueda'}
          onPress={() =>
            category === 'Anime'
              ? router.push({ pathname: '/solicitar-anime', params: { title: query } })
              : clearSearch()
          }
        />
      ) : (
        <>
          {category === 'Anime' && (
            <View style={styles.grid}>
              {matchingAnime.map((item) => (
                <AnimeCard key={item.id} item={item} width={Math.min(180, (width - 44) / 2)} />
              ))}
            </View>
          )}
          {category === 'Reviews' &&
            matchingReviews.map((item) => <ReviewCard key={item.id} review={item} />)}
          {category === 'Usuarios' &&
            matchingUsers.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: item.id } })}
                style={[styles.card, styles.row]}
              >
                <Avatar user={item} />
                <View style={styles.grow}>
                  <Text style={styles.title}>{item.name}</Text>
                  <Text style={styles.meta}>
                    @{item.handle} · {getRankProgress(item.watched).rank}
                  </Text>
                  <Text numberOfLines={2} style={styles.body}>
                    {item.bio}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color={theme.colors.primarySoft} size={18} />
              </Pressable>
            ))}
          {category === 'Listas' &&
            matchingLists.map((item) => <ListCard key={item.id} list={item} />)}
        </>
      )}
      {category === 'Anime' && count > 0 && (
        <Action
          label="¿Falta un anime? Solicitá agregarlo"
          icon="add-circle-outline"
          onPress={() => router.push({ pathname: '/solicitar-anime', params: { title: query } })}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 13,
    gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: theme.colors.textSecondary, fontSize: 12 },
  body: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
});
