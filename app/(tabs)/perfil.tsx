import { useCurrentUser } from '../../src/useCurrentUser';
import { PerfilView } from '../../src/PerfilView';

export default function PerfilScreen() {
  const currentUser = useCurrentUser();

  return <PerfilView user={currentUser} />;
}
