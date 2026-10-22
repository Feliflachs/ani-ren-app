import { useState } from 'react';
import { router } from 'expo-router';
import { Text } from 'react-native';
import { Screen, Chips, Action } from '../../src/components';
import { AnimePicker, ui } from '../../src/remote-ui';
export default function Crear() {
  const [tab, setTab] = useState('Posteo');
  return (
    <Screen title="Crear" subtitle="Compartí lo que te gusta.">
      <Chips
        options={['Posteo', 'Review', 'Lista']}
        value={tab}
        onChange={setTab}
        variant="underline"
      />
      {tab === 'Posteo' ? (
        <>
          <Text style={ui.title}>¿De qué querés hablar?</Text>
          <Text style={ui.text}>
            Compartí una recomendación, una pregunta o una opinión con la comunidad.
          </Text>
          <Action label="Escribir posteo" primary onPress={() => router.push('/crear/posteo')} />
        </>
      ) : tab === 'Lista' ? (
        <>
          <Text style={ui.title}>Tus animes, a tu manera</Text>
          <Action
            label="Crear lista"
            primary
            onPress={() => router.push('/perfil/listas/editar')}
          />
        </>
      ) : (
        <>
          <Text style={ui.title}>Elegí un anime para tu review</Text>
          <AnimePicker
            onSelect={(anime) =>
              router.push({ pathname: '/crear/review/escribir', params: { animeId: anime.id } })
            }
          />
        </>
      )}
    </Screen>
  );
}
