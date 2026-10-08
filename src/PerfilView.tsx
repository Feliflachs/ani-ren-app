import { useLists } from './context/ListsContext';
import { useReviews } from './context/ReviewsContext';
import { useCurrentUser } from './useCurrentUser';
import { useSession } from './context/SessionContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Avatar,
  Chips,
  Dialog,
  EmptyState,
  Progress,
  RankInsignia,
  ListCard,
  ReviewCard,
  Screen,
  Section,
} from './components';
import { useAppState, useActivities } from './context/AppState';
import { useSocial } from './context/SocialContext';
import { findAnime, getRankProgress, type User } from './mock';
import { theme } from './theme';

export function PerfilView({
  user,
  publicProfile = false,
}: {
  user: User;
  publicProfile?: boolean;
}) {
  const { lists } = useLists();
  const { reviews, getLikedIds } = useReviews();

  const currentUser = useCurrentUser();
  const { signOut } = useSession();
  const [closingSession, setClosingSession] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const currentLikedReviewIds = getLikedIds(user.id);
  const { getFriendIds } = useSocial();
  const { getCollection } = useActivities();

  const [view, setView] = useState('Reviews');
  const [historyFilter, setHistoryFilter] = useState('Todo');
  const [width, setWidth] = useState(300);
  const [sharing, setSharing] = useState(false);
  const { likedIds, watchedCount, followingIds, toggleFollowing } = useAppState();
  const isOwnProfile = user.id === currentUser.id;
  const canManage = isOwnProfile && !publicProfile;
  const following = followingIds.includes(user.id);
  const isFriend = getFriendIds(currentUser.id).includes(user.id);
  const favorites = isOwnProfile ? likedIds : user.favorites;
  const totalWatched = isOwnProfile ? watchedCount : user.watched;
  const historyIds = getCollection(user.id).watchedIds;
  const latestAnime = findAnime(historyIds[historyIds.length - 1]);
  // TODO BACKEND [PERFIL-CONSULTAR]: consultar currentUser.id, sus favoritos, actividad, reviews, listas y likes; hoy son datos compartidos de ejemplo.
  const myReviews = reviews.filter((item) => item.userId === user.id);
  const myLists = lists.filter((item) => item.userId === user.id);
  const likedReviews = reviews.filter((item) => currentLikedReviewIds.includes(item.id));
  const shownReviews = view === 'Likes' ? likedReviews : myReviews;
  const rankProgress = getRankProgress(totalWatched);
  const openConnections = (tab: string) =>
    router.push({ pathname: '/perfil/comunidad', params: { id: user.id, tab } });

  async function cerrarSesion() {
    if (closingSession) return;
    setClosingSession(true);
    setSessionError('');
    try {
      await signOut();
    } catch {
      setSessionError('No pudimos cerrar la sesión. Volvé a intentarlo.');
      setClosingSession(false);
    }
  }

  return (
    <Screen
      title={publicProfile ? (isOwnProfile ? 'Tu perfil público' : 'Perfil de usuario') : 'Perfil'}
      back={publicProfile}
      avatar={false}
      actions={
        <Pressable
          onPress={() => setSharing(true)}
          accessibilityRole="button"
          accessibilityLabel="Compartir perfil"
          hitSlop={10}
        >
          <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
        </Pressable>
      }
    >
      <View style={styles.identity}>
        <Avatar
          user={user}
          size={82}
          onPress={canManage ? () => router.push('/perfil/editar') : undefined}
        />
        <View style={styles.identityText}>
          <Text style={styles.name}>
            {user.name}
            {isOwnProfile ? '-kun' : ''}
          </Text>
          <Text style={styles.handle}>@{user.handle}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
        </View>
      </View>
      <View style={styles.bottomActions}>
        {canManage ? (
          <>
            <Action
              label="Editar perfil"
              icon="create-outline"
              onPress={() => router.push('/perfil/editar')}
            />
            <Action
              label="Amigos"
              icon="people-outline"
              onPress={() => openConnections('Amigos')}
            />
            <Action
              label={closingSession ? 'Cerrando…' : 'Cerrar sesión'}
              icon="log-out-outline"
              disabled={closingSession}
              onPress={cerrarSesion}
            />
          </>
        ) : isOwnProfile ? (
          <Action label="Ir a mi perfil" onPress={() => router.push('/perfil')} />
        ) : (
          <>
            <Action
              label={following ? 'Siguiendo' : 'Seguir'}
              active={following}
              icon={following ? 'checkmark-outline' : 'add-outline'}
              onPress={() => toggleFollowing(user.id)}
            />
            <Action
              label="Amigos"
              icon="people-outline"
              onPress={() => openConnections('Amigos')}
            />
          </>
        )}
      </View>
      {!!sessionError && (
        <Text accessibilityRole="alert" style={styles.meta}>
          {sessionError}
        </Text>
      )}
      {!isOwnProfile && isFriend && <Text style={styles.meta}>Amigos · Se siguen mutuamente.</Text>}

      <View style={styles.stats}>
        {[
          {
            label: 'Seguidores',
            value: user.followers,
            onPress: () => openConnections('Seguidores'),
          },
          {
            label: 'Siguiendo',
            value: user.following,
            onPress: () => openConnections('Siguiendo'),
          },
          { label: 'Reviews', value: user.reviews, onPress: () => setView('Reviews') },
          {
            label: 'Watchlist',
            value: user.watchlist,
            onPress: canManage
              ? () => router.push({ pathname: '/perfil/biblioteca', params: { tab: 'Watchlist' } })
              : undefined,
          },
        ].map((stat) => (
          <Pressable
            key={stat.label}
            onPress={stat.onPress}
            style={styles.stat}
            accessibilityRole={stat.onPress ? 'button' : undefined}
            disabled={!stat.onPress}
          >
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={canManage ? () => router.push('/aura') : undefined}
        disabled={!canManage}
        style={styles.rankCard}
        accessibilityRole={canManage ? 'button' : undefined}
        accessibilityLabel={canManage ? 'Ver tu rango Aura' : `Rango de ${user.name}`}
      >
        <RankInsignia rank={rankProgress.rank} size={36} />
        <View style={styles.rankBody}>
          <Text style={styles.meta}>
            Rango: <Text style={styles.purple}>{rankProgress.rank}</Text>
          </Text>
          <Progress value={totalWatched} total={rankProgress.total} label="Animes vistos" />
        </View>
        {canManage && (
          <Ionicons name="chevron-forward" color={theme.colors.primarySoft} size={16} />
        )}
      </Pressable>
      <Section
        title="Top 4 favoritos"
        onPress={
          canManage
            ? () => router.push({ pathname: '/perfil/biblioteca', params: { tab: 'Favoritos' } })
            : undefined
        }
      />
      <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {favorites.slice(0, 4).map((id, index) => {
          const item = findAnime(id);
          return item ? (
            <AnimeCard key={id} item={item} width={(width - 10) / 2} landscape rank={index + 1} />
          ) : null;
        })}
      </View>
      {canManage && (
        <View style={styles.quickLinks}>
          {['Watchlist', 'Vistos', 'Reviews', 'Listas'].map((label) => (
            <Pressable
              key={label}
              style={styles.quickLink}
              onPress={() =>
                label === 'Reviews'
                  ? setView('Reviews')
                  : router.push({ pathname: '/perfil/biblioteca', params: { tab: label } })
              }
              accessibilityRole="button"
            >
              <Ionicons
                name={
                  label === 'Watchlist'
                    ? 'bookmark-outline'
                    : label === 'Vistos'
                      ? 'eye-outline'
                      : label === 'Reviews'
                        ? 'star-outline'
                        : 'list-outline'
                }
                size={14}
                color={theme.colors.primarySoft}
              />
              <Text style={styles.quickText}>{label}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Section title="Actividad reciente" action="Ver todo" onPress={() => setView('Historial')} />
      <View style={styles.activityPanel}>
        {myReviews[0] && (
          <View style={styles.activity}>
            <Avatar user={user} size={27} />
            <Pressable
              style={styles.activityLink}
              onPress={() =>
                router.push({
                  pathname: '/inicio/review/[id]',
                  params: { id: myReviews[0].id },
                })
              }
              accessibilityRole="button"
            >
              <View style={styles.flex}>
                <Text style={styles.meta}>
                  {user.name}
                  {isOwnProfile ? '-kun' : ''} escribió una review
                </Text>
                <Text style={styles.muted}>
                  {myReviews[0].time} · {findAnime(myReviews[0].animeId)?.title ?? 'Publicación'}
                </Text>
              </View>
              {myReviews[0].rating !== undefined && (
                <Text style={styles.purple}>★ {myReviews[0].rating.toFixed(1)}</Text>
              )}
            </Pressable>
          </View>
        )}
        {latestAnime && (
          <View style={styles.activity}>
            <Avatar user={user} size={27} />
            <Pressable
              style={styles.activityLink}
              onPress={() =>
                router.push({ pathname: '/explorar/anime/[id]', params: { id: latestAnime.id } })
              }
              accessibilityRole="button"
            >
              <View style={styles.flex}>
                <Text style={styles.meta}>
                  {user.name}
                  {isOwnProfile ? '-kun' : ''} marcó como visto
                </Text>
                <Text style={styles.muted}>Actividad de ejemplo · {latestAnime.title}</Text>
              </View>
              <Ionicons name="eye-outline" color={theme.colors.primarySoft} size={18} />
            </Pressable>
          </View>
        )}
        {!myReviews.length && !latestAnime && (
          <Text style={styles.muted}>Sin actividad de ejemplo.</Text>
        )}
      </View>
      <Section title="Reviews destacadas" action="Ver todas" onPress={() => setView('Reviews')} />
      {myReviews.map((item) => (
        <ReviewCard key={item.id} review={item} />
      ))}
      <Chips
        options={['Reviews', 'Listas', 'Historial', 'Likes']}
        value={view}
        onChange={setView}
        variant="underline"
      />
      {(view === 'Reviews' || view === 'Likes') && (
        <>
          {shownReviews.map((item) => (
            <View key={item.id} style={styles.flex}>
              <ReviewCard review={item} />
              {publicProfile && isOwnProfile && item.userId === user.id && (
                <Action
                  label="Editar review"
                  onPress={() =>
                    router.push({ pathname: '/crear/review/escribir', params: { id: item.id } })
                  }
                />
              )}
            </View>
          ))}
          {shownReviews.length === 0 && (
            <EmptyState
              title="Todavía no hay actividad"
              text={
                isOwnProfile
                  ? 'Tus reviews y likes aparecerán acá.'
                  : 'Las publicaciones de este usuario aparecerán acá.'
              }
            />
          )}
        </>
      )}
      {view === 'Listas' && (
        <>
          {myLists.map((item) => (
            <ListCard key={item.id} list={item} />
          ))}
          {canManage && (
            <Action
              label="Crear lista"
              icon="add-outline"
              onPress={() => router.push('/perfil/listas/editar')}
            />
          )}
          {!myLists.length && (
            <EmptyState
              title="Sin listas públicas"
              text="Todavía no hay listas de ejemplo en este perfil."
            />
          )}
        </>
      )}
      {view === 'Historial' && (
        <>
          <Chips
            options={['Todo', 'Vistos', 'Reviews']}
            value={historyFilter}
            onChange={setHistoryFilter}
          />
          {historyFilter !== 'Vistos' &&
            myReviews.map((item) => (
              <Pressable
                key={item.id}
                style={styles.panel}
                onPress={() =>
                  router.push({ pathname: '/inicio/review/[id]', params: { id: item.id } })
                }
                accessibilityRole="button"
              >
                <Text style={styles.rowTitle}>
                  {isOwnProfile ? 'Escribiste' : `${user.name} escribió`}{' '}
                  {item.animeId
                    ? `una review de ${findAnime(item.animeId)?.title}`
                    : 'una publicación'}
                </Text>
                <Text style={styles.muted}>{item.time}</Text>
              </Pressable>
            ))}
          {historyFilter !== 'Reviews' &&
            historyIds
              .slice(-3)
              .reverse()
              .map((id) => (
                <Pressable
                  key={id}
                  style={styles.panel}
                  onPress={() => router.push({ pathname: '/explorar/anime/[id]', params: { id } })}
                  accessibilityRole="button"
                >
                  <Text style={styles.rowTitle}>
                    {isOwnProfile ? 'Marcaste' : `${user.name} marcó`} {findAnime(id)?.title} como
                    visto
                  </Text>
                  <Text style={styles.muted}>Marcado como visto · actividad local</Text>
                </Pressable>
              ))}
          {((historyFilter === 'Reviews' && !myReviews.length) ||
            (historyFilter === 'Vistos' && !historyIds.length) ||
            (historyFilter === 'Todo' && !myReviews.length && !historyIds.length)) && (
            <EmptyState
              title="Sin actividad en este filtro"
              text="Elegí otro filtro para recorrer el historial."
            />
          )}
        </>
      )}
      <Dialog
        visible={sharing}
        title="Compartir perfil"
        text={`Simulación: compartir el perfil @${user.handle}. No se envió ningún mensaje.`}
        onClose={() => setSharing(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activityLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  identity: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  handle: { color: theme.colors.primarySoft, fontSize: 12, fontWeight: '600' },
  bio: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  stat: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 11 },
  statLabel: { color: theme.colors.primarySoft, fontSize: 10 },
  statValue: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  rankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 10,
  },
  rankBody: { flex: 1, gap: 7 },
  meta: { color: theme.colors.textSecondary, fontSize: 11 },
  purple: { color: theme.colors.primarySoft, fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickLinks: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
  },
  quickLink: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 3,
  },
  quickText: { color: theme.colors.primarySoft, fontSize: 9 },
  panel: {
    gap: 7,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  activity: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 5 },
  flex: { flex: 1, gap: 4 },
  muted: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 16 },
  rowTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityPanel: {
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
});
