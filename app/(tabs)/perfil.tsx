import { PerfilView } from '../../src/PerfilView';
import { useSession } from '../../src/context/SessionContext';
export default function Perfil() {
  const { user } = useSession();
  return user ? <PerfilView id={user.id} /> : null;
}
