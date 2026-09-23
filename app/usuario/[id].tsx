import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Avatar,
  Chips,
  EmptyState,
  Progress,
  ListCard,
  ReviewCard,
  Screen,
  Section,
} from '../../src/components';
import {
  currentFollowingIds,
  currentFriendIds,
  currentLikedReviewIds,
  currentUser,
  findAnime,
  findUser,
  getRankProgress,
  getParam,
  lists,
  reviews,
} from '../../src/mock';
import { theme } from '../../src/theme';

export default function UsuarioScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getParam(params.id);
  const initiallyFollowing = currentFollowingIds.includes(id ?? '');
  const [following, setFollowing] = useState(initiallyFollowing);
  const [friendship, setFriendship] = useState(
    currentFriendIds.includes(id ?? '') ? 'Amigos' : 'Agregar amigo',
  );
  const [view, setView] = useState('Reviews');
  const [historyFilter, setHistoryFilter] = useState('Todo');
  const [width, setWidth] = useState(300);
  // TODO BACKEND [USUARIO-PERFIL]: consultar id y sus colecciones públicas, actividad, likes y relación con currentUser.id.
  const user = findUser(id);
  if (!user)
    return (
      <Screen title="Perfil" back>
        <EmptyState title="Usuario no encontrado" text="Este perfil de ejemplo no existe." />
      </Screen>
    );
  const isOwnProfile = user.id === currentUser.id;
  const rankProgress = getRankProgress(user.watched);
  const userReviews = reviews.filter((item) => item.userId === user.id);
  const userLists = lists.filter((item) => item.userId === user.id);
  const userLikes = isOwnProfile
    ? reviews.filter((item) => currentLikedReviewIds.includes(item.id))
    : reviews.filter((item) => item.userId !== user.id).slice(0, 2);
  const showReviews = view === 'Likes' ? userLikes : userReviews;
  const connections = (tab: string) =>
    router.push({ pathname: '/comunidad', params: { id: user.id, tab } });
  const toggleFollow = () => {
    // TODO BACKEND [USUARIO-SEGUIR]: crear o quitar la relación currentUser.id → user.id y usar el estado confirmado.
    setFollowing((previous) => !previous);
  };
  const changeFriendship = () => {
    // TODO BACKEND [USUARIO-AMISTAD]: enviar o cancelar solicitud entre currentUser.id y user.id; si son amigos, permitir quitar la relación.
    setFriendship((previous) =>
      previous === 'Agregar amigo' ? 'Solicitud pendiente' : 'Agregar amigo',
    );
  };

  return (
    <Screen title={isOwnProfile ? 'Tu perfil público' : 'Perfil de usuario'} back>
      <View style={styles.identity}>
        <Avatar user={user} size={82} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.handle}>@{user.handle}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
          <Text style={styles.badge}>✧ Rango {rankProgress.rank}</Text>
        </View>
      </View>
      {isOwnProfile ? (
        <Action label="Ir a mi perfil" onPress={() => router.push('/perfil')} />
      ) : (
        <View style={styles.actions}>
          <Action
            label={following ? 'Siguiendo' : 'Seguir'}
            active={following}
            onPress={toggleFollow}
            icon={following ? 'checkmark-outline' : 'add-outline'}
          />
          <Action
            label={friendship}
            active={friendship !== 'Agregar amigo'}
            onPress={changeFriendship}
            icon="people-outline"
          />
        </View>
      )}
      {!isOwnProfile && friendship === 'Solicitud pendiente' && (
        <Text style={styles.notice}>
          Solicitud simulada enviada. Tocá el botón para cancelarla.
        </Text>
      )}
      <View style={styles.stats}>
        {[
          {
            label: 'Seguidores',
            value: user.followers + (following ? 1 : 0) - (initiallyFollowing ? 1 : 0),
            onPress: () => connections('Seguidores'),
          },
          { label: 'Siguiendo', value: user.following, onPress: () => connections('Siguiendo') },
          { label: 'Reviews', value: user.reviews, onPress: () => setView('Reviews') },
        ].map((stat) => (
          <Pressable
            key={stat.label}
            style={styles.stat}
            onPress={stat.onPress}
            accessibilityRole="button"
          >
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </Pressable>
        ))}
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Watchlist</Text>
          <Text style={styles.statValue}>{user.watchlist}</Text>
        </View>
      </View>
      <View style={styles.rank}>
        <Ionicons name="shield-outline" color={theme.colors.primarySoft} size={26} />
        <View style={styles.flex}>
          <Text style={styles.title}>Aura · {rankProgress.rank}</Text>
          <Progress value={user.watched} total={rankProgress.total} label="Animes vistos" />
        </View>
      </View>
      <Section title="Top 4 favoritos" />
      <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {user.favorites.slice(0, 4).map((animeId, index) => {
          const item = findAnime(animeId);
          return item ? (
            <AnimeCard
              key={animeId}
              item={item}
              width={(width - 10) / 2}
              landscape
              rank={index + 1}
            />
          ) : null;
        })}
      </View>
      <Section
        title="Actividad reciente"
        action="Ver historial"
        onPress={() => setView('Historial')}
      />
      <View style={styles.panel}>
        <Text style={styles.body}>
          {user.name} vio {findAnime(user.favorites[0])?.title}.
        </Text>
        <Text style={styles.meta}>Ayer · Actividad pública de ejemplo</Text>
      </View>
      <Chips
        options={['Reviews', 'Listas', 'Historial', 'Likes']}
        value={view}
        onChange={setView}
      />
      {(view === 'Reviews' || view === 'Likes') && (
        <>
          {showReviews.map((item) => (
            <View key={item.id} style={styles.reviewContent}>
              <ReviewCard review={item} />
              {isOwnProfile && item.userId === currentUser.id && (
                <Action
                  label="Editar review"
                  onPress={() =>
                    router.push({ pathname: '/review/escribir', params: { id: item.id } })
                  }
                />
              )}
            </View>
          ))}
          {showReviews.length === 0 && (
            <EmptyState
              title="Sin publicaciones de ejemplo"
              text="Las publicaciones públicas aparecerán acá."
            />
          )}
        </>
      )}
      {view === 'Listas' && (
        <>
          {userLists.map((item) => (
            <ListCard key={item.id} list={item} />
          ))}
          {userLists.length === 0 && (
            <EmptyState
              title="Sin listas públicas"
              text="Este usuario todavía no tiene listas en la demostración."
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
          {historyFilter !== 'Reviews' &&
            user.favorites.slice(0, 2).map((animeId, index) => (
              <Pressable
                key={animeId}
                onPress={() => router.push({ pathname: '/anime/[id]', params: { id: animeId } })}
                style={styles.panel}
                accessibilityRole="button"
              >
                <Text style={styles.body}>
                  {user.name} marcó {findAnime(animeId)?.title} como visto.
                </Text>
                <Text style={styles.meta}>{index === 0 ? 'Ayer' : 'Hace 3 días'}</Text>
              </Pressable>
            ))}
          {historyFilter !== 'Vistos' &&
            userReviews.map((item) => (
              <Pressable
                key={item.id}
                style={styles.panel}
                onPress={() => router.push({ pathname: '/review/[id]', params: { id: item.id } })}
                accessibilityRole="button"
              >
                <Text style={styles.body}>
                  {user.name} publicó{' '}
                  {item.animeId
                    ? `una review de ${findAnime(item.animeId)?.title}`
                    : 'una recomendación'}
                  .
                </Text>
                <Text style={styles.meta}>{item.time}</Text>
              </Pressable>
            ))}
          {historyFilter === 'Reviews' && userReviews.length === 0 && (
            <EmptyState
              title="Sin reviews de ejemplo"
              text="Elegí Todo o Vistos para ver su historial."
            />
          )}
        </>
      )}
      <Action
        label="Amigos y conexiones públicas"
        icon="people-outline"
        onPress={() => connections('Amigos')}
      />
      <Text style={styles.notice}>Relaciones y cambios locales de ejemplo.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reviewContent: { gap: 7 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  identityText: { flex: 1, gap: 4 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  handle: { color: theme.colors.primarySoft, fontSize: 12 },
  bio: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  badge: { color: theme.colors.primarySoft, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notice: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  stats: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
  },
  stat: { flex: 1, alignItems: 'center', gap: 5, paddingVertical: 12 },
  statLabel: { color: theme.colors.primarySoft, fontSize: 10 },
  statValue: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  rank: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  flex: { flex: 1, gap: 8 },
  title: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  panel: {
    padding: 13,
    gap: 7,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  body: { color: theme.colors.text, fontSize: 12, lineHeight: 19 },
  meta: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 16 },
});
