import { Screen } from '../../src/components';
import { useQuery } from '../../src/remote';
import { LoadState } from '../../src/remote-ui';
import { MissionCard } from '../../src/aura-ui';
import type { Mission } from '../../src/models';
export default function Misiones() {
  const result = useQuery<{ items: Mission[] }>('/me/missions');
  return (
    <Screen title="Misiones" back>
      {result.data && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {result.data ? (
        result.data.items.map((mission) => <MissionCard key={mission.id} mission={mission} />)
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
