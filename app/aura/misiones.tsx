import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Chips, Dialog, EmptyState, Progress, Screen } from '../../src/components';
import { auraMissions } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [MISIONES]: recuperar misiones, progreso, recompensas y logros por usuario.
const missionFilters = ['Todas', 'Pendiente', 'En curso', 'Completada'];
const achievementFilters = ['Todos', 'Obtenidos', 'Bloqueados'];

export default function MissionsScreen() {
  const [tab, setTab] = useState('Misiones');
  const [filter, setFilter] = useState('Todas');
  const [selectedMission, setSelectedMission] = useState<(typeof auraMissions)[number] | null>(
    null,
  );
  const [claimedIds, setClaimedIds] = useState<string[]>([]);
  const showingAchievements = tab === 'Logros';

  const visibleMissions = auraMissions.filter((mission) => {
    if (filter === 'Todas' || filter === 'Todos') return true;
    if (!showingAchievements) return mission.state === filter;
    if (filter === 'Obtenidos') return claimedIds.includes(mission.id);
    return mission.state !== 'Completada';
  });

  // TODO BACKEND [RECOMPENSA]: validar la misión por id y confirmar la obtención real del badge.
  const claimReward = () => {
    if (!selectedMission || selectedMission.state !== 'Completada') return;
    setClaimedIds((currentIds) =>
      currentIds.includes(selectedMission.id) ? currentIds : [...currentIds, selectedMission.id],
    );
  };

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
      <Text style={styles.notice}>
        Objetivos y recompensas de ejemplo; no se recalcula tu historial.
      </Text>

      {visibleMissions.map((mission) => {
        const rewardClaimed = claimedIds.includes(mission.id);
        const achievementState = rewardClaimed
          ? 'Obtenido · simulación'
          : mission.state === 'Completada'
            ? 'Listo para recibir'
            : 'Bloqueado';

        return (
          <Pressable
            key={mission.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver ${showingAchievements ? mission.reward : mission.title}`}
            onPress={() => setSelectedMission(mission)}
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

      {visibleMissions.length === 0 && (
        <EmptyState
          title="Sin objetivos en este filtro"
          text="Probá otro estado para ver las misiones de ejemplo."
        />
      )}

      <Dialog
        visible={selectedMission !== null}
        title={
          showingAchievements ? (selectedMission?.reward ?? '') : (selectedMission?.title ?? '')
        }
        text={
          selectedMission
            ? `${selectedMission.description} Recompensa decorativa: ${selectedMission.reward}. Estado: ${selectedMission.state}.`
            : ''
        }
        onClose={() => setSelectedMission(null)}
      >
        {selectedMission?.state === 'Completada' ? (
          <>
            <Action
              label={
                claimedIds.includes(selectedMission.id)
                  ? 'Badge recibido · simulación'
                  : 'Recibir badge de ejemplo'
              }
              icon="ribbon-outline"
              disabled={claimedIds.includes(selectedMission.id)}
              onPress={claimReward}
            />
            <Text style={styles.meta}>La selección se mantiene solo en esta pantalla.</Text>
          </>
        ) : selectedMission ? (
          <Text style={styles.body}>
            La recompensa está bloqueada hasta completar el objetivo. Este progreso es ilustrativo.
          </Text>
        ) : null}
        <Action
          label="Ver rangos y decoradores"
          onPress={() => {
            setSelectedMission(null);
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
