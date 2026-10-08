import { useDirectory } from '../../src/useDirectory';
import { useCurrentUser } from '../../src/useCurrentUser';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, Chips, EmptyState, Screen, SearchBar } from '../../src/components';
import { useAppState } from '../../src/context/AppState';
import { useSocial } from '../../src/context/SocialContext';
import { getParam, getRankProgress } from '../../src/mock';
import { theme } from '../../src/theme';

export default function ComunidadScreen() {
  const { findUser, users } = useDirectory();

  const currentUser = useCurrentUser();

  const { followingIds: ownFollowingIds, toggleFollowing } = useAppState();
  const { getFollowingIds, getFriendIds, getFollowerIds } = useSocial();
  const params = useLocalSearchParams<{ id?: string | string[]; tab?: string | string[] }>();
  const id = getParam(params.id) ?? currentUser.id;
  const isOwn = id === currentUser.id;
  const tabs = ['Amigos', 'Seguidores', 'Siguiendo'];
  const initialTab = getParam(params.tab) ?? 'Amigos';
  const [tab, setTab] = useState(tabs.includes(initialTab) ? initialTab : 'Amigos');
  const [query, setQuery] = useState('');
  // TODO BACKEND [COMUNIDAD-CONSULTAR]: consultar seguimientos por id; una amistad es un seguimiento mutuo.
  const profile = findUser(id);
  if (!profile)
    return (
      <Screen title="Comunidad" back>
        <EmptyState
          title="Usuario no encontrado"
          text="No hay conexiones para este identificador de ejemplo."
        />
      </Screen>
    );
  const followingIds = getFollowingIds(profile.id);
  const followerIds = getFollowerIds(profile.id);
  const friendIds = getFriendIds(profile.id);
  const otherUsers = users.filter((user) => user.id !== profile.id);
  const connections = otherUsers.filter((user) => {
    const searchMatches = `${user.name} ${user.handle}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const tabMatches =
      tab === 'Amigos'
        ? friendIds.includes(user.id)
        : tab === 'Siguiendo'
          ? followingIds.includes(user.id)
          : followerIds.includes(user.id);
    return searchMatches && tabMatches;
  });
  const openProfile = (userId: string) =>
    userId === currentUser.id
      ? router.push('/perfil')
      : router.push({ pathname: '/perfil/usuario/[id]', params: { id: userId } });
  return (
    <Screen
      title={isOwn ? 'Comunidad' : `Conexiones de ${profile.name}`}
      subtitle={isOwn ? 'Seguimientos y amistades mutuas.' : 'Conexiones públicas de ejemplo.'}
      back
    >
      <Chips options={tabs} value={tab} onChange={setTab} variant="underline" />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nombre o usuario…" />
      <Text style={styles.meta}>
        {connections.length} {tab.toLowerCase()} de ejemplo
      </Text>
      {connections.map((user) => (
        <View key={user.id} style={styles.card}>
          <View style={styles.row}>
            <Avatar user={user} size={46} onPress={() => openProfile(user.id)} />
            <Pressable
              style={styles.identity}
              onPress={() => openProfile(user.id)}
              accessibilityRole="button"
            >
              <Text style={styles.name}>{user.name}</Text>
              <Text style={styles.meta}>@{user.handle}</Text>
              <Text style={styles.rank}>✧ {getRankProgress(user.watched).rank}</Text>
            </Pressable>
          </View>
          {isOwn ? (
            <View style={styles.actions}>
              <Action
                label={ownFollowingIds.includes(user.id) ? 'Siguiendo' : 'Seguir'}
                active={ownFollowingIds.includes(user.id)}
                onPress={() => toggleFollowing(user.id)}
              />
              {tab === 'Amigos' && <Text style={styles.friend}>Seguimiento mutuo</Text>}
            </View>
          ) : (
            <Text style={styles.friend}>
              {tab === 'Amigos'
                ? `Amigo de ${profile.name}`
                : tab === 'Seguidores'
                  ? `Sigue a ${profile.name}`
                  : `${profile.name} sigue este perfil`}
            </Text>
          )}
        </View>
      ))}
      {connections.length === 0 && (
        <EmptyState
          title="Sin conexiones en este filtro"
          text={
            query.trim()
              ? 'Probá con otro nombre.'
              : 'Elegí otra pestaña para explorar los ejemplos.'
          }
        />
      )}
      <Text style={styles.meta}>
        {isOwn
          ? 'Los amigos aparecen automáticamente cuando ambos usuarios se siguen.'
          : 'Estas conexiones públicas son datos de ejemplo.'}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  identity: { flex: 1, gap: 4 },
  name: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  rank: { color: theme.colors.primarySoft, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 },
  friend: { color: theme.colors.primarySoft, fontSize: 11 },
});
