import { withResources } from '../../../src/remote-ui';
import { useDirectory } from '../../../src/useDirectory';
import { useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen } from '../../../src/components';
import { PerfilView } from '../../../src/PerfilView';
import { getParam } from '../../../src/data';

function UsuarioScreen() {
  const { findUser } = useDirectory();

  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const user = findUser(getParam(params.id));
  if (!user) {
    return (
      <Screen title="Perfil" back>
        <EmptyState title="Usuario no encontrado" text="No encontramos este perfil." />
      </Screen>
    );
  }
  return <PerfilView key={user.id} user={user} publicProfile />;
}

export default withResources(UsuarioScreen, (p) => [[`/users/${p.id}`]]);
