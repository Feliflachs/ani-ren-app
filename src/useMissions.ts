import type { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from './context/RemoteContext';
export function useMissions() {
  const query = useQuery('/me/aura');
  const data = query.data;
  const missions: {
    id: string;
    title: string;
    description: string;
    reward: string;
    icon: ComponentProps<typeof Ionicons>['name'];
    state: string;
    claimed: boolean;
    value: number;
    total: number;
    points: number;
  }[] = (data?.missions ?? []).map((mission: any) => ({
    ...mission,
    id: mission.id as string,
    title: mission.title as string,
    description: mission.description as string,
    reward: `${mission.points} puntos`,
    icon: mission.icon as ComponentProps<typeof Ionicons>['name'],
    state:
      mission.state === 'completed'
        ? 'Completada'
        : mission.state === 'in_progress'
          ? 'En curso'
          : 'Pendiente',
  }));
  return {
    ...query,
    missions,
    claimedIds: missions
      .filter((item: any) => item.claimed)
      .map((item: any) => item.id) as string[],
    featuredMissions: ((data?.featuredMissionIds ?? []) as string[]).flatMap((id: string) => {
      const mission = missions.find((item) => item.id === id);
      return mission ? [mission] : [];
    }),
    rankProgress: {
      rank: data?.rank?.name ?? 'Novato',
      progress: data?.rank?.progress ?? 0,
      nextRank: data?.rank?.nextRank as string | undefined,
      total: data?.rank?.nextThreshold ?? data?.points ?? 1,
    },
    points: data?.points ?? 0,
  };
}
