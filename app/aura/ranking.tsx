import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Chips, Screen } from '../../src/components';
import { currentFriendIds, currentUser, getRankProgress, users } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [RANKING]: consultar posiciones y relaciones reales por cantidad de anime visto.

export default function RankingScreen() {
  const [filter, setFilter] = useState('Global');
  const ranked = users
    .filter(
      (user) =>
        filter === 'Global' || user.id === currentUser.id || currentFriendIds.includes(user.id),
    )
    .sort((a, b) => b.watched - a.watched);
  const currentPosition = ranked.findIndex((user) => user.id === currentUser.id) + 1;

  const openProfile = (userId: string) => {
    if (userId === currentUser.id) router.push('/perfil');
    else router.push({ pathname: '/usuario/[id]', params: { id: userId } });
  };

  return (
    <Screen title="Ranking de usuarios" subtitle="Historias vistas, mundos descubiertos." back>
      <Chips options={['Global', 'Amigos']} value={filter} onChange={setFilter} />
      <View style={styles.summary}>
        <Ionicons name="podium-outline" size={33} color={theme.colors.primarySoft} />
        <View style={styles.flex}>
          <Text style={styles.position}>Tu posición: #{currentPosition}</Text>
          <Text style={styles.meta}>
            {currentUser.watched} animes vistos · {filter.toLowerCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.notice}>
        Clasificación y amistades de ejemplo. El criterio cuenta animes vistos, no likes ni
        puntuaciones.
      </Text>

      {ranked.map((user, index) => {
        const isCurrentUser = user.id === currentUser.id;
        return (
          <Pressable
            key={user.id}
            onPress={() => openProfile(user.id)}
            accessibilityRole="button"
            accessibilityLabel={`Posición ${index + 1}, ${user.name}, ${user.watched} animes vistos`}
            style={[styles.userRow, isCurrentUser && styles.current]}
          >
            <Text style={styles.number}>#{index + 1}</Text>
            <Avatar user={user} size={42} />
            <View style={styles.flex}>
              <Text style={styles.name}>
                {user.name}
                {isCurrentUser ? ' · Vos' : ''}
              </Text>
              <Text style={styles.meta}>{getRankProgress(user.watched).rank}</Text>
            </View>
            <View style={styles.count}>
              <Text style={styles.watched}>{user.watched}</Text>
              <Text style={styles.meta}>vistos</Text>
            </View>
          </Pressable>
        );
      })}

      <Text style={styles.notice}>
        Las reglas para contar series, temporadas y películas se definirán al conectar los datos
        reales.
      </Text>
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  current: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryDark },
  number: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 14, width: 28 },
  name: { color: theme.colors.text, fontWeight: '600', fontSize: 13 },
  count: { alignItems: 'center', minWidth: 36 },
  watched: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 18 },
});
