import { createContext, useContext, useState, type ReactNode } from 'react';
import { users as initialUsers, type User } from '../mock';

// Identidad editable. Los IDs y nombres de acceso permanecen inmutables.
function useProfilesState() {
  const [profiles, setProfiles] = useState(() =>
    initialUsers.map(({ id, name, handle, bio, image }) => ({ id, name, handle, bio, image })),
  );
  function updateProfile(id: string, changes: Pick<User, 'name' | 'bio' | 'image'>) {
    setProfiles((previous) =>
      previous.map((user) => (user.id === id ? { ...user, ...changes } : user)),
    );
  }
  return { profiles, updateProfile };
}
const ProfilesContext = createContext<ReturnType<typeof useProfilesState> | null>(null);
export function ProfilesProvider({ children }: { children: ReactNode }) {
  return <ProfilesContext.Provider value={useProfilesState()}>{children}</ProfilesContext.Provider>;
}
export function useProfiles() {
  const value = useContext(ProfilesContext);
  if (!value) throw new Error('Falta ProfilesProvider');
  return value;
}
