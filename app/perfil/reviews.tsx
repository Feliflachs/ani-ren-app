import { useLocalSearchParams } from 'expo-router';
import { EmptyState, PublicationCard, Screen } from '../../src/components';
import { usePublications } from '../../src/context/PublicationsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { useDirectory } from '../../src/useDirectory';
import { getParam } from '../../src/mock';

export default function ReviewsScreen() {
  const params = useLocalSearchParams();
  const currentUser = useCurrentUser();
  const { findUser } = useDirectory();
  const { reviews } = usePublications();
  const user = findUser(getParam(params.id) ?? currentUser.id);
  // TODO BACKEND [PERFIL-REVIEWS]: consultar reviews por usuario con paginación mediante PublicationsContext.
  const userReviews = reviews
    .filter((review) => review.userId === user?.id)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  return (
    <Screen title="Reviews" subtitle={user ? `Todas las reviews de ${user.name}` : undefined} back>
      {!user ? (
        <EmptyState title="Usuario no encontrado" />
      ) : userReviews.length === 0 ? (
        <EmptyState text="Todavía no hay reviews en este perfil." />
      ) : (
        userReviews.map((review) => <PublicationCard key={review.id} review={review} />)
      )}
    </Screen>
  );
}
