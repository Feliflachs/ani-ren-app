import { useViewingCountry, viewingCountries } from '../../../src/location/useViewingCountry';
import { SvgUri } from 'react-native-svg';
import { useQuery, usePage } from '../../../src/context/RemoteContext';
import { QueryFooter, withResources } from '../../../src/remote-ui';
import { adaptPublication, type Wire } from '../../../src/api/remote';
import { useDirectory } from '../../../src/useDirectory';
import { useLists } from '../../../src/context/ListsContext';
import { usePublications } from '../../../src/context/PublicationsContext';
import { useCurrentUser } from '../../../src/useCurrentUser';
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
import {
  PublicationCard,
  Action,
  Avatar,
  Dialog,
  EmptyState,
  Screen,
  Section,
  SearchBar,
} from '../../../src/components';
import { useAppState } from '../../../src/context/AppState';
import { findAnime, getParam } from '../../../src/data';
import { theme } from '../../../src/theme';

function DetalleAnime() {
  const { findUser } = useDirectory();
  const { lists, toggleAnime } = useLists();
  const { reviews } = usePublications();

  const currentUser = useCurrentUser();

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const id = getParam(params.id) ?? '';
  const [message, setMessage] = useState('');
  const country = useViewingCountry();
  const [countryPicker, setCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [credits, setCredits] = useState(false);
  const streaming = useQuery(country.loading ? undefined : `/anime/${id}/streaming`, {
    country: country.code ?? undefined,
  });
  const [expandedSynopsisId, setExpandedSynopsisId] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [listPicker, setListPicker] = useState(false);
  const { friendIds, getActivity, updateActivity } = useAppState();
  const activity = getActivity(id);
  const detail = useQuery(`/anime/${id}`);
  const extras = usePage(`/anime/${id}/extras`, { page: 1 }, 'characters');
  const reviewPage = usePage('/publications', { animeId: id, kind: 'review' });
  const statistics = detail.data?.anime?.statistics;
  const ratingVotes = statistics?.ratingUserCount ?? 0;
  const streamingPlatforms: {
    id: string;
    name: string;
    url: string;
    offer: string;
    icon: 'play-circle-outline';
  }[] = (streaming.data?.links ?? []).map((link: Wire) => ({
    id: link.id,
    name: link.site,
    url: link.url,
    offer: link.offer,
    icon: 'play-circle-outline' as const,
  }));
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
        <QueryFooter query={reviewPage} />
        <QueryFooter query={extras} />
      </Screen>
    );
  const friendReviews = reviews.filter(
    (review) => review.animeId === item.id && friendIds.includes(review.userId),
  );
  const animeReviews = reviewPage.items.map(adaptPublication);
  const distribution: number[] = statistics?.distributionBands?.map(
    (row: Wire) => row.percentage,
  ) ?? [0, 0, 0, 0, 0];
  const rating = item.rating;
  const cast: { actor: string; character: string }[] = extras.items.flatMap((row: Wire) =>
    (row.voiceActors ?? []).map((actor: Wire) => ({
      actor: actor.name,
      character: row.character.name,
    })),
  );
  const synopsis = item.synopsis.trim();
  const synopsisIsLong = synopsis.length > 300;
  const synopsisExpanded = expandedSynopsisId === id;
  const synopsisPreview = synopsis
    .slice(0, 300)
    .replace(/\s+\S*$/, '')
    .trimEnd();
  const title = item.title;
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
    router.push({ pathname: '/crear/review/escribir', params: { animeId: item.id } });
  const ownLists = lists.filter((list) => list.userId === currentUser.id);
  const toggleList = (listId: string) => toggleAnime(currentUser.id, listId, item.id);
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
            <Ionicons name="share-social-outline" size={22} color={theme.colors.textSecondary} />
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
          <Text style={styles.meta}>
            {ratingVotes.toLocaleString('es-AR')} votos ·{' '}
            {(statistics?.watched ?? item.watched).toLocaleString('es-AR')} vistos
          </Text>
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
      <View style={styles.activityActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activity.watched ? 'Quitar de vistos' : 'Marcar como visto'}
          accessibilityState={{ selected: activity.watched }}
          onPress={() => updateActivity(item.id, { watched: !activity.watched })}
          style={styles.activityButton}
        >
          <Ionicons
            name={activity.watched ? 'eye' : 'eye-outline'}
            size={23}
            color={activity.watched ? theme.colors.primarySoft : theme.colors.textSecondary}
          />
          <Text style={[styles.activityLabel, activity.watched && styles.activityLabelActive]}>
            Visto
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activity.liked ? 'Quitar Me gusta' : 'Marcar Me gusta'}
          accessibilityState={{ selected: activity.liked }}
          onPress={() => updateActivity(item.id, { liked: !activity.liked })}
          style={styles.activityButton}
        >
          <Ionicons
            name={activity.liked ? 'heart' : 'heart-outline'}
            size={23}
            color={activity.liked ? theme.colors.accentSoft : theme.colors.textSecondary}
          />
          <Text style={[styles.activityLabel, activity.liked && styles.activityLabelLiked]}>
            Me gusta
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activity.watchlist ? 'Quitar de Watchlist' : 'Guardar en Watchlist'}
          accessibilityState={{ selected: activity.watchlist }}
          onPress={() => updateActivity(item.id, { watchlist: !activity.watchlist })}
          style={styles.activityButton}
        >
          <Ionicons
            name={activity.watchlist ? 'bookmark' : 'bookmark-outline'}
            size={23}
            color={activity.watchlist ? theme.colors.primarySoft : theme.colors.textSecondary}
          />
          <Text style={[styles.activityLabel, activity.watchlist && styles.activityLabelActive]}>
            Watchlist
          </Text>
        </Pressable>
      </View>
      <Action
        label={
          activity.listIds.length
            ? `Agregar a lista · ${activity.listIds.length}`
            : 'Agregar a lista'
        }
        icon="albums-outline"
        onPress={() => setListPicker(true)}
      />
      <Action label="Review" icon="add-circle-outline" primary onPress={writeReview} />
      <Section title="Dónde ver" />
      <Action
        label={
          country.loading
            ? 'Detectando país…'
            : country.name
              ? 'País: ' + country.name
              : 'Elegir país'
        }
        icon="location-outline"
        onPress={() => setCountryPicker(true)}
      />
      {!!country.message && <Text style={styles.note}>{country.message}</Text>}
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.platforms}
      >
        {streamingPlatforms.map((platform) => (
          <Pressable
            key={platform.id}
            accessibilityRole="link"
            accessibilityLabel={`Abrir ${platform.name}`}
            onPress={() => openStreamingPlatform(platform.url)}
            style={styles.platform}
          >
            <Ionicons name={platform.icon} size={25} color={theme.colors.accentSoft} />
            <View>
              <Text style={styles.platformName}>{platform.name}</Text>
              <Text style={styles.meta}>
                {platform.offer} ·{' '}
                {streaming.data?.source === 'tmdb' ? 'Ver opciones' : 'Visitar sitio'}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <QueryFooter query={streaming} />
      {streaming.data?.status !== 'regional' && !!streaming.data?.message && (
        <Text style={styles.note}>{streaming.data.message}</Text>
      )}
      {streaming.data?.status === 'unavailable' && (
        <Action label="Reintentar opciones" onPress={streaming.reload} />
      )}
      <Pressable accessibilityRole="button" onPress={() => setCredits(true)}>
        <Text style={styles.note}>Créditos</Text>
      </Pressable>
      <View style={[styles.infoColumns, width < 360 && styles.stack]}>
        <View style={[styles.infoCard, width >= 360 && styles.infoColumn]}>
          <Text style={styles.cardTitle}>Sinopsis</Text>
          {item.synopsisEs === null && !!synopsis && (
            <Text style={styles.note}>
              Sin versión en castellano disponible. Se muestra el texto original.
            </Text>
          )}
          {synopsisIsLong ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={synopsisExpanded ? 'Contraer sinopsis' : 'Expandir sinopsis'}
              accessibilityState={{ expanded: synopsisExpanded }}
              onPress={() => setExpandedSynopsisId(synopsisExpanded ? null : id)}
            >
              <Text style={styles.synopsis}>
                {synopsisExpanded ? synopsis : synopsisPreview + '…'}
                <Text style={{ color: theme.colors.primarySoft }}>
                  {synopsisExpanded ? ' Ver menos' : ' Ver más'}
                </Text>
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.synopsis}>{synopsis}</Text>
          )}
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
                    router.push({ pathname: '/perfil/usuario/[id]', params: { id: author.id } })
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
          No hay puntuaciones de tus amigos entre las reviews cargadas.
        </Text>
      )}
      <Section
        title="Reviews destacadas"
        action="Ver amigos"
        onPress={() => router.push('/perfil/comunidad')}
      />
      {animeReviews.length ? (
        animeReviews.map((review) => <PublicationCard key={review.id} review={review} />)
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
        onPress={() => setMessage('Esta sección todavía no tiene una fuente editorial conectada.')}
        style={styles.news}
      >
        <Image source={item.image} style={styles.newsImage} />
        <View style={styles.flex}>
          <Text style={styles.username}>NOVEDADES</Text>
          <Text style={styles.body}>Todavía no hay noticias disponibles.</Text>
          <Text style={styles.meta}>La fuente editorial está pendiente.</Text>
        </View>
      </Pressable>
      <Action
        label="Popularidad por país"
        icon="earth-outline"
        onPress={() =>
          router.push({ pathname: '/explorar/mapa', params: { metric: 'anime', animeId: item.id } })
        }
      />
      <Dialog
        visible={countryPicker}
        title="País para ver anime"
        text="Se usa para consultar plataformas; elegirlo no registra vistas en el mapa."
        onClose={() => setCountryPicker(false)}
      >
        <Action
          label="Usar mi ubicación actual"
          icon="location-outline"
          disabled={country.loading}
          onPress={() => {
            setCountryPicker(false);
            void country.locate();
          }}
        />
        <SearchBar
          value={countrySearch}
          onChangeText={setCountrySearch}
          placeholder="Buscar país"
        />
        {viewingCountries
          .filter((item) =>
            item.name
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .toLowerCase()
              .includes(
                countrySearch
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .toLowerCase(),
              ),
          )
          .map((item) => (
            <Action
              key={item.code}
              label={item.name}
              active={item.code === country.code}
              onPress={() => {
                country.choose(item.code);
                setCountryPicker(false);
                setCountrySearch('');
              }}
            />
          ))}
      </Dialog>
      <Dialog visible={credits} title="Créditos" onClose={() => setCredits(false)}>
        <SvgUri
          width={120}
          height={20}
          uri="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg"
        />
        <Text style={styles.note}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
        <Text style={styles.note}>
          Disponibilidad proporcionada por JustWatch a través de TMDB. Los enlaces abren las
          opciones de reproducción en TMDB.
        </Text>
        <Text style={styles.note}>
          Sinopsis en castellano: TMDB. Texto original del catálogo: MyAnimeList; algunas sinopsis
          fueron redactadas por MAL Rewrite.
        </Text>
        <Action label="TMDB" onPress={() => openStreamingPlatform('https://www.themoviedb.org/')} />
        <Action
          label="JustWatch"
          onPress={() => openStreamingPlatform('https://www.justwatch.com/')}
        />
      </Dialog>
      <Dialog
        visible={listPicker}
        title="Agregar a lista"
        text="Podés elegir más de una."
        onClose={() => setListPicker(false)}
      >
        {ownLists.map((list) => (
          <Action
            key={list.id}
            label={list.title}
            icon={activity.listIds.includes(list.id) ? 'checkmark-circle' : 'ellipse-outline'}
            active={activity.listIds.includes(list.id)}
            onPress={() => toggleList(list.id)}
          />
        ))}
        <Action
          label="Crear una lista"
          icon="add-outline"
          onPress={() => {
            setListPicker(false);
            router.push({ pathname: '/perfil/listas/editar', params: { animeId: item.id } });
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
  activityActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  activityButton: {
    flex: 1,
    minHeight: 65,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
  },
  activityLabel: { color: theme.colors.textSecondary, fontSize: 10 },
  activityLabelActive: { color: theme.colors.primarySoft },
  activityLabelLiked: { color: theme.colors.accentSoft },
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

export default withResources(DetalleAnime, (p, u) => [
  [`/anime/${p.id}`],
  [`/me/anime/${p.id}/activity`],
  ['/lists', { userId: u }],
]);
