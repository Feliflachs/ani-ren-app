import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Avatar,
  Chips,
  Dialog,
  EmptyState,
  Progress,
  ListCard,
  ReviewCard,
  Screen,
  Section,
} from '../../src/components';
import {
  currentLikedReviewIds,
  currentUser,
  findAnime,
  getRankProgress,
  lists,
  reviews,
} from '../../src/mock';
import { theme } from '../../src/theme';

export default function PerfilScreen() {
  const [view, setView] = useState('Reviews');
  const [historyFilter, setHistoryFilter] = useState('Todo');
  const [width, setWidth] = useState(300);
  const [sharing, setSharing] = useState(false);
  // TODO BACKEND [PERFIL-CONSULTAR]: consultar currentUser.id, sus favoritos, actividad, reviews, listas y likes; hoy son datos compartidos de ejemplo.
  const myReviews = reviews.filter((item) => item.userId === currentUser.id);
  const myLists = lists.filter((item) => item.userId === currentUser.id);
  const likedReviews = reviews.filter((item) => currentLikedReviewIds.includes(item.id));
  const shownReviews = view === 'Likes' ? likedReviews : myReviews;
  const rankProgress = getRankProgress(currentUser.watched);
  const openConnections = (tab: string) => router.push({ pathname: '/comunidad', params: { tab } });

  return (
    <Screen
      title="Perfil"
      avatar={false}
      actions={
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setSharing(true)}
            accessibilityRole="button"
            accessibilityLabel="Compartir perfil"
          >
            <Ionicons name="share-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => router.push('/ajustes')}
            accessibilityRole="button"
            accessibilityLabel="Abrir ajustes"
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      }
    >
      <View style={styles.identity}>
        <Avatar size={82} onPress={() => router.push('/editar-perfil')} />
        <View style={styles.identityText}>
          <Text style={styles.name}>{currentUser.name}-kun</Text>
          <Text style={styles.handle}>@{currentUser.handle}</Text>
          <Text style={styles.bio}>{currentUser.bio}</Text>
          <Pressable
            onPress={() => router.push('/aura/rangos')}
            accessibilityRole="button"
            style={styles.badge}
          >
            <Ionicons name="sparkles-outline" size={11} color={theme.colors.primarySoft} />
            <Text style={styles.badgeText}>Decorador de ejemplo: Novato-kun</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.stats}>
        {[
          {
            label: 'Seguidores',
            value: currentUser.followers,
            onPress: () => openConnections('Seguidores'),
          },
          {
            label: 'Siguiendo',
            value: currentUser.following,
            onPress: () => openConnections('Siguiendo'),
          },
          { label: 'Reviews', value: currentUser.reviews, onPress: () => setView('Reviews') },
          {
            label: 'Watchlist',
            value: currentUser.watchlist,
            onPress: () => router.push({ pathname: '/biblioteca', params: { tab: 'Watchlist' } }),
          },
        ].map((stat) => (
          <Pressable
            key={stat.label}
            onPress={stat.onPress}
            style={styles.stat}
            accessibilityRole="button"
          >
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => router.push('/aura')}
        style={styles.rankCard}
        accessibilityRole="button"
        accessibilityLabel="Ver tu rango Aura"
      >
        <Ionicons name="shield-outline" color={theme.colors.primarySoft} size={28} />
        <View style={styles.rankBody}>
          <Text style={styles.meta}>
            Rango: <Text style={styles.purple}>{rankProgress.rank}</Text>
          </Text>
          <Progress value={currentUser.watched} total={rankProgress.total} label="Animes vistos" />
        </View>
        <Ionicons name="chevron-forward" color={theme.colors.primarySoft} size={16} />
      </Pressable>
      <Section
        title="Top 4 favoritos"
        onPress={() => router.push({ pathname: '/biblioteca', params: { tab: 'Favoritos' } })}
      />
      <View style={styles.grid} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {currentUser.favorites.map((id, index) => {
          const item = findAnime(id);
          return item ? (
            <AnimeCard key={id} item={item} width={(width - 10) / 2} landscape rank={index + 1} />
          ) : null;
        })}
      </View>
      <View style={styles.quickLinks}>
        {['Watchlist', 'Vistos', 'Reviews', 'Listas'].map((label) => (
          <Pressable
            key={label}
            style={styles.quickLink}
            onPress={() =>
              label === 'Reviews'
                ? setView('Reviews')
                : router.push({ pathname: '/biblioteca', params: { tab: label } })
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
      <Section title="Actividad reciente" action="Ver todo" onPress={() => setView('Historial')} />
      <View style={styles.panel}>
        <View style={styles.activity}>
          <Avatar size={27} />
          <Pressable
            style={styles.activityLink}
            onPress={() =>
              router.push({
                pathname: '/review/[id]',
                params: { id: myReviews[0]?.id ?? 'review-felipe' },
              })
            }
            accessibilityRole="button"
          >
            <View style={styles.flex}>
              <Text style={styles.meta}>{currentUser.name}-kun escribió una review</Text>
              <Text style={styles.muted}>Hace 2 h · Frieren</Text>
            </View>
            <Text style={styles.purple}>★ 9.6</Text>
          </Pressable>
        </View>
        <View style={styles.activity}>
          <Avatar size={27} />
          <Pressable
            style={styles.activityLink}
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: 'blue-lock' } })}
            accessibilityRole="button"
          >
            <View style={styles.flex}>
              <Text style={styles.meta}>{currentUser.name}-kun marcó como visto</Text>
              <Text style={styles.muted}>Ayer · Blue Lock</Text>
            </View>
            <Ionicons name="eye-outline" color={theme.colors.primarySoft} size={18} />
          </Pressable>
        </View>
      </View>
      <Section title="Reviews destacadas" action="Ver todas" onPress={() => setView('Reviews')} />
      {myReviews.map((item) => (
        <Pressable
          key={`featured-${item.id}`}
          style={styles.reviewRow}
          onPress={() => router.push({ pathname: '/review/[id]', params: { id: item.id } })}
          accessibilityRole="button"
        >
          <Image source={findAnime(item.animeId)?.image} style={styles.reviewImage} />
          <View style={styles.flex}>
            <Text style={styles.rowTitle}>{findAnime(item.animeId)?.title}</Text>
            <Text style={styles.muted} numberOfLines={2}>
              {item.text}
            </Text>
          </View>
          <Text style={styles.purple}>★ {item.rating?.toFixed(1)}</Text>
        </Pressable>
      ))}
      <Chips
        options={['Reviews', 'Listas', 'Historial', 'Likes']}
        value={view}
        onChange={setView}
      />
      {view === 'Reviews' && myReviews.length > 0 && (
        <Action
          label="Editar mi review"
          icon="create-outline"
          onPress={() =>
            router.push({ pathname: '/review/escribir', params: { id: myReviews[0].id } })
          }
        />
      )}
      {(view === 'Reviews' || view === 'Likes') && (
        <>
          {shownReviews.map((item) => (
            <ReviewCard key={item.id} review={item} />
          ))}
          {shownReviews.length === 0 && (
            <EmptyState
              title="Todavía no hay actividad"
              text="Tus reviews y likes aparecerán acá."
            />
          )}
          {view === 'Reviews' && (
            <Action
              label="Escribir una review"
              icon="create-outline"
              onPress={() => router.push('/review/escribir')}
            />
          )}
        </>
      )}
      {view === 'Listas' && (
        <>
          {myLists.map((item) => (
            <ListCard key={item.id} list={item} />
          ))}
          <Action
            label="Crear lista"
            icon="add-outline"
            onPress={() => router.push('/lista/editar')}
          />
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
                onPress={() => router.push({ pathname: '/review/[id]', params: { id: item.id } })}
                accessibilityRole="button"
              >
                <Text style={styles.rowTitle}>
                  Escribiste una review de {findAnime(item.animeId)?.title}
                </Text>
                <Text style={styles.muted}>Hoy · {item.time}</Text>
              </Pressable>
            ))}
          {historyFilter !== 'Reviews' &&
            currentUser.favorites.slice(0, 3).map((id, index) => (
              <Pressable
                key={id}
                style={styles.panel}
                onPress={() => router.push({ pathname: '/anime/[id]', params: { id } })}
                accessibilityRole="button"
              >
                <Text style={styles.rowTitle}>Marcaste {findAnime(id)?.title} como visto</Text>
                <Text style={styles.muted}>
                  {index === 0 ? 'Ayer' : `Hace ${index + 2} días`} · Actividad de ejemplo
                </Text>
              </Pressable>
            ))}
        </>
      )}
      <View style={styles.bottomActions}>
        <Action
          label="Editar perfil"
          icon="create-outline"
          onPress={() => router.push('/editar-perfil')}
        />
        <Action label="Amigos" icon="people-outline" onPress={() => openConnections('Amigos')} />
      </View>
      <Dialog
        visible={sharing}
        title="Compartir perfil"
        text={`Simulación: compartir el perfil @${currentUser.handle}. No se envió ningún mensaje.`}
        onClose={() => setSharing(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  activityLink: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerActions: { flexDirection: 'row', gap: 19 },
  identity: { flexDirection: 'row', gap: 13, alignItems: 'center' },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  handle: { color: theme.colors.primarySoft, fontSize: 12, fontWeight: '600' },
  bio: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  badge: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    alignItems: 'center',
    gap: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceLight,
    padding: 5,
  },
  badgeText: { color: theme.colors.primarySoft, fontSize: 9 },
  stats: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 11,
    backgroundColor: theme.colors.surface,
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
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  reviewImage: {
    width: 68,
    height: 54,
    borderRadius: 6,
    backgroundColor: theme.colors.surfaceLight,
  },
  rowTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  bottomActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
