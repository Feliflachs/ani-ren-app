import { useLocalSearchParams } from 'expo-router';
import { EmptyState, Screen } from '../../../src/components';
import { PerfilView } from '../../../src/PerfilView';
import { findUser, getParam } from '../../../src/mock';

export default function UsuarioScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const user = findUser(getParam(params.id));
  if (!user) {
    return (
      <Screen title="Perfil" back>
        <EmptyState title="Usuario no encontrado" text="Este perfil de ejemplo no existe." />
      </Screen>
    );
  }
  return <PerfilView key={user.id} user={user} publicProfile />;
}
