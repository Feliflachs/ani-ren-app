import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View, ScrollView, StyleSheet, Pressable, Share, Platform } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Action,
  AnimeCard,
  Avatar,
  Chips,
  Dialog,
  ListCard,
  PublicationCard,
  RankInsignia,
  Screen,
  Section,
} from './components';
import { theme } from './theme';
import { useSession } from './context/SessionContext';
import { useMutation, usePage, useQuery } from './remote';
import { query, errorMessage } from './api';
import { LoadState, Notice, PageEnd, ui } from './remote-ui';
import type { Profile, Publication, AnimeList } from './models';
export function PerfilView({ id, publicProfile = false }: { id: string; publicProfile?: boolean }) {
  const result = useQuery<{ user: Profile }>('/users/' + encodeURIComponent(id));
  const profile = result.data?.user;
  const [tab, setTab] = useState('Reviews');
  const publications = usePage<Publication>(
    tab === 'Listas'
      ? null
      : query('/publications', { userId: id, kind: tab === 'Reviews' ? 'review' : 'post' }),
  );
  const lists = usePage<AnimeList>(tab === 'Listas' ? query('/lists', { userId: id }) : null);
  const mutation = useMutation();
  const { signOut } = useSession();
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const shareText = profile
    ? `${profile.name} en Ani-Ren. Buscá @${profile.handle} para ver su perfil.`
    : '';
  async function shareProfile() {
    setShareStatus('');
    try {
      if (Platform.OS !== 'web') await Share.share({ message: shareText });
      else if (navigator.share)
        await navigator.share({ title: 'Perfil de Ani-Ren', text: shareText });
      else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
        setShareStatus('Usuario copiado.');
      } else setShareStatus('Seleccioná el texto para copiarlo.');
    } catch (failure) {
      if (failure instanceof Error && failure.name === 'AbortError') return;
      setShareStatus('No se pudo compartir. Podés copiar el texto de arriba.');
    }
  }
  async function logout() {
    setClosing(true);
    setError('');
    try {
      await signOut();
    } catch (failure) {
      setError(errorMessage(failure));
      setClosing(false);
    }
  }
  const connections = (tab: string) =>
    router.push({ pathname: '/perfil/comunidad', params: { id, tab } });
  return (
    <Screen
      title="Perfil"
      back={publicProfile}
      avatar={false}
      actions={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Compartir perfil"
          disabled={!profile}
          onPress={() => {
            setShareStatus('');
            setSharing(true);
          }}
          style={styles.iconButton}
        >
          <Ionicons name="share-outline" size={23} color={theme.colors.textSecondary} />
        </Pressable>
      }
    >
      {profile && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {profile ? (
        <>
          <View style={styles.identity}>
            <View style={styles.identityTop}>
              <Avatar user={profile} size={72} />
              <View style={styles.identityText}>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.handle}>@{profile.handle}</Text>
                <View style={styles.rank}>
                  <RankInsignia rank={profile.rank.name} size={22} />
                  <Text style={styles.rankName}>{profile.rank.name}</Text>
                </View>
              </View>
              {profile.isMe && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Editar perfil"
                  style={styles.edit}
                  onPress={() => router.push('/perfil/editar')}
                >
                  <Ionicons name="pencil-outline" size={21} color={theme.colors.primarySoft} />
                </Pressable>
              )}
            </View>
            {!!profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            <View style={styles.connections}>
              {!profile.isMe && (
                <Action
                  label={profile.isFollowing ? 'Siguiendo' : 'Seguir'}
                  active={profile.isFollowing}
                  disabled={mutation.pending}
                  onPress={() =>
                    void mutation.run('/me/following/' + id, {
                      method: profile.isFollowing ? 'DELETE' : 'PUT',
                    })
                  }
                />
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => connections('Amigos')}
                style={styles.textAction}
              >
                <Ionicons name="people-outline" size={16} color={theme.colors.primarySoft} />
                <Text style={styles.link}>{profile.isFriend ? 'Son amigos' : 'Amigos'}</Text>
              </Pressable>
            </View>
            <View style={styles.stats}>
              {[
                {
                  label: 'Seguidores',
                  value: profile.statistics.followers,
                  onPress: () => connections('Seguidores'),
                },
                {
                  label: 'Siguiendo',
                  value: profile.statistics.following,
                  onPress: () => connections('Siguiendo'),
                },
                {
                  label: 'Reviews',
                  value: profile.statistics.reviews,
                  onPress: () => router.push({ pathname: '/perfil/reviews', params: { id } }),
                },
                {
                  label: 'Watchlist',
                  value: profile.statistics.watchlist,
                  onPress: profile.isMe
                    ? () =>
                        router.push({
                          pathname: '/perfil/biblioteca',
                          params: { tab: 'Watchlist' },
                        })
                    : undefined,
                },
              ].map((stat) => (
                <Pressable
                  key={stat.label}
                  style={styles.stat}
                  onPress={stat.onPress}
                  disabled={!stat.onPress}
                  accessibilityRole={stat.onPress ? 'button' : undefined}
                  accessibilityLabel={`${stat.label}: ${stat.value}`}
                >
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <Text style={styles.statValue}>{stat.value}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Notice error={error || mutation.error} />
          {profile.isMe && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mi biblioteca"
              style={styles.library}
              onPress={() => router.push('/perfil/biblioteca')}
            >
              <Ionicons name="library-outline" size={20} color={theme.colors.primarySoft} />
              <Text style={[styles.link, ui.grow]}>Mi biblioteca</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )}
          <Section title="Favoritos" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12 }}
          >
            {profile.favorites.map((item) => (
              <AnimeCard key={item.anime.id} item={item.anime} width={110} />
            ))}
          </ScrollView>
          {!profile.favorites.length && <Text style={ui.muted}>Todavía no hay favoritos.</Text>}
          <Chips
            options={['Reviews', 'Posteos', 'Listas']}
            value={tab}
            onChange={setTab}
            variant="underline"
          />
          {tab === 'Listas' ? (
            <>
              {lists.items.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
              <PageEnd page={lists} />
            </>
          ) : (
            <>
              {publications.items.map((review) => (
                <PublicationCard key={review.id} review={review} />
              ))}
              <PageEnd page={publications} />
            </>
          )}
          <Dialog visible={sharing} title="Compartir perfil" onClose={() => setSharing(false)}>
            <Text selectable style={ui.text}>
              {shareText}
            </Text>
            <Action
              label="Compartir o copiar usuario"
              icon="share-outline"
              onPress={() => void shareProfile()}
            />
            {!!shareStatus && (
              <Text accessibilityLiveRegion="polite" style={ui.muted}>
                {shareStatus}
              </Text>
            )}
          </Dialog>
          {profile.isMe && (
            <View style={styles.footer}>
              <Action
                label={closing ? 'Cerrando…' : 'Cerrar sesión'}
                disabled={closing}
                onPress={() => void logout()}
              />
            </View>
          )}
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  identityTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  identityText: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: theme.colors.text, fontSize: 23, fontWeight: '700' },
  handle: { color: theme.colors.textSecondary, fontSize: 13 },
  bio: { color: theme.colors.textSoft, fontSize: 14, lineHeight: 21, marginTop: 14 },
  rank: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  rankName: { color: theme.colors.primarySoft, fontSize: 12 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  edit: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: -8,
    marginRight: -8,
  },
  connections: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 6 },
  textAction: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 44 },
  link: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingVertical: 14,
  },
  stat: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5, minHeight: 44 },
  statLabel: { color: theme.colors.primarySoft, fontSize: 10 },
  statValue: { color: theme.colors.text, fontSize: 17, fontWeight: '600' },
  library: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  footer: {
    marginTop: 24,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 20,
  },
});
