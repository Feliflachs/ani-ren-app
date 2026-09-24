import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  Avatar,
  Dialog,
  Progress,
  RankInsignia,
  Screen,
  Section,
} from '../../src/components';
import { useAppState } from '../../src/AppState';
import { auraMissions, currentUser, getRankProgress, ranks } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [AURA]: consultar rango, progreso, beneficios y misiones mediante el id del usuario.
const featuredMissions = auraMissions.filter((mission) => mission.state === 'En curso').slice(0, 3);

export default function AuraScreen() {
  const { likedIds, watchedCount, watchlistIds } = useAppState();
  const rankProgress = getRankProgress(watchedCount);
  const currentRankIndex = ranks.indexOf(rankProgress.rank);
  const stats = [
    { label: 'Animes vistos', value: watchedCount, icon: 'eye-outline' as const },
    { label: 'Favoritos', value: likedIds.length, icon: 'star-outline' as const },
    { label: 'Reviews', value: currentUser.reviews, icon: 'chatbox-outline' as const },
    { label: 'Watchlist', value: watchlistIds.length, icon: 'bookmark-outline' as const },
  ];
  const [selectedMission, setSelectedMission] = useState<(typeof auraMissions)[number] | null>(
    null,
  );

  const openMissions = () => {
    setSelectedMission(null);
    router.push('/aura/misiones');
  };

  return (
    <Screen title="Aura" subtitle="Mirá tu progreso, descubrí rangos y desbloqueá tu estilo.">
      <View style={styles.rankCard}>
        <View style={styles.rankSide}>
          <View style={styles.rankIdentity}>
            <RankInsignia rank={rankProgress.rank} size={64} />
            <View style={styles.flex}>
              <Text style={styles.meta}>Rango actual</Text>
              <Text style={styles.rankName}>{rankProgress.rank}</Text>
              <Text style={styles.pill}>{rankProgress.rank}-kun</Text>
            </View>
          </View>
          <Progress value={watchedCount} total={rankProgress.total} label="Animes vistos" />
          <Text style={styles.meta}>
            {rankProgress.nextRank
              ? `Próximo rango: ${rankProgress.nextRank} · umbral de ejemplo`
              : 'Alcanzaste el último rango de ejemplo'}
          </Text>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.meta}>Beneficios del rango</Text>
          <Text style={styles.benefit}>✧ Badge {rankProgress.rank}</Text>
          <Text style={styles.benefit}>✧ Sufijos y títulos</Text>
          <Text style={styles.benefit}>✧ Misiones de ejemplo</Text>
          <Pressable onPress={() => router.push('/aura/rangos')} accessibilityRole="button">
            <Text style={styles.link}>Personalizar ›</Text>
          </Pressable>
        </View>
      </View>

      <Section title="Todos los rangos" onPress={() => router.push('/aura/rangos')} />
      <ScrollView
        horizontal
        style={styles.scrollRow}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.horizontal}
      >
        {ranks.map((rank, index) => {
          const isCurrent = rank === rankProgress.rank;
          const isLocked = index > currentRankIndex;
          return (
            <Pressable
              key={rank}
              onPress={() => router.push('/aura/rangos')}
              accessibilityRole="button"
              accessibilityLabel={`Ver rango ${rank}`}
              style={[styles.rankTile, isCurrent && styles.selected]}
            >
              <View style={isLocked && styles.locked}>
                <RankInsignia rank={rank} size={46} />
              </View>
              <Text style={styles.tileTitle}>{rank}</Text>
              <Text style={styles.meta}>
                {isCurrent ? 'Actual' : isLocked ? 'Por descubrir' : 'Disponible'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Section title="Tu progreso general" />
      <View style={styles.stats}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.stat}>
            <Ionicons name={stat.icon} size={21} color={theme.colors.primarySoft} />
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <Section title="Misiones destacadas" onPress={openMissions} />
      {featuredMissions.map((mission) => (
        <Pressable
          key={mission.id}
          onPress={() => setSelectedMission(mission)}
          accessibilityRole="button"
          accessibilityLabel={`Ver misión ${mission.title}`}
          style={styles.mission}
        >
          <View style={styles.missionIcon}>
            <Ionicons
              name={mission.icon}
              size={24}
              color={mission.id === 'romance' ? theme.colors.accent : theme.colors.primarySoft}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.title}>{mission.title}</Text>
            <Text style={styles.meta}>{mission.description}</Text>
            <Progress value={mission.value} total={mission.total} />
            <Text style={styles.meta}>
              {mission.value} / {mission.total}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={theme.colors.primarySoft} />
        </Pressable>
      ))}

      <Pressable
        onPress={() => router.push('/aura/rangos')}
        accessibilityRole="button"
        accessibilityLabel="Personalizar sufijo"
        style={styles.suffix}
      >
        <Ionicons name="sparkles" size={29} color={theme.colors.primarySoft} />
        <View style={styles.flex}>
          <Text style={styles.meta}>Tu sufijo actual</Text>
          <Text style={styles.rankName}>-kun</Text>
          <Text style={styles.meta}>Se muestra junto al nombre visible.</Text>
        </View>
        <Avatar size={32} />
        <Text style={styles.preview}>{currentUser.name}-kun</Text>
      </Pressable>

      <Section title="Más de tu Aura" />
      <View style={styles.actions}>
        <View style={styles.flex}>
          <Action
            label="Ranking de usuarios"
            icon="podium-outline"
            onPress={() => router.push('/aura/ranking')}
          />
        </View>
        <View style={styles.flex}>
          <Action
            label="Tu perfil anime"
            icon="sparkles-outline"
            onPress={() => router.push('/aura/analisis')}
          />
        </View>
      </View>
      <Text style={styles.notice}>Progreso, beneficios y misiones de ejemplo.</Text>

      <Dialog
        visible={selectedMission !== null}
        title={selectedMission?.title ?? ''}
        text={
          selectedMission
            ? `${selectedMission.description} Progreso de ejemplo: ${selectedMission.value}/${selectedMission.total}. Recompensa decorativa: ${selectedMission.reward}.`
            : ''
        }
        onClose={() => setSelectedMission(null)}
      >
        <Action label="Ver misiones y logros" onPress={openMissions} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  scrollRow: { flexGrow: 0 },
  rankCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  rankSide: { flex: 1.5, minWidth: 155, gap: 10 },
  rankIdentity: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  locked: { opacity: 0.45 },
  rankName: { color: theme.colors.primarySoft, fontSize: 17, fontWeight: '700' },
  pill: {
    color: theme.colors.primarySoft,
    fontSize: 11,
    marginTop: 5,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 9,
    alignSelf: 'flex-start',
  },
  benefits: {
    flex: 1,
    minWidth: 100,
    gap: 10,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.border,
    paddingLeft: 12,
  },
  benefit: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  meta: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 15 },
  link: { color: theme.colors.primarySoft, fontSize: 12, paddingVertical: 4 },
  horizontal: { gap: 8 },
  rankTile: {
    width: 88,
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
  },
  selected: { borderColor: theme.colors.primary },
  tileTitle: { color: theme.colors.primarySoft, fontSize: 11, fontWeight: '600' },
  stats: {
    flexDirection: 'row',
    paddingVertical: 13,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stat: { flex: 1, gap: 5, alignItems: 'center' },
  statValue: { color: theme.colors.text, fontSize: 17, fontWeight: '600' },
  statLabel: { color: theme.colors.textSecondary, fontSize: 10 },
  mission: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  missionIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: theme.colors.text, fontSize: 13, fontWeight: '600', marginBottom: 3 },
  suffix: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  preview: { color: theme.colors.text, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  notice: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
