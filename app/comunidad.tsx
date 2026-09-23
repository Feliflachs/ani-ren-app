import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, Chips, EmptyState, Screen, SearchBar } from '../src/components';
import {
  currentFollowingIds,
  currentFriendIds,
  currentUser,
  findUser,
  getParam,
  getRankProgress,
  users,
} from '../src/mock';
import { theme } from '../src/theme';

// TODO BACKEND [RELACIONES-PERFIL]: reemplazar esta tabla por amigos y seguidos públicos consultados mediante el id del perfil.
// Los seguidores se derivan de estas relaciones para que cada perfil conserve datos de ejemplo coherentes.
const connectionsByUser: Record<string, { friends: string[]; following: string[] }> = {
  felipe: { friends: currentFriendIds, following: currentFollowingIds },
  sofi: { friends: ['felipe', 'luli'], following: ['felipe', 'luli'] },
  nico: { friends: ['felipe', 'shonen'], following: ['felipe', 'sofi', 'shonen'] },
  luli: { friends: ['sofi'], following: ['sofi'] },
  shonen: { friends: ['nico'], following: ['nico'] },
};

export default function ComunidadScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; tab?: string | string[] }>();
  const id = getParam(params.id) ?? currentUser.id;
  const isOwn = id === currentUser.id;
  const tabs = isOwn
    ? ['Amigos', 'Seguidores', 'Siguiendo', 'Solicitudes']
    : ['Amigos', 'Seguidores', 'Siguiendo'];
  const initialTab = getParam(params.tab) ?? 'Amigos';
  const [tab, setTab] = useState(tabs.includes(initialTab) ? initialTab : 'Amigos');
  const [query, setQuery] = useState('');
  const [followed, setFollowed] = useState<string[]>([...currentFollowingIds]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [closedRequests, setClosedRequests] = useState<string[]>([]);
  const [notice, setNotice] = useState('');
  // TODO BACKEND [COMUNIDAD-CONSULTAR]: consultar conexiones por id y tab; solicitudes privadas solo para currentUser.id.
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
  const profileConnections = connectionsByUser[profile.id] ?? { friends: [], following: [] };
  const friendIds = isOwn
    ? [...profileConnections.friends, ...accepted]
    : profileConnections.friends;
  const followingIds = isOwn ? followed : profileConnections.following;
  const followerIds = Object.entries(connectionsByUser)
    .filter(([, relation]) => relation.following.includes(profile.id))
    .map(([userId]) => userId);
  const otherUsers = users.filter((user) => user.id !== profile.id);
  const connections = otherUsers.filter((user) => {
    const searchMatches = `${user.name} ${user.handle}`
      .toLowerCase()
      .includes(query.trim().toLowerCase());
    const tabMatches =
      tab === 'Solicitudes'
        ? ['luli', 'shonen'].includes(user.id) && !closedRequests.includes(user.id)
        : tab === 'Amigos'
          ? friendIds.includes(user.id)
          : tab === 'Siguiendo'
            ? followingIds.includes(user.id)
            : followerIds.includes(user.id);
    return searchMatches && tabMatches;
  });
  const openProfile = (userId: string) =>
    userId === currentUser.id
      ? router.push('/perfil')
      : router.push({ pathname: '/usuario/[id]', params: { id: userId } });
  const toggleFollow = (userId: string) => {
    // TODO BACKEND [COMUNIDAD-SEGUIR]: guardar la relación currentUser.id → userId; hoy solo cambia el listado local.
    setFollowed((previous) =>
      previous.includes(userId)
        ? previous.filter((item) => item !== userId)
        : [...previous, userId],
    );
  };
  const resolveRequest = (userId: string, accept: boolean) => {
    // TODO BACKEND [COMUNIDAD-SOLICITUD]: aceptar o rechazar una solicitud recibida por usuario; esperar resultado real antes de actualizar relaciones.
    if (accept) setAccepted((previous) => [...previous, userId]);
    setClosedRequests((previous) => [...previous, userId]);
    setNotice(
      `Simulación: solicitud ${accept ? 'aceptada. El usuario aparece en Amigos.' : 'rechazada.'}`,
    );
  };
  const cancelRequest = (userId: string) => {
    // TODO BACKEND [COMUNIDAD-CANCELAR]: cancelar la solicitud enviada a userId; hoy se retira del listado de demostración.
    setClosedRequests((previous) => [...previous, userId]);
    setNotice('Simulación: solicitud enviada cancelada.');
  };

  return (
    <Screen
      title={isOwn ? 'Comunidad' : `Conexiones de ${profile.name}`}
      subtitle={
        isOwn ? 'Tus amigos, seguidores y nuevas conexiones.' : 'Conexiones públicas de ejemplo.'
      }
      back
    >
      <Chips
        options={tabs}
        value={tab}
        onChange={(value) => {
          setTab(value);
          setNotice('');
        }}
      />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar por nombre o usuario…" />
      <Text style={styles.meta}>
        {connections.length} {tab.toLowerCase()} de ejemplo
      </Text>
      {notice.length > 0 && (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {notice}
        </Text>
      )}
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
          {tab === 'Solicitudes' ? (
            <>
              <Text style={styles.meta}>
                {user.id === 'shonen'
                  ? 'Enviada · Pendiente de respuesta'
                  : 'Recibida · Quiere ser tu amigo'}
              </Text>
              <View style={styles.actions}>
                {user.id === 'shonen' ? (
                  <Action label="Cancelar solicitud" onPress={() => cancelRequest(user.id)} />
                ) : (
                  <>
                    <Action label="Aceptar" primary onPress={() => resolveRequest(user.id, true)} />
                    <Action label="Rechazar" onPress={() => resolveRequest(user.id, false)} />
                  </>
                )}
              </View>
            </>
          ) : isOwn ? (
            <View style={styles.actions}>
              <Action
                label={followed.includes(user.id) ? 'Siguiendo' : 'Seguir'}
                active={followed.includes(user.id)}
                onPress={() => toggleFollow(user.id)}
              />
              {tab === 'Amigos' && <Text style={styles.friend}>Amistad de ejemplo</Text>}
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
          title={
            tab === 'Solicitudes'
              ? 'No hay solicitudes pendientes'
              : 'Sin conexiones en este filtro'
          }
          text={
            query.trim()
              ? 'Probá con otro nombre.'
              : 'Elegí otra pestaña para explorar los ejemplos.'
          }
        />
      )}
      <Text style={styles.meta}>
        {isOwn
          ? 'Los cambios demuestran la interacción en esta pantalla.'
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
  notice: {
    color: theme.colors.primarySoft,
    fontSize: 12,
    lineHeight: 19,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceLight,
  },
});
