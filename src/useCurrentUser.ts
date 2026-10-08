import { useSession } from './context/SessionContext';
import { useDirectory } from './useDirectory';

// Para pantallas protegidas que necesitan una cuenta activa.
export function useCurrentUser() {
  const { user } = useSession();
  const { findUser } = useDirectory();
  if (!user) throw new Error('Esta pantalla requiere una sesión');
  const profile = findUser(user.id);
  if (!profile) throw new Error('Perfil no encontrado');
  return profile;
}
