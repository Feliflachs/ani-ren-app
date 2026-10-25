import { useProfiles } from './context/ProfilesContext';
export function useDirectory() {
  const { profiles } = useProfiles();
  return {
    users: profiles,
    findUser: (id: string | undefined) => profiles.find((user) => user.id === id),
  };
}
