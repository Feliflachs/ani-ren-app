import { useState } from 'react';
import { Image, Text } from 'react-native';
import { Action, Chips, Screen, PublicationCard } from '../../src/components';
import { usePage } from '../../src/remote';
import { PageEnd, ui } from '../../src/remote-ui';
import type { Publication, DiscoveryItem } from '../../src/models';
import { DiscoveryCard } from '../../src/DiscoveryCard';
export default function Inicio() {
  const [tab, setTab] = useState('Para ti');
  const page = usePage<Publication>(
    tab === 'Descubrir' ? null : '/feed?type=' + (tab === 'Siguiendo' ? 'following' : 'for-you'),
  );
  const discovery = usePage<DiscoveryItem>(tab === 'Descubrir' ? '/discover' : null);
  return (
    <Screen
      title={
        <>
          Ani-Ren{' '}
          <Image
            source={require('../../assets/mascota-login.png')}
            style={{ width: 42, height: 42 }}
          />
        </>
      }
      avatar={false}
      headerCentered
    >
      <Chips
        options={['Para ti', 'Siguiendo', 'Descubrir']}
        value={tab}
        onChange={setTab}
        variant="underline"
      />
      {tab === 'Descubrir' ? (
        <>
          <Text style={ui.text}>Encontrá tu próximo anime, con opiniones de la comunidad.</Text>
          <Action
            label="Actualizar"
            icon="refresh-outline"
            disabled={discovery.loading}
            onPress={discovery.reload}
          />
          {discovery.items.map((item) => (
            <DiscoveryCard key={item.id} item={item} />
          ))}
          <PageEnd page={discovery} />
        </>
      ) : (
        <>
          <Text style={ui.muted}>
            {tab === 'Siguiendo'
              ? 'Las últimas conversaciones de las personas que seguís.'
              : 'Opiniones, descubrimientos y conversaciones para tus gustos.'}
          </Text>
          <Action
            label="Actualizar"
            icon="refresh-outline"
            disabled={page.loading}
            onPress={page.reload}
          />
          {page.items.map((review) => (
            <PublicationCard key={review.id} review={review} feed />
          ))}
          <PageEnd page={page} />
        </>
      )}
    </Screen>
  );
}
