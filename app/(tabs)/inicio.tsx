import { useReviews } from '../../src/context/ReviewsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { useState } from 'react';
import { Image } from 'react-native';
import { ReviewCard, Chips, EmptyState, Screen } from '../../src/components';
import { useAppState } from '../../src/context/AppState';

export default function Inicio() {
  const { reviews } = useReviews();

  const currentUser = useCurrentUser();

  const { followingIds, friendIds } = useAppState();
  const [filter, setFilter] = useState('Para ti');

  // TODO BACKEND [SOCIAL-FEED]: consultar el feed con texto, filtro y usuario; hoy son relaciones y publicaciones de ejemplo.
  const feed = reviews
    .filter((item) => {
      if (filter === 'Para ti') {
        return item.userId === currentUser.id || friendIds.includes(item.userId);
      }

      if (filter === 'Siguiendo') {
        return followingIds.includes(item.userId);
      }

      return true;
    })
    .sort((a, b) => {
      if (filter === 'Tendencia') {
        const interactionsA = a.likes + a.comments;
        const interactionsB = b.likes + b.comments;

        return interactionsB - interactionsA;
      }

      return 0;
    });

  return (
    <Screen
      title={
        <>
          Ani-Ren{' '}
          <Image
            source={require('../../assets/mascota-transparente.png')}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
            accessibilityLabel="Símbolo de Ani-ren"
          />
        </>
      }
      avatar={false}
      headerCentered
    >
      <Chips
        options={['Para ti', 'Siguiendo', 'Tendencia']}
        value={filter}
        onChange={setFilter}
        variant="underline"
      />
      {feed.map((item) => (
        <ReviewCard key={item.id} review={item} feed />
      ))}
      {feed.length === 0 && <EmptyState text="Seguí a otras personas o elegí otro feed." />}
    </Screen>
  );
}
