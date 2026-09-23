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
import {
  currentFriendIds,
  currentLibrary,
  currentUser,
  findAnime,
  findUser,
  getParam,
  lists,
  reviews,
} from '../../src/mock';
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
const characters: Record<string, string[]> = {
  frieren: ['Frieren', 'Fern', 'Stark'],
  'solo-leveling': ['Sung Jinwoo', 'Cha Hae-in', 'Yoo Jinho'],
  'blue-lock': ['Yoichi Isagi', 'Meguru Bachira', 'Rin Itoshi'],
  'vinland-saga': ['Thorfinn', 'Askeladd', 'Canute'],
  'mob-psycho': ['Shigeo Kageyama', 'Arataka Reigen', 'Ritsu Kageyama'],
  haikyuu: ['Shoyo Hinata', 'Tobio Kageyama', 'Daichi Sawamura'],
  'demon-slayer': ['Tanjiro Kamado', 'Nezuko Kamado', 'Zenitsu Agatsuma'],
  'spy-family': ['Loid Forger', 'Anya Forger', 'Yor Forger'],
};

export default function DetalleAnime() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const id = getParam(params.id) ?? '';
  const [score, setScore] = useState(
    (reviews.find((review) => review.animeId === id && review.userId === currentUser.id)?.rating ??
      0) / 2,
  );
  const [watchlist, setWatchlist] = useState(currentLibrary.Watchlist.includes(id));
  const [seen, setSeen] = useState(currentLibrary.Vistos.includes(id));
  const [favorite, setFavorite] = useState(currentUser.favorites.includes(id));
  const [message, setMessage] = useState('');
  const [listPicker, setListPicker] = useState(false);
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
  const votes = 13700;
  const rating = item.rating / 2;
  const cast = characters[item.id];

  // TODO BACKEND [PUNTUACION-GUARDAR]: guardar animeId y puntuación; hoy solo cambia el selector local.
  const rate = (value: number) => setScore(value);
  // TODO BACKEND [COLECCION-ACTUALIZAR]: guardar pertenencia del usuario al animeId; estados locales de ejemplo.
  const toggleCollection = (collection: 'watchlist' | 'seen' | 'favorite') => {
    if (collection === 'watchlist') setWatchlist(!watchlist);
    if (collection === 'seen') setSeen(!seen);
    if (collection === 'favorite') setFavorite(!favorite);
  };
  // TODO BACKEND [LISTA-AGREGAR]: enviar listaId y animeId y confirmar la respuesta real.
  const addToList = (listId: string) => {
    const list = lists.find((entry) => entry.id === listId);
    if (!list) return;
    setListPicker(false);
    setMessage(`Agregado a «${list.title}» en esta vista previa. Simulación local.`);
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
            onPress={() => setListPicker(true)}
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
          <Text style={styles.title}>
            {item.id === 'frieren' ? 'Frieren: Beyond Journey’s End' : item.title}
          </Text>
          <Text style={styles.japanese}>{item.japanese}</Text>
          <View style={styles.metadata}>
            {[
              'TV',
              String(item.year),
              `${item.episodes} eps`,
              `${item.duration} min`,
              'Finalizado',
            ].map((tag) => (
              <Text key={tag} style={styles.tag}>
                {tag}
              </Text>
            ))}
          </View>
          <Text style={styles.generalScore}>
            {rating.toFixed(1)}
            <Text style={styles.small}> / 5</Text> <Text style={styles.stars}>★★★★★</Text>
          </Text>
          <Text style={styles.meta}>{votes.toLocaleString('es-AR')} votos de ejemplo</Text>
          <View style={styles.distribution}>
            {distribution.map((percent, index) => (
              <View key={index} style={styles.barRow}>
                <Text style={styles.barLabel}>{5 - index} ★</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.barCount}>
                  {Math.round((votes * percent) / 100).toLocaleString('es-AR')}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.scoreHeader}>
        <Text style={styles.body}>Tu puntuación</Text>
        <Text style={styles.meta}>
          {score ? `${score.toFixed(1)} / 5 · local` : 'Tocá para calificar'}
        </Text>
      </View>
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.scoreRow}
      >
        {Array.from({ length: 10 }, (_, index) => (index + 1) / 2).map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`Puntuar ${value} de 5`}
            accessibilityState={{ selected: score === value }}
            onPress={() => rate(value)}
            style={styles.scoreButton}
          >
            <Ionicons
              name={score >= value ? 'star' : 'star-outline'}
              size={21}
              color={theme.colors.primarySoft}
            />
            <Text style={styles.meta}>{value.toFixed(1)}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.actions}>
        <Action
          label="Escribir review"
          icon="star"
          primary
          onPress={() =>
            router.push({ pathname: '/review/escribir', params: { animeId: item.id } })
          }
        />
        <Action
          label="Watchlist"
          icon={watchlist ? 'bookmark' : 'bookmark-outline'}
          active={watchlist}
          onPress={() => toggleCollection('watchlist')}
        />
        <Action
          label="Visto"
          icon="checkmark"
          active={seen}
          onPress={() => toggleCollection('seen')}
        />
        <Action
          label="Favorito"
          icon={favorite ? 'heart' : 'heart-outline'}
          active={favorite}
          onPress={() => toggleCollection('favorite')}
        />
        <Action label="Agregar a lista" icon="add-outline" onPress={() => setListPicker(true)} />
      </View>
      <Section title="Dónde verlo legalmente" />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.platforms}
      >
        {[
          {
            name: 'Crunchyroll',
            url: 'https://www.crunchyroll.com/',
            icon: 'play-circle-outline' as const,
          },
          { name: 'Netflix', url: 'https://www.netflix.com/', icon: 'film-outline' as const },
          { name: 'Prime Video', url: 'https://www.primevideo.com/', icon: 'tv-outline' as const },
        ].map((platform) => (
          <Pressable
            key={platform.name}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${platform.name}`}
            onPress={() =>
              Linking.openURL(platform.url).catch(() =>
                setMessage('No se pudo abrir el enlace. Probá desde tu navegador.'),
              )
            }
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
          {[
            ['Géneros', item.genres.join(', ')],
            ['Estudio', item.studio],
            ['Temporada', item.season],
            ['Duración', `${item.duration} min / episodio`],
            ['Episodios', String(item.episodes)],
            ['Estado', 'Finalizado'],
          ].map(([label, value]) => (
            <View key={label} style={styles.infoLine}>
              <Text style={styles.meta}>{label}</Text>
              <Text style={styles.infoValue}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
      <Section title="Personajes principales" />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.platforms}
      >
        {cast.map((name, index) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            onPress={() =>
              setMessage(
                `${name} · personaje de ${item.title}. Esta ficha breve es una vista previa; imagen ilustrativa del anime.`,
              )
            }
            style={styles.character}
          >
            <Image source={item.image} style={styles.characterImage} />
            <Text style={styles.body}>{name}</Text>
            <Text style={styles.meta}>{index === 0 ? 'Protagonista' : 'Personaje principal'}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Section title="Actores de voz" />
      <View style={styles.infoCard}>
        {cast.map((name, index) => (
          <Pressable
            key={name}
            accessibilityRole="button"
            onPress={() =>
              setMessage(
                `Ficha de voz para ${name}. El elenco definitivo se reemplazará al conectar los datos del anime.`,
              )
            }
            style={styles.voice}
          >
            <Ionicons name="mic-outline" size={20} color={theme.colors.primarySoft} />
            <View style={styles.flex}>
              <Text style={styles.body}>Actor de voz {index + 1} · ejemplo</Text>
              <Text style={styles.meta}>{name} · Japonés</Text>
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
                <Text style={styles.friendScore}>★ {((review.rating ?? 0) / 2).toFixed(1)}</Text>
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
                <Text style={styles.friendScore}>★ {((review.rating ?? 0) / 2).toFixed(1)}</Text>
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
          onPress={() =>
            router.push({ pathname: '/review/escribir', params: { animeId: item.id } })
          }
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
        visible={listPicker}
        title="Agregar a una lista"
        text="Elegí una de tus colecciones de ejemplo."
        onClose={() => setListPicker(false)}
      >
        {lists
          .filter((list) => list.userId === currentUser.id)
          .map((list) => (
            <Action key={list.id} label={list.title} onPress={() => addToList(list.id)} />
          ))}
        <Action
          label="Crear una lista"
          icon="add"
          onPress={() => {
            setListPicker(false);
            router.push({ pathname: '/lista/editar', params: { animeId: item.id } });
          }}
        />
      </Dialog>
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
  scoreHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  scoreRow: { gap: 10 },
  scoreButton: { alignItems: 'center', gap: 3, minWidth: 24, paddingVertical: 5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
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
  character: { width: 108, gap: 6 },
  characterImage: { width: 108, height: 86, borderRadius: 10 },
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
