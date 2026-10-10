import { publicationAnimeIds } from '../../src/publications';
import { useDirectory } from '../../src/useDirectory';
import { useLists } from '../../src/context/ListsContext';
import { usePublications } from '../../src/context/PublicationsContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import {
  AnimeCard,
  Avatar,
  Chips,
  EmptyState,
  ListCard,
  PublicationCard,
  Screen,
  SearchBar,
  Section,
} from '../../src/components';
import { anime, findAnime, genres, getParam, getRankProgress, seasons } from '../../src/mock';
import { theme } from '../../src/theme';

export default function BusquedaScreen() {
  const { findUser, users } = useDirectory();
  const { lists } = useLists();
  const { publications } = usePublications();

  const params = useLocalSearchParams();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const [query, setQuery] = useState(getParam(params.q) ?? getParam(params.query) ?? '');
  const requestedCategory = getParam(params.type) ?? 'Anime';
  const requestedGenre = getParam(params.genre) ?? getParam(params.genero);
  const requestedSeason = getParam(params.season) ?? getParam(params.temporada);
  const [category, setCategory] = useState(
    ['Anime', 'Publicaciones', 'Usuarios', 'Listas'].find(
      (option) => option.toLowerCase() === requestedCategory.toLowerCase(),
    ) ?? 'Anime',
  );
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    requestedGenre && genres.includes(requestedGenre) ? [requestedGenre] : [],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
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
  // TODO BACKEND [BUSQUEDA]: hoy se filtran datos de ejemplo; consultar texto, categoría, géneros (cualquiera de los elegidos) y una temporada.
  const matchingAnime = anime.filter(
    (item) =>
      matches(`${item.title} ${item.japanese} ${item.genres.join(' ')}`) &&
      (selectedGenres.length === 0 ||
        selectedGenres.some((genre) => item.genres.includes(genre))) &&
      (season === 'Todas las temporadas' || item.season === season),
  );
  const matchesContext = (animeId: string | undefined) => {
    const item = findAnime(animeId);
    return (
      (selectedGenres.length === 0 ||
        selectedGenres.some((genre) => item?.genres.includes(genre))) &&
      (season === 'Todas las temporadas' || item?.season === season)
    );
  };
  const matchingReviews = publications.filter(
    (item) =>
      matches(
        `${item.text} ${item.tags.map((tag) => '#' + tag).join(' ')} ${findUser(item.userId)?.name ?? ''} ${publicationAnimeIds(
          item,
        )
          .map((id) => findAnime(id)?.title ?? '')
          .join(' ')}`,
      ) &&
      ((selectedGenres.length === 0 && season === 'Todas las temporadas') ||
        publicationAnimeIds(item).some(matchesContext)),
  );
  const matchingUsers = users.filter((item) => matches(`${item.name} ${item.handle} ${item.bio}`));
  const matchingLists = lists.filter(
    (item) =>
      matches(`${item.title} ${item.description}`) &&
      ((selectedGenres.length === 0 && season === 'Todas las temporadas') ||
        item.animeIds.some(matchesContext)),
  );
  const count =
    category === 'Anime'
      ? matchingAnime.length
      : category === 'Publicaciones'
        ? matchingReviews.length
        : category === 'Usuarios'
          ? matchingUsers.length
          : matchingLists.length;
  const filterCount = selectedGenres.length + (season === 'Todas las temporadas' ? 0 : 1);
  const filterSummary = [
    ...selectedGenres,
    ...(season === 'Todas las temporadas' ? [] : [season]),
  ].join(' · ');
  const clearFilters = () => {
    setSelectedGenres([]);
    setSeason('Todas las temporadas');
    setStatus('ready');
  };
  const clearSearch = () => {
    setQuery('');
    clearFilters();
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
        options={['Anime', 'Publicaciones', 'Usuarios', 'Listas']}
        value={category}
        onChange={setCategory}
        variant="underline"
      />
      {category !== 'Usuarios' && (
        <View style={styles.filters}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filtros de búsqueda"
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => setFiltersOpen((open) => !open)}
            style={styles.filterToggle}
          >
            <Ionicons name="options-outline" size={20} color={theme.colors.primarySoft} />
            <View style={styles.grow}>
              <Text style={styles.title}>Filtros{filterCount > 0 ? ' · ' + filterCount : ''}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {filterSummary || 'Todos los géneros y temporadas'}
              </Text>
            </View>
            <Ionicons
              name={filtersOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
          {filtersOpen && (
            <View style={styles.filterMenu}>
              <View style={styles.filterHeading}>
                <Text style={styles.title}>Géneros</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={clearFilters}
                  style={styles.smallButton}
                >
                  <Text style={styles.filterLink}>Limpiar</Text>
                </Pressable>
              </View>
              <Text style={styles.meta}>Podés elegir varios: se busca cualquiera de ellos.</Text>
              <View style={styles.options}>
                {genres.map((genre) => (
                  <FilterOption
                    key={genre}
                    label={genre}
                    selected={selectedGenres.includes(genre)}
                    onPress={() => {
                      setSelectedGenres((previous) =>
                        previous.includes(genre)
                          ? previous.filter((value) => value !== genre)
                          : [...previous, genre],
                      );
                      setStatus('ready');
                    }}
                  />
                ))}
              </View>
              <Text style={styles.title}>Temporada · una sola</Text>
              <View style={styles.options}>
                {['Todas las temporadas', ...seasons].map((value) => (
                  <FilterOption
                    key={value}
                    label={value === 'Todas las temporadas' ? 'Cualquiera' : value}
                    selected={season === value}
                    radio
                    onPress={() => {
                      setSeason(value);
                      setStatus('ready');
                    }}
                  />
                ))}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setFiltersOpen(false)}
                style={styles.closeFilters}
              >
                <Text style={styles.filterLink}>
                  Ver {count} {count === 1 ? 'resultado' : 'resultados'}
                </Text>
                <Ionicons name="chevron-up" size={16} color={theme.colors.primarySoft} />
              </Pressable>
            </View>
          )}
        </View>
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
        <EmptyState action="Limpiar búsqueda" onPress={clearSearch} />
      ) : (
        <>
          {category === 'Anime' && (
            <View style={styles.grid}>
              {matchingAnime.map((item) => (
                <AnimeCard key={item.id} item={item} width={Math.min(180, (width - 44) / 2)} />
              ))}
            </View>
          )}
          {category === 'Publicaciones' &&
            matchingReviews.map((item) => <PublicationCard key={item.id} review={item} />)}
          {category === 'Usuarios' &&
            matchingUsers.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/perfil/usuario/[id]', params: { id: item.id } })
                }
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
    </Screen>
  );
}

// Casillas para géneros; botones de opción para la temporada.
function FilterOption({
  label,
  selected,
  radio = false,
  onPress,
}: {
  label: string;
  selected: boolean;
  radio?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={radio ? 'radio' : 'checkbox'}
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Ionicons
        name={
          radio
            ? selected
              ? 'radio-button-on'
              : 'radio-button-off'
            : selected
              ? 'checkbox'
              : 'square-outline'
        }
        size={19}
        color={selected ? theme.colors.primarySoft : theme.colors.textSecondary}
      />
      <Text style={[styles.optionText, selected && styles.filterLink]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    overflow: 'hidden',
  },
  filterToggle: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, minHeight: 56 },
  filterMenu: { borderTopWidth: 1, borderTopColor: theme.colors.border, padding: 12, gap: 10 },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  smallButton: { minHeight: 40, paddingHorizontal: 8, justifyContent: 'center' },
  filterLink: { color: theme.colors.primarySoft, fontSize: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  option: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    minHeight: 44,
    borderRadius: 8,
  },
  optionSelected: { backgroundColor: theme.colors.surfaceLight },
  optionText: { color: theme.colors.textSecondary, flex: 1, fontSize: 12 },
  closeFilters: {
    minHeight: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
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
