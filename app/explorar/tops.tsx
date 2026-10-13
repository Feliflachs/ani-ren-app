import { Screen } from '../../src/components';
import { Pending } from '../../src/remote-ui';
export default function PendingScreen() {
  return (
    <Screen title="Tops globales" back>
      <Pending text="Las tendencias globales todavía no están disponibles." />
    </Screen>
  );
}
