import { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, ImageBackground, Pressable } from 'react-native';
import { Action, Screen, SearchBar, Section } from '../../src/components';
import { Pending, ui } from '../../src/remote-ui';
const genres = [
  ['Acción', 'mal:1'],
  ['Comedia', 'mal:4'],
  ['Fantasía', 'mal:10'],
  ['Romance', 'mal:22'],
  ['Aventura', 'mal:2'],
  ['Drama', 'mal:8'],
  ['Deportes', 'mal:30'],
];
const seasons = [
  ['Primavera', require('../../assets/seasons/primavera.jpg')],
  ['Verano', require('../../assets/seasons/verano.jpg')],
  ['Otoño', require('../../assets/seasons/otono.jpg')],
  ['Invierno', require('../../assets/seasons/invierno.jpg')],
] as const;
export default function Explorar() {
  const [q, setQ] = useState('');
  return (
    <Screen
      title="Explorar"
      subtitle="Descubrí anime y recomendaciones de la comunidad."
      avatar={false}
    >
      <SearchBar
        value={q}
        onChangeText={setQ}
        onSubmit={() => router.push({ pathname: '/explorar/busqueda', params: { q } })}
      />
      <Section title="Explorar por género" />
      <View style={ui.wrap}>
        {genres.map(([name, genre]) => (
          <Action
            key={genre}
            label={name}
            onPress={() =>
              router.push({
                pathname: '/explorar/busqueda',
                params: { type: 'Publicaciones', genre },
              })
            }
          />
        ))}
      </View>
      <View style={ui.card}>
        <Text style={ui.title}>Mapa anime mundial</Text>
        <Pending text="Las estadísticas por país todavía no están disponibles." />
      </View>
      <Section title="Comunidad" />
      <View style={ui.wrap}>
        {['Usuarios', 'Publicaciones', 'Listas'].map((type) => (
          <Action
            key={type}
            label={type}
            onPress={() => router.push({ pathname: '/explorar/busqueda', params: { type } })}
          />
        ))}
      </View>
      <Section title="Tendencias globales" />
      <Pending text="Los tops de anime estarán disponibles más adelante." />
      <Section title="Recomendaciones por temporada" />
      <View style={ui.wrap}>
        {seasons.map(([season, image]) => (
          <Pressable
            key={season}
            style={{ width: '47%' }}
            onPress={() =>
              router.push({
                pathname: '/explorar/busqueda',
                params: { type: 'Publicaciones', season },
              })
            }
          >
            <ImageBackground
              source={image}
              imageStyle={{ borderRadius: 12 }}
              style={{ height: 95, justifyContent: 'flex-end' }}
            >
              <Text style={[ui.title, { padding: 10, backgroundColor: 'rgba(0,0,0,0.55)' }]}>
                {season}
              </Text>
            </ImageBackground>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
