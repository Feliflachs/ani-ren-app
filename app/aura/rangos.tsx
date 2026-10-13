import { Text, View } from 'react-native';
import { Screen, RankInsignia, Section } from '../../src/components';
import { useQuery } from '../../src/remote';
import { LoadState, ui } from '../../src/remote-ui';
import type { Aura } from '../../src/models';
export default function Rangos() {
  const result = useQuery<Aura>('/me/aura');
  return (
    <Screen title="Rangos y recompensas" back>
      {result.data && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {result.data ? (
        <>
          {result.data.ranks.map((rank) => (
            <View key={rank.name} style={[ui.card, ui.row]}>
              <RankInsignia rank={rank.name} size={52} />
              <View>
                <Text style={ui.title}>{rank.name}</Text>
                <Text style={ui.muted}>
                  {rank.threshold} animes vistos ·{' '}
                  {rank.unlocked ? 'Desbloqueado' : 'Por descubrir'}
                </Text>
              </View>
            </View>
          ))}
          <Section title="Recompensas obtenidas" />
          {result.data.rewards.map((reward) => (
            <Text key={reward.rewardId} style={ui.text}>
              {reward.reward}
            </Text>
          ))}
          <Text style={ui.muted}>Equipar decoradores estará disponible más adelante.</Text>
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
