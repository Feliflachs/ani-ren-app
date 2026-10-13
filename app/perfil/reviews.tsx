import { useLocalSearchParams } from 'expo-router';
import { Screen, PublicationCard } from '../../src/components';
import { useSession } from '../../src/context/SessionContext';
import { usePage } from '../../src/remote';
import { query } from '../../src/api';
import { PageEnd } from '../../src/remote-ui';
import type { Publication } from '../../src/models';
export default function Reviews() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useSession();
  const page = usePage<Publication>(
    query('/publications', { userId: id ?? user?.id, kind: 'review' }),
  );
  return (
    <Screen title="Reviews" back>
      {page.items.map((review) => (
        <PublicationCard key={review.id} review={review} />
      ))}
      <PageEnd page={page} />
    </Screen>
  );
}
