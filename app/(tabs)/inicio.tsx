import { useState } from 'react';
import { Image } from 'react-native';
import { Action, Chips, Screen, PublicationCard } from '../../src/components';
import { usePage } from '../../src/remote';
import { PageEnd, Pending } from '../../src/remote-ui';
import type { Publication } from '../../src/models';
export default function Inicio() {
  const [tab, setTab] = useState('Para ti');
  const page = usePage<Publication>(
    tab === 'Tendencia' ? null : '/feed?type=' + (tab === 'Siguiendo' ? 'following' : 'for-you'),
  );
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
        options={['Para ti', 'Siguiendo', 'Tendencia']}
        value={tab}
        onChange={setTab}
        variant="underline"
      />
      {tab === 'Tendencia' ? (
        <Pending text="Las tendencias estarán disponibles más adelante." />
      ) : (
        <>
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
