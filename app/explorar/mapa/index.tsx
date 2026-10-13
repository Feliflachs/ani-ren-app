import { Screen } from '../../../src/components';
import { Pending } from '../../../src/remote-ui';
export default function PendingScreen() {
  return (
    <Screen title="Mapa anime mundial" back>
      <Pending text="Las estadísticas por país estarán disponibles más adelante." />
    </Screen>
  );
}
