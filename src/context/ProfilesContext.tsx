import { Fragment, type ReactNode } from 'react';
import { useRemote } from './RemoteContext';
import { useSession } from './SessionContext';
import { users } from '../data';
export function ProfilesProvider({ children }: { children: ReactNode }) {
  return <Fragment>{children}</Fragment>;
}
export function useProfiles() {
  const store = useRemote();
  const { user, updateProfile } = useSession();
  return {
    profiles: users,
    current: users.find((item) => item.id === user?.id),
    updateProfile: async (id: string, changes: { name: string; bio: string; image: unknown }) => {
      if (id !== user?.id) throw new Error('Solo podés editar tu perfil.');
      await updateProfile({ name: changes.name, bio: changes.bio });
      await store.load(`/users/${id}`, {}, true);
    },
  };
}
