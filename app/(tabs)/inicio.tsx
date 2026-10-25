import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter } from '../../src/remote-ui';
import { adaptPublication } from '../../src/api/remote';
import { useState } from 'react';
import { Image } from 'react-native';
import { PublicationCard, Chips, EmptyState, Screen } from '../../src/components';

export default function Inicio() {
  const [filter, setFilter] = useState('Para ti');

  const page = usePage('/feed', {
    type: filter === 'Para ti' ? 'for-you' : filter === 'Siguiendo' ? 'following' : 'trending',
  });
  const feed = page.items.map(adaptPublication);

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
      <QueryFooter query={page} />
    </Screen>
  );
}
