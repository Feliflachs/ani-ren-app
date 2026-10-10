import { selectFeed } from '../../src/feed';
import { usePublications } from '../../src/context/PublicationsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { useState } from 'react';
import { Image } from 'react-native';
import { PublicationCard, Chips, EmptyState, Screen } from '../../src/components';
import { useAppState } from '../../src/context/AppState';

export default function Inicio() {
  const { publications, getLikedIds } = usePublications();

  const currentUser = useCurrentUser();

  const { followingIds, likedIds, watchlistIds } = useAppState();
  const [filter, setFilter] = useState('Para ti');

  const feed = selectFeed(
    publications,
    filter,
    currentUser.id,
    followingIds,
    likedIds,
    watchlistIds,
    getLikedIds(currentUser.id),
  );

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
        <PublicationCard key={item.id} review={item} feed />
      ))}
      {feed.length === 0 && (
        <EmptyState
          text={
            filter === 'Para ti'
              ? 'Todavía no hay publicaciones de otras personas que no sigas. Probá otro feed.'
              : 'Todavía no hay publicaciones acá. Seguí a otras personas o probá otro feed.'
          }
        />
      )}
    </Screen>
  );
}
