import { Screen } from '../../../src/components';
import { Pending } from '../../../src/remote-ui';
export default function PendingScreen() {
  return (
    <Screen title="Estadísticas del país" back>
      <Pending text="Todavía no hay estadísticas por país disponibles." />
    </Screen>
  );
}
