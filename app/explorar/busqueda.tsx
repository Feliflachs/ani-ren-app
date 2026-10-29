import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter, withResources } from '../../src/remote-ui';
import { adaptAnime, adaptPublication, adaptUser, genreIds } from '../../src/api/remote';
import { useLists } from '../../src/context/ListsContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { genres, getParam, seasons } from '../../src/data';
import { theme } from '../../src/theme';

function BusquedaScreen() {
  const { lists } = useLists();

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
  const [seasonName, year] = season.split(' ');
  const seasonCode: Record<string, string> = {
    Primavera: 'spring',
    Verano: 'summer',
    Otoño: 'fall',
    Invierno: 'winter',
  };
  const page = usePage('/search', {
    type:
      category === 'Anime'
        ? 'anime'
        : category === 'Publicaciones'
          ? 'publications'
          : category === 'Usuarios'
            ? 'users'
            : 'lists',
    q: query,
    ...(category === 'Anime' ? { page: 1 } : {}),
    ...(category === 'Usuarios'
      ? {}
      : {
          genres:
            selectedGenres
              .map((name) => genreIds.get(name))
              .filter(Boolean)
              .join(',') || undefined,
          season: seasonCode[seasonName],
          year: seasonCode[seasonName] ? Number(year) : undefined,
        }),
  });
  const status = page.loading ? 'loading' : page.error ? 'error' : 'ready';
  const setStatus = (_status: string) => {
    if (page.error) page.reload();
  };
  const matchingAnime = category === 'Anime' ? page.items.map(adaptAnime) : [];
  const matchingReviews = category === 'Publicaciones' ? page.items.map(adaptPublication) : [];
  const matchingUsers = category === 'Usuarios' ? page.items.map(adaptUser) : [];
  const matchingLists =
    category === 'Listas'
      ? page.items.map((row) => lists.find((list) => list.id === row.id)!).filter(Boolean)
      : [];
  const count =
    category === 'Anime'
      ? matchingAnime.length
      : category === 'Publicaciones'
        ? matchingReviews.length
        : category === 'Usuarios'
          ? matchingUsers.length
          : matchingLists.length;
  const filterCount = selectedGenres.length + (season === 'Todas las temporadas' ? 0 : 1);
  useEffect(() => {
    if (
      category === 'Anime' &&
      filterCount > 0 &&
      matchingAnime.length < 6 &&
      page.hasMore &&
      !page.loading &&
      !page.error
    ) {
      void page.more();
    }
  }, [category, filterCount, matchingAnime.length, page]);
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
          text={page.error || 'Probá nuevamente dentro de un momento.'}
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
                <AnimeCard key={item.id} item={item} width={(width - 44) / 2} />
              ))}
            </View>
          )}
          {category === 'Publicaciones' &&
            matchingReviews.map((item) => <PublicationCard key={item.id} review={item} separated />)}
          {category === 'Usuarios' &&
            matchingUsers.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({ pathname: '/perfil/usuario/[id]', params: { id: item.id } })
                }
                style={[styles.resultRow, styles.row]}
              >
                <Avatar user={item} />
                <View style={styles.grow}>
                  <Text style={[styles.title, styles.userName]}>{item.name}</Text>
                  <Text style={styles.meta}>
                    @{item.handle} · {item.rank ?? '—'}
                  </Text>
                  <Text numberOfLines={2} style={styles.body}>
                    {item.bio}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" color={theme.colors.primarySoft} size={18} />
              </Pressable>
            ))}
          {category === 'Listas' &&
            matchingLists.map((item) => <ListCard key={item.id} list={item} separated />)}
        </>
      )}
      <QueryFooter query={{ ...page, loading: false, error: '' }} />
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  resultRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingVertical: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1, minWidth: 0, gap: 4 },
  title: { color: theme.colors.text, fontWeight: '600', fontSize: 14 },
  userName: { color: theme.colors.primarySoft },
  meta: { color: theme.colors.textSecondary, fontSize: 12 },
  body: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
});

export default withResources(BusquedaScreen, () => [['/explore']]);
