import { router } from 'expo-router';
import { Text, View, ScrollView } from 'react-native';
import { Screen, Action, Section, Progress, RankInsignia } from '../../src/components';
import { useQuery } from '../../src/remote';
import { LoadState, ui } from '../../src/remote-ui';
import { MissionCard } from '../../src/aura-ui';
import type { Aura } from '../../src/models';
export default function AuraScreen() {
  const result = useQuery<Aura>('/me/aura'),
    aura = result.data;
  return (
    <Screen
      title="Aura🔥"
      subtitle="Mirá tu progreso y descubrí nuevos rangos."
      avatar={false}
      actions={
        <Action
          label="Ranking"
          icon="podium-outline"
          onPress={() => router.push('/aura/ranking')}
        />
      }
    >
      {aura && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {aura ? (
        <>
          <View style={ui.card}>
            <View style={ui.row}>
              <RankInsignia rank={aura.rank.name} size={64} />
              <View>
                <Text style={ui.muted}>Rango actual</Text>
                <Text style={ui.title}>{aura.rank.name}</Text>
              </View>
            </View>
            <Progress
              value={aura.statistics.watched}
              total={aura.rank.nextThreshold ?? aura.rank.threshold}
              label="Animes vistos"
            />
            <Text style={ui.muted}>
              {aura.rank.nextRank
                ? 'Próximo rango: ' + aura.rank.nextRank + ' · Faltan ' + aura.rank.remaining
                : 'Alcanzaste el último rango'}
            </Text>
          </View>
          <Section title="Todos los rangos" onPress={() => router.push('/aura/rangos')} />
          <ScrollView horizontal contentContainerStyle={{ gap: 10 }}>
            {aura.ranks.map((rank) => (
              <View
                key={rank.name}
                style={[ui.card, { alignItems: 'center', opacity: rank.unlocked ? 1 : 0.5 }]}
              >
                <RankInsignia rank={rank.name} size={46} />
                <Text style={ui.accent}>{rank.name}</Text>
                <Text style={ui.muted}>{rank.threshold} vistos</Text>
              </View>
            ))}
          </ScrollView>
          <Section title="Tu progreso general" />
          <View style={ui.wrap}>
            {[
              ['Animes vistos', aura.statistics.watched],
              ['Favoritos', aura.statistics.favorites],
              ['Reviews', aura.statistics.reviews],
              ['Watchlist', aura.statistics.watchlist],
            ].map(([label, value]) => (
              <View key={label} style={[ui.card, { width: '47%', alignItems: 'center' }]}>
                <Text style={ui.title}>{value}</Text>
                <Text style={ui.muted}>{label}</Text>
              </View>
            ))}
          </View>
          <Section title="Misiones destacadas" onPress={() => router.push('/aura/misiones')} />
          {aura.missions.slice(0, 3).map((mission) => (
            <MissionCard key={mission.id} mission={mission} />
          ))}
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
