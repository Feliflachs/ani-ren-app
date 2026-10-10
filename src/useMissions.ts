import { useSession } from './context/SessionContext';
import { useActivities } from './context/AppState';
import { usePublications } from './context/PublicationsContext';
import { calculateMissions } from './missions';

export function useMissions() {
  // TODO BACKEND [MISIONES-PROGRESO]: consultar progreso global del usuario; no calcularlo desde páginas incompletas de actividad.
  const { user } = useSession();
  const { getCollection, claimedByUser, claimReward } = useActivities();
  const { reviews } = usePublications();
  const userId = user?.id ?? '';
  const missions = calculateMissions(
    getCollection(userId).watchedIds,
    reviews.filter((review) => review.userId === userId),
  );
  return {
    missions,
    claimedIds: claimedByUser[userId] ?? [],
    claimReward: (id: string) => {
      if (user && missions.some((mission) => mission.id === id && mission.state === 'Completada'))
        claimReward(userId, id);
    },
  };
}
