import { useSession } from './context/SessionContext';
import { useActivities } from './context/AppState';
import { useReviews } from './context/ReviewsContext';
import { calculateMissions } from './missions';

export function useMissions() {
  const { user } = useSession();
  const { getCollection, claimedByUser, claimReward } = useActivities();
  const { reviews } = useReviews();
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
