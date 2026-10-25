import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Chips, Dialog, EmptyState, Progress, Screen } from '../../src/components';
import { QueryFooter } from '../../src/remote-ui';
import { useMissions } from '../../src/useMissions';
import { theme } from '../../src/theme';

const missionFilters = ['Todas', 'Pendiente', 'En curso', 'Completada'];
const achievementFilters = ['Todos', 'Obtenidos', 'Bloqueados'];

export default function MissionsScreen() {
  const query = useMissions();
  const { missions: auraMissions, claimedIds } = query;
  const [tab, setTab] = useState('Misiones');
  const [filter, setFilter] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedMission = auraMissions.find((mission) => mission.id === selectedId);

  const showingAchievements = tab === 'Logros';

  const visibleMissions = auraMissions.filter((mission) => {
    if (filter === 'Todas' || filter === 'Todos') return true;
    if (!showingAchievements) return mission.state === filter;
    if (filter === 'Obtenidos') return claimedIds.includes(mission.id);
    return !claimedIds.includes(mission.id) && mission.state !== 'Completada';
  });

  const changeTab = (nextTab: string) => {
    setTab(nextTab);
    setFilter(nextTab === 'Misiones' ? 'Todas' : 'Todos');
  };

  return (
    <Screen
      title="Misiones y logros"
      subtitle="Pequeños objetivos para seguir descubriendo anime."
      back
    >
      <Chips options={['Misiones', 'Logros']} value={tab} onChange={changeTab} />
      <Chips
        options={showingAchievements ? achievementFilters : missionFilters}
        value={filter}
        onChange={setFilter}
      />
      <Text style={styles.notice}>Cada misión completada suma puntos automáticamente.</Text>

      {visibleMissions.map((mission) => {
        const rewardClaimed = claimedIds.includes(mission.id);
        const achievementState = rewardClaimed ? 'Obtenido' : 'Bloqueado';

        return (
          <Pressable
            key={mission.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${showingAchievements ? mission.reward : mission.title}`}
            onPress={() => setSelectedId(mission.id)}
            style={styles.card}
          >
            <View style={styles.top}>
              <View style={styles.icon}>
                <Ionicons
                  name={
                    showingAchievements && !rewardClaimed ? 'lock-closed-outline' : mission.icon
                  }
                  size={27}
                  color={theme.colors.primarySoft}
                />
              </View>
              <View style={styles.flex}>
                <Text style={styles.title}>
                  {showingAchievements ? mission.reward : mission.title}
                </Text>
                <Text style={styles.meta}>
                  {showingAchievements ? achievementState : mission.state}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primarySoft} />
            </View>
            <Text style={styles.body}>{mission.description}</Text>
            {!showingAchievements && (
              <Progress value={mission.value} total={mission.total} label="Progreso" />
            )}
            <Text style={styles.reward}>✧ {mission.reward}</Text>
          </Pressable>
        );
      })}

      <QueryFooter query={query} />
      {!query.loading && !query.error && visibleMissions.length === 0 && (
        <EmptyState
          title="Sin objetivos en este filtro"
          text="Probá otro estado para ver las misiones."
        />
      )}

      <Dialog
        visible={!!selectedMission}
        title={
          showingAchievements ? (selectedMission?.reward ?? '') : (selectedMission?.title ?? '')
        }
        text={
          selectedMission
            ? `${selectedMission.description} Recompensa: ${selectedMission.reward}. Estado: ${selectedMission.state}.`
            : ''
        }
        onClose={() => setSelectedId(null)}
      >
        {selectedMission?.state === 'Completada' ? (
          <>
            <Text style={styles.meta}>Los puntos se sumaron automáticamente a tu cuenta.</Text>
          </>
        ) : selectedMission ? (
          <Text style={styles.body}>
            La recompensa está bloqueada hasta completar el objetivo. El progreso cambia con tu
            actividad.
          </Text>
        ) : null}
        <Action
          label="Ver rangos y decoradores"
          onPress={() => {
            setSelectedId(null);
            router.push('/aura/rangos');
          }}
        />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  notice: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  card: {
    gap: 11,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  top: { flexDirection: 'row', gap: 11, alignItems: 'center' },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: theme.colors.text, fontWeight: '600', fontSize: 15 },
  meta: { color: theme.colors.primarySoft, fontSize: 11, marginTop: 5 },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 19 },
  reward: { color: theme.colors.primarySoft, fontSize: 12 },
});
