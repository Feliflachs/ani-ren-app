import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter } from '../../src/remote-ui';
import { adaptUser } from '../../src/api/remote';
import { useCurrentUser } from '../../src/useCurrentUser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Chips, Screen } from '../../src/components';
import { theme } from '../../src/theme';

export default function RankingScreen() {
  const currentUser = useCurrentUser();

  const [filter, setFilter] = useState('Global');
  const page = usePage('/ranking', { scope: filter === 'Global' ? 'global' : 'friends' });
  const ranked = page.items.map((row) => ({
    ...adaptUser(row.user),
    points: row.points as number,
    position: row.position as number,
    rank: row.rank.name as string,
  }));
  const currentPosition = page.data?.me?.position ?? '—';
  const openProfile = (userId: string) => {
    if (userId === currentUser.id) router.push('/perfil');
    else router.push({ pathname: '/perfil/usuario/[id]', params: { id: userId } });
  };

  return (
    <Screen
      title="Ranking de usuarios"
      subtitle="Historias vistas, mundos descubiertos."
      back
      onRefresh={page.reload}
      refreshing={page.loading}
    >
      <Chips
        options={['Global', 'Amigos']}
        value={filter}
        onChange={setFilter}
        variant="underline"
      />
      <View style={styles.summary}>
        <Ionicons name="podium-outline" size={33} color={theme.colors.primarySoft} />
        <View style={styles.flex}>
          <Text style={styles.position}>Tu posición: #{currentPosition}</Text>
          <Text style={styles.meta}>
            {page.data?.me?.points ?? '—'} puntos Aura · {filter.toLowerCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.notice}>La posición depende de los puntos de misiones reclamadas.</Text>

      {ranked.map((user) => {
        const isCurrentUser = user.id === currentUser.id;
        return (
          <Pressable
            key={user.id}
            onPress={() => openProfile(user.id)}
            accessibilityRole="button"
            accessibilityLabel={`Posición ${user.position}, ${user.name}, ${user.points} puntos Aura`}
            style={styles.userRow}
          >
            <Text style={styles.number}>#{user.position}</Text>
            <Avatar user={user} size={42} />
            <View style={styles.flex}>
              <Text style={styles.name}>
                {user.name}
                {isCurrentUser ? ' · Vos' : ''}
              </Text>
              <Text style={styles.meta}>{user.rank}</Text>
            </View>
            <View style={styles.count}>
              <Text style={styles.points}>{user.points}</Text>
              <Text style={styles.meta}>puntos</Text>
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.notice}>
        Los usuarios con los mismos puntos comparten posición.
        {filter === 'Amigos'
          ? ' Acá participás vos y las personas que se siguen mutuamente con vos.'
          : ''}
      </Text>
      <QueryFooter query={page} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 17,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  position: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, marginTop: 4 },
  notice: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 18 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  number: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 14, width: 28 },
  name: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  count: { alignItems: 'center', minWidth: 36 },
  points: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 18 },
});
