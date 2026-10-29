import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter } from '../../src/remote-ui';
import { adaptPublication } from '../../src/api/remote';
import { useLocalSearchParams } from 'expo-router';
import { EmptyState, PublicationCard, Screen } from '../../src/components';
import { usePublications } from '../../src/context/PublicationsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { useDirectory } from '../../src/useDirectory';
import { getParam } from '../../src/data';

export default function ReviewsScreen() {
  const params = useLocalSearchParams();
  const currentUser = useCurrentUser();
  const { findUser } = useDirectory();
  usePublications();
  const user = findUser(getParam(params.id) ?? currentUser.id);
  const page = usePage(`/users/${getParam(params.id) ?? currentUser.id}/publications`, {
    collection: 'reviews',
  });
  const userReviews = page.items.map(adaptPublication);
  return (
    <Screen title="Reviews" subtitle={user ? `Todas las reviews de ${user.name}` : undefined} back>
      {!user ? (
        <EmptyState title="Usuario no encontrado" />
      ) : userReviews.length === 0 ? (
        <EmptyState text="Todavía no hay reviews en este perfil." />
      ) : (
        userReviews.map((review) => <PublicationCard key={review.id} review={review} />)
      )}
      <QueryFooter query={page} />
    </Screen>
  );
}
