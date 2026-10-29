import { useQuery } from '../../src/context/RemoteContext';
import { adaptAnime } from '../../src/api/remote';
import { withResources } from '../../src/remote-ui';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import {
  Platform,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AnimeCard, Action, Screen, SearchBar, Section } from '../../src/components';
import { genres, seasons } from '../../src/data';
import { WorldMap } from '../../src/WorldMap';
import { theme } from '../../src/theme';

const genreIcons: ComponentProps<typeof Ionicons>['name'][] = [
  'flash-outline',
  'happy-outline',
  'sparkles-outline',
  'heart-outline',
  'compass-outline',
  'book-outline',
  'football-outline',
];

const seasonImages = [
  require('../../assets/seasons/primavera.jpg'),
  require('../../assets/seasons/verano.jpg'),
  require('../../assets/seasons/otono.jpg'),
  require('../../assets/seasons/invierno.jpg'),
];

function Explorar() {
  const explore = useQuery('/explore');
  const trending: import('../../src/data').Anime[] = (explore.data?.trending ?? []).map(
    (row: import('../../src/api/remote').Wire) => adaptAnime(row.anime),
  );
  const genreImages = [
    require('../../assets/solo-leveling.jpg'),
    require('../../assets/spy-family.jpg'),
    require('../../assets/frieren.jpg'),
    require('../../assets/spy-family.jpg'),
    require('../../assets/mob-psycho.jpg'),
    require('../../assets/haikyuu.jpg'),
    require('../../assets/blue-lock.jpg'),
  ];
  const [query, setQuery] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const trendWidth = Math.max(82, Math.min(110, (width - 56) / 4));
  const genreLabels = showAllGenres ? genres : genres.slice(0, 4);
  const search = () => router.push({ pathname: '/explorar/busqueda', params: { q: query } });
  const genreCards = genreLabels.map((genre, index) => (
    <Pressable
      accessibilityRole="button"
      key={genre}
      onPress={() => router.push({ pathname: '/explorar/busqueda', params: { genre } })}
      style={styles.genre}
    >
      <ImageBackground
        source={genreImages[index % genreImages.length]}
        style={styles.genreImage}
        imageStyle={styles.imageRadius}
      >
        <View style={styles.genreShade}>
          <Ionicons name={genreIcons[index]} size={24} color={theme.colors.primarySoft} />
          <Text style={styles.genreText}>{genre}</Text>
        </View>
      </ImageBackground>
    </Pressable>
  ));

  return (
    <Screen
      title="Explorar"
      subtitle="Descubrí anime, tendencias y estadísticas del mundo."
      avatar={false}
    >
      <SearchBar
        value={query}
        onChangeText={setQuery}
        onSubmit={search}
        placeholder="Buscar anime, género, usuario..."
      />
      <Section
        title="Explorar por género"
        action={showAllGenres ? 'Ver menos' : 'Ver todos'}
        onPress={() => setShowAllGenres((visible) => !visible)}
      />
      {showAllGenres ? (
        <View style={styles.genreGrid}>{genreCards}</View>
      ) : (
        <ScrollView
          horizontal
          style={{ flexGrow: 0 }}
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.row}
        >
          {genreCards}
        </ScrollView>
      )}
      <View style={styles.mapCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Mapa anime mundial</Text>
          <Text style={styles.new}>NUEVO</Text>
        </View>
        <Text style={styles.description}>Explorá estadísticas y tendencias de anime por país.</Text>
        <WorldMap
          onSelect={(id) => router.push({ pathname: '/explorar/mapa', params: { pais: id } })}
        />
        <Action
          label="Explorar mapa"
          icon="location-outline"
          primary
          onPress={() => router.push('/explorar/mapa')}
        />
      </View>
      <Section
        title="Tendencias globales"
        action="Ver más"
        onPress={() => router.push('/explorar/tops')}
      />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.row}
      >
        {trending.map((item, index) => (
          <AnimeCard key={item.id} item={item} width={trendWidth} rank={index + 1} unframed />
        ))}
      </ScrollView>
      <Section title="Explorar por temporada" />
      <View style={styles.seasonsRow}>
        {seasons.map((season, index) => (
          <Pressable
            accessibilityRole="button"
            key={season}
            onPress={() => router.push({ pathname: '/explorar/busqueda', params: { season } })}
            style={styles.season}
          >
            <ImageBackground
              source={seasonImages[index]}
              style={styles.seasonImage}
              imageStyle={styles.imageRadius}
            >
              <View style={styles.seasonShade}>
                <Text style={styles.seasonText}>{season.replace(' ', '\n')}</Text>
                <Ionicons
                  name={
                    (['flower-outline', 'sunny-outline', 'leaf-outline', 'snow-outline'] as const)[
                      index
                    ]
                  }
                  size={20}
                  color={theme.colors.primarySoft}
                />
              </View>
            </ImageBackground>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8 },
  genreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  genre: {
    width: 68,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  genreImage: { height: 90 },
  imageRadius: { borderRadius: 9 },
  genreShade: {
    flex: 1,
    gap: 10,
    backgroundColor: 'rgba(13,13,18,0.65)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  genreText: { color: theme.colors.text, fontSize: 10 },
  mapCard: {
    marginTop: 6,
    paddingVertical: 14,
    gap: 9,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mapTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  new: {
    color: theme.colors.primarySoft,
    fontSize: 9,
    backgroundColor: theme.colors.primaryDark,
    padding: 4,
    borderRadius: 4,
  },
  description: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 17 },
  seasonsRow: { flexDirection: 'row', gap: 8 },
  season: {
    flex: 1,
    minWidth: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  seasonImage: { height: 86 },
  seasonShade: { flex: 1, gap: 10, backgroundColor: 'rgba(13,13,18,0.5)', padding: 8 },
  seasonText: { color: theme.colors.text, fontSize: 11, lineHeight: 15 },
});

export default withResources(Explorar, () => [['/explore']]);
