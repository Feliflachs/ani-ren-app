import { Text, View } from 'react-native';
import { Action, Progress } from './components';
import { useMutation } from './remote';
import { Notice, ui } from './remote-ui';
import type { Mission } from './models';
export function MissionCard({ mission }: { mission: Mission }) {
  const mutation = useMutation();
  return (
    <View style={ui.card}>
      <Text style={ui.title}>{mission.title}</Text>
      <Text style={ui.text}>{mission.description}</Text>
      <Progress value={mission.value} total={mission.total} label="Progreso" />
      <Text style={ui.accent}>Recompensa: {mission.reward}</Text>
      <Action
        label={
          mission.claimed ? 'Reclamada' : mutation.pending ? 'Reclamando…' : 'Reclamar recompensa'
        }
        disabled={mission.claimed || mission.state !== 'completed' || mutation.pending}
        onPress={() =>
          void mutation.run('/me/missions/' + encodeURIComponent(mission.id) + '/claim', {
            method: 'PUT',
          })
        }
      />
      <Notice error={mutation.error} />
    </View>
  );
}
