import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState, type ComponentProps } from 'react';
import {
  Platform,
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AnimeCard, Action, Dialog, Screen, SearchBar, Section } from '../../src/components';
import { anime, genres, seasons } from '../../src/mock';
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

export default function Explorar() {
  const [query, setQuery] = useState('');
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);
  const [notice, setNotice] = useState('');
  const selectImage = async (source: 'gallery' | 'camera') => {
    if (pickingImage) return;
    setPickingImage(true);
    try {
      if (source === 'camera' && Platform.OS !== 'web') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setNotice(
            permission.canAskAgain
              ? 'Necesitamos permiso para usar la cámara. Podés volver a intentarlo.'
              : 'Activá el permiso de cámara desde los ajustes del teléfono.',
          );
          return;
        }
      }
      // El selector del sistema permite elegir una foto sin acceso a toda la fototeca.
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) setImageUri(result.assets[0].uri);
    } catch {
      setNotice('No pudimos abrir la cámara o la galería. Volvé a intentarlo.');
    } finally {
      setPickingImage(false);
    }
  };
  // TODO BACKEND [RECONOCER-ANIME]: enviar la imagen al servicio de reconocimiento y mostrar coincidencias reales.
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  // TODO BACKEND [EXPLORAR]: consultar tendencias, géneros y temporadas; por ahora catálogo local.
  const trendWidth = Math.max(82, Math.min(110, (width - 56) / 4));
  const genreLabels = showAllGenres ? genres : genres.slice(0, 4);
  const search = () => router.push({ pathname: '/busqueda', params: { q: query } });
  const genreCards = genreLabels.map((genre, index) => (
    <Pressable
      accessibilityRole="button"
      key={genre}
      onPress={() => router.push({ pathname: '/busqueda', params: { genre } })}
      style={styles.genre}
    >
      <ImageBackground
        source={anime[[1, 7, 0, 7, 4, 5, 2][index]].image}
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
        <WorldMap onSelect={(id) => router.push({ pathname: '/mapa', params: { pais: id } })} />
        <Action
          label="Explorar mapa"
          icon="location-outline"
          primary
          onPress={() => router.push('/mapa')}
        />
      </View>
      <View style={styles.recognitionCard}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Reconocer anime</Text>
          <Text style={styles.new}>DEMO</Text>
        </View>
        <Text style={styles.description}>
          Elegí una imagen o sacá una foto. El reconocimiento estará disponible más adelante.
        </Text>
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.selectedImage}
            resizeMode="contain"
            accessibilityLabel="Imagen seleccionada"
          />
        ) : (
          <View style={styles.recognitionPreview}>
            <Ionicons name="scan-outline" size={38} color={theme.colors.primarySoft} />
            <Text style={styles.previewTitle}>Elegí una imagen para analizar</Text>
            <Text style={styles.previewText}>Desde tu cámara o galería</Text>
          </View>
        )}
        {imageUri ? (
          <View style={styles.recognitionActions}>
            <View style={styles.actionItem}>
              <Action
                label="Reconocer anime"
                icon="scan-outline"
                primary
                onPress={() =>
                  setNotice(
                    'El reconocimiento todavía no está disponible. Esta función se conectará en una próxima etapa.',
                  )
                }
              />
            </View>
            <View style={styles.actionItem}>
              <Action label="Probar otra" onPress={() => setImageUri(null)} />
            </View>
          </View>
        ) : (
          <View style={styles.recognitionActions}>
            <View style={styles.actionItem}>
              <Action
                label="Elegir imagen"
                icon="image-outline"
                primary
                disabled={pickingImage}
                onPress={() => selectImage('gallery')}
              />
            </View>
            <View style={styles.actionItem}>
              <Action
                label="Sacar foto"
                icon="camera-outline"
                disabled={pickingImage}
                onPress={() => selectImage('camera')}
              />
            </View>
          </View>
        )}
      </View>
      <Section title="Tendencias globales" action="Ver más" onPress={() => router.push('/tops')} />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.row}
      >
        {[anime[0], anime[1], anime[2], anime[5]].map((item, index) => (
          <AnimeCard key={item.id} item={item} width={trendWidth} rank={index + 1} />
        ))}
      </ScrollView>
      <Section title="Explorar por temporada" />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.row}
      >
        {seasons.map((season, index) => (
          <Pressable
            accessibilityRole="button"
            key={season}
            onPress={() => router.push({ pathname: '/busqueda', params: { season } })}
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
      </ScrollView>
      <Dialog
        visible={notice !== ''}
        title="Reconocer anime"
        text={notice}
        onClose={() => setNotice('')}
      />
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
    padding: 14,
    gap: 9,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
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
  recognitionCard: {
    padding: 14,
    gap: 11,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  recognitionPreview: {
    minHeight: 135,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  previewTitle: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  previewText: { color: theme.colors.textSecondary, fontSize: 10 },
  recognitionActions: { flexDirection: 'row', gap: 8 },
  actionItem: { flex: 1 },
  selectedImage: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
  },
  season: {
    width: 83,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  seasonImage: { height: 86 },
  seasonShade: { flex: 1, gap: 10, backgroundColor: 'rgba(13,13,18,0.5)', padding: 8 },
  seasonText: { color: theme.colors.text, fontSize: 11, lineHeight: 15 },
});
