import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Action, Avatar, Dialog, EmptyState, Screen, Section } from '../../src/components';
import { currentFriendIds, findAnime, findUser, getParam, reviews } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [RATINGS-DISTRIBUCION]: recuperar conteos reales por anime; estos porcentajes son ejemplos.
const distributions: Record<string, number[]> = {
  frieren: [86, 10, 2, 1, 1],
  'solo-leveling': [80, 15, 2, 2, 1],
  'blue-lock': [72, 20, 5, 2, 1],
  'vinland-saga': [65, 22, 8, 3, 2],
  'mob-psycho': [62, 24, 8, 4, 2],
  haikyuu: [60, 25, 7, 6, 2],
  'demon-slayer': [58, 25, 9, 5, 3],
  'spy-family': [54, 28, 9, 7, 2],
};
const voiceCast: Record<string, { actor: string; character: string }[]> = {
  frieren: [
    { actor: 'Atsumi Tanezaki', character: 'Frieren' },
    { actor: 'Kana Ichinose', character: 'Fern' },
    { actor: 'Chiaki Kobayashi', character: 'Stark' },
  ],
  'solo-leveling': [
    { actor: 'Taito Ban', character: 'Sung Jinwoo' },
    { actor: 'Reina Ueda', character: 'Cha Hae-in' },
    { actor: 'Genta Nakamura', character: 'Yoo Jinho' },
  ],
  'blue-lock': [
    { actor: 'Kazuki Ura', character: 'Yoichi Isagi' },
    { actor: 'Tasuku Kaito', character: 'Meguru Bachira' },
    { actor: 'Koki Uchiyama', character: 'Rin Itoshi' },
  ],
  'vinland-saga': [
    { actor: 'Yuto Uemura', character: 'Thorfinn' },
    { actor: 'Naoya Uchida', character: 'Askeladd' },
    { actor: 'Kensho Ono', character: 'Canute' },
  ],
  'mob-psycho': [
    { actor: 'Setsuo Ito', character: 'Shigeo Kageyama' },
    { actor: 'Takahiro Sakurai', character: 'Arataka Reigen' },
    { actor: 'Miyu Irino', character: 'Ritsu Kageyama' },
  ],
  haikyuu: [
    { actor: 'Ayumu Murase', character: 'Shoyo Hinata' },
    { actor: 'Kaito Ishikawa', character: 'Tobio Kageyama' },
    { actor: 'Satoshi Hino', character: 'Daichi Sawamura' },
  ],
  'demon-slayer': [
    { actor: 'Natsuki Hanae', character: 'Tanjiro Kamado' },
    { actor: 'Akari Kito', character: 'Nezuko Kamado' },
    { actor: 'Hiro Shimono', character: 'Zenitsu Agatsuma' },
  ],
  'spy-family': [
    { actor: 'Takuya Eguchi', character: 'Loid Forger' },
    { actor: 'Atsumi Tanezaki', character: 'Anya Forger' },
    { actor: 'Saori Hayami', character: 'Yor Forger' },
  ],
};
const ratingVotes = 13700;
const streamingPlatforms = [
  {
    name: 'Crunchyroll',
    url: 'https://www.crunchyroll.com/',
    icon: 'play-circle-outline' as const,
  },
  { name: 'Netflix', url: 'https://www.netflix.com/', icon: 'film-outline' as const },
  { name: 'Prime Video', url: 'https://www.primevideo.com/', icon: 'tv-outline' as const },
];

export default function DetalleAnime() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const id = getParam(params.id) ?? '';
  const [message, setMessage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  // TODO BACKEND [ANIME-DETALLE]: consultar anime y su elenco por id; manejar carga, error y no encontrado.
  const item = findAnime(id);
  if (!item)
    return (
      <Screen title="Anime no encontrado" back>
        <EmptyState
          title="Este anime no está disponible"
          text="Volvé al catálogo para elegir otro anime."
          action="Explorar"
          onPress={() => router.replace('/explorar')}
        />
      </Screen>
    );
  const friendReviews = reviews.filter(
    (review) => review.animeId === item.id && currentFriendIds.includes(review.userId),
  );
  const animeReviews = reviews.filter((review) => review.animeId === item.id);
  const distribution = distributions[item.id];
  const rating = item.rating;
  const cast = voiceCast[item.id] ?? [];
  const title = item.id === 'frieren' ? 'Frieren: Beyond Journey’s End' : item.title;
  const metadata = [
    'TV',
    String(item.year),
    `${item.episodes} eps`,
    `${item.duration} min`,
    'Finalizado',
  ];
  const infoRows = [
    ['Géneros', item.genres.join(', ')],
    ['Estudio', item.studio],
    ['Temporada', item.season],
    ['Duración', `${item.duration} min / episodio`],
    ['Episodios', String(item.episodes)],
    ['Estado', 'Finalizado'],
  ];

  const writeReview = () =>
    router.push({ pathname: '/review/escribir', params: { animeId: item.id } });
  const openStreamingPlatform = (url: string) => {
    Linking.openURL(url).catch(() =>
      setMessage('No se pudo abrir el enlace. Probá desde tu navegador.'),
    );
  };

  return (
    <Screen
      title=""
      back
      actions={
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir anime"
            onPress={() =>
              setMessage(
                `Enlace de ejemplo para compartir ${item.title}. La acción no envía mensajes.`,
              )
            }
          >
            <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Opciones del anime"
            onPress={writeReview}
          >
            <Ionicons name="ellipsis-horizontal" size={23} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      }
    >
      <View style={styles.hero}>
        <View style={[styles.posterWrap, { width: (width - 44) * 0.39 }]}>
          {imageFailed ? (
            <View style={styles.fallback}>
              <Ionicons name="image-outline" size={30} color={theme.colors.primarySoft} />
              <Text style={styles.meta}>Poster no disponible</Text>
            </View>
          ) : (
            <Image source={item.image} onError={() => setImageFailed(true)} style={styles.poster} />
          )}
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.japanese}>{item.japanese}</Text>
          <View style={styles.metadata}>
            {metadata.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
          <Text style={styles.generalScore}>
            {rating.toFixed(1)}
            <Text style={styles.small}> / 5</Text> <Text style={styles.stars}>★★★★★</Text>
          </Text>
          <Text style={styles.meta}>{ratingVotes.toLocaleString('es-AR')} votos de ejemplo</Text>
          <View style={styles.distribution}>
            {distribution.map((percent, index) => (
              <View key={index} style={styles.barRow}>
                <Text style={styles.barLabel}>{5 - index} ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.barCount}>
                  {Math.round((ratingVotes * percent) / 100).toLocaleString('es-AR')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <Action label="Review" icon="add-circle-outline" primary onPress={writeReview} />
      <Section title="Dónde ver" />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.platforms}
      >
        {streamingPlatforms.map((platform) => (
          <Pressable
            key={platform.name}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${platform.name}`}
            onPress={() => openStreamingPlatform(platform.url)}
            style={styles.platform}
          >
            <Ionicons name={platform.icon} size={25} color={theme.colors.accentSoft} />
            <View>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.meta}>Visitar sitio</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.note}>Plataformas de ejemplo; verificá disponibilidad en tu país.</Text>
      <View style={[styles.infoColumns, width < 360 && styles.stack]}>
        <View style={[styles.infoCard, width >= 360 && styles.infoColumn]}>
          <Text style={styles.cardTitle}>Sinopsis</Text>
          <Text style={styles.synopsis}>{item.synopsis}</Text>
        </View>
        <View style={[styles.infoCard, width >= 360 && styles.infoColumn]}>
          <Text style={styles.cardTitle}>Información</Text>
          {infoRows.map(([label, value]) => (
            <View key={label} style={styles.infoLine}>
              <Text style={styles.meta}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <Section title="Actores de voz" />
      <View style={styles.infoCard}>
        {cast.map(({ actor, character }) => (
          <Pressable
            key={character}
            accessibilityRole="button"
            onPress={() =>
              setMessage(
                `${actor} interpreta a ${character} en la versión japonesa de ${item.title}.`,
              )
            }
            style={styles.voice}
          >
            <Ionicons name="mic-outline" size={20} color={theme.colors.primarySoft} />
            <View style={styles.flex}>
              <Text style={styles.body}>{character}</Text>
              <Text style={styles.meta}>{actor} · Japonés</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </Pressable>
        ))}
      </View>
      <Section title="Puntuaciones de amigos" />
      {friendReviews.length ? (
        <ScrollView
          horizontal
          style={{ flexGrow: 0 }}
          showsHorizontalScrollIndicator={Platform.OS === 'web'}
          contentContainerStyle={styles.platforms}
        >
          {friendReviews.map((review) => {
            const author = findUser(review.userId);
            if (!author) return null;
            return (
              <View key={review.id} style={styles.friend}>
                <Avatar
                  user={author}
                  size={44}
                  onPress={() =>
                    router.push({ pathname: '/usuario/[id]', params: { id: author.id } })
                  }
                />
                <Text style={styles.meta}>{author.name}</Text>
                <Text style={styles.friendScore}>★ {(review.rating ?? 0).toFixed(1)}</Text>
              </View>
            );
          })}
        </ScrollView>
      ) : (
        <Text style={styles.note}>
          Tus amigos todavía no puntuaron este anime en los datos de ejemplo.
        </Text>
      )}
      <Section
        title="Reviews destacadas"
        action="Ver amigos"
        onPress={() => router.push('/comunidad')}
      />
      {animeReviews.length ? (
        animeReviews.map((review) => {
          const author = findUser(review.userId);
          if (!author) return null;
          return (
            <Pressable
              key={review.id}
              accessibilityRole="button"
              accessibilityLabel={`Leer review de ${author.name}`}
              onPress={() => router.push({ pathname: '/review/[id]', params: { id: review.id } })}
              style={styles.infoCard}
            >
              <View style={styles.reviewHeader}>
                <Avatar user={author} size={30} />
                <View style={styles.flex}>
                  <Text style={styles.username}>{author.name}</Text>
                  <Text style={styles.meta}>{review.time}</Text>
                </View>
                <Text style={styles.friendScore}>★ {(review.rating ?? 0).toFixed(1)}</Text>
              </View>
              <Text numberOfLines={3} style={styles.synopsis}>
                {review.spoiler ? 'Esta review contiene spoilers. Tocá para verla.' : review.text}
              </Text>
              <Text style={styles.meta}>
                ♡ {review.likes} · {review.comments} comentarios
              </Text>
            </Pressable>
          );
        })
      ) : (
        <EmptyState
          title="La primera review puede ser tuya"
          text="Contanos qué te pareció este anime."
          action="Escribir review"
          onPress={writeReview}
        />
      )}
      <Section title="Noticias y novedades" />
      <Pressable
        accessibilityRole="button"
        onPress={() =>
          setMessage(
            `Una mirada a ${item.title}: contenido editorial de ejemplo para validar esta sección.`,
          )
        }
        style={styles.news}
      >
        <Image source={item.image} style={styles.newsImage} />
        <View style={styles.flex}>
          <Text style={styles.username}>NOVEDAD · EJEMPLO</Text>
          <Text style={styles.body}>Volvé a descubrir el mundo de {item.title}</Text>
          <Text style={styles.meta}>Historias, personajes y momentos favoritos.</Text>
        </View>
      </Pressable>
      <Action
        label="Popularidad por país"
        icon="earth-outline"
        onPress={() =>
          router.push({ pathname: '/mapa', params: { metric: 'anime', animeId: item.id } })
        }
      />
      <Dialog
        visible={message.length > 0}
        title="Vista previa"
        text={message}
        onClose={() => setMessage('')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', gap: 18, padding: 6 },
  hero: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  posterWrap: {
    aspectRatio: 0.68,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.surfaceLight,
  },
  poster: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  heroInfo: { flex: 1, minWidth: 0, gap: 7 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '700', lineHeight: 22 },
  japanese: { color: theme.colors.textSecondary, fontSize: 11 },
  metadata: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    padding: 3,
  },
  generalScore: { color: theme.colors.primarySoft, fontWeight: '600', fontSize: 22 },
  small: { fontSize: 12, color: theme.colors.textSecondary },
  stars: { fontSize: 13 },
  meta: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 15 },
  distribution: { gap: 4, marginTop: 2 },
  barRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  barLabel: { width: 23, color: theme.colors.textSecondary, fontSize: 9 },
  barTrack: { flex: 1, height: 4, backgroundColor: theme.colors.surfaceLight, borderRadius: 3 },
  bar: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 3 },
  barCount: { width: 34, color: theme.colors.textSecondary, fontSize: 8, textAlign: 'right' },
  platforms: { gap: 10 },
  platform: {
    backgroundColor: theme.colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
  },
  platformName: { color: theme.colors.text, fontSize: 11 },
  note: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  infoColumns: { flexDirection: 'row', gap: 10 },
  stack: { flexDirection: 'column' },
  infoColumn: { flexGrow: 1, flexBasis: 0 },
  infoCard: {
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    gap: 9,
  },
  cardTitle: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  synopsis: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  infoLine: { gap: 2 },
  infoValue: { color: theme.colors.text, fontSize: 11, lineHeight: 16 },
  body: { color: theme.colors.text, fontSize: 12, lineHeight: 18 },
  voice: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 6 },
  flex: { flex: 1, minWidth: 0 },
  friend: { alignItems: 'center', gap: 4, width: 70 },
  friendScore: { color: theme.colors.primarySoft, fontSize: 12 },
  reviewHeader: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  username: { color: theme.colors.primarySoft, fontSize: 11, fontWeight: '600' },
  news: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 10,
  },
  newsImage: { width: 74, height: 74, borderRadius: 8 },
});
