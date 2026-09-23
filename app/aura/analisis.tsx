import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, Chips, Progress, Screen, Section } from '../../src/components';
import { currentUser } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [AURA-IA]: sustituir ejemplos por el análisis autorizado del historial del usuario.
const samples = [
  {
    name: 'Romance',
    title: 'Sanji',
    genres: [
      { name: 'Romance', value: 68 },
      { name: 'Comedia', value: 22 },
      { name: 'Drama', value: 10 },
    ],
    habit: 'Buscás personajes que conectan y pequeños momentos que se quedan.',
    description:
      'En este ejemplo, disfrutás las historias donde los vínculos llevan el relato. El romance y la comedia te acompañan, pero también te atraen los personajes que crecen a través de sus emociones.',
  },
  {
    name: 'Fantasía',
    title: 'Viajero',
    genres: [
      { name: 'Fantasía', value: 61 },
      { name: 'Aventura', value: 25 },
      { name: 'Drama', value: 14 },
    ],
    habit: 'Te gusta explorar mundos nuevos y seguir viajes con calma.',
    description:
      'En este ejemplo, encontrás tu lugar en mundos de fantasía y aventuras largas. Te interesan los universos con historia propia y los viajes donde importa tanto el camino como el destino.',
  },
  {
    name: 'Acción',
    title: 'Espíritu shonen',
    genres: [
      { name: 'Acción', value: 72 },
      { name: 'Deportes', value: 18 },
      { name: 'Comedia', value: 10 },
    ],
    habit: 'Buscás desafíos, equipos y personajes que superan sus límites.',
    description:
      'En este ejemplo, disfrutás los enfrentamientos intensos y las historias de superación. Los equipos, la rivalidad y el crecimiento de los protagonistas hacen que siempre quieras ver un capítulo más.',
  },
];

export default function AnalysisScreen() {
  const [sample, setSample] = useState(samples[0]);

  const selectSample = (name: string) => {
    setSample(samples.find((item) => item.name === name) ?? samples[0]);
  };

  const showNextSample = () => {
    const currentIndex = samples.findIndex((item) => item.name === sample.name);
    setSample(samples[(currentIndex + 1) % samples.length]);
  };

  return (
    <Screen
      title="Tu perfil anime"
      subtitle="Una idea de cómo Aura podría describir tus gustos."
      back
    >
      <View style={styles.example}>
        <Ionicons name="sparkles-outline" size={22} color={theme.colors.primarySoft} />
        <Text style={styles.exampleText}>Resultado de ejemplo · IA no conectada</Text>
      </View>
      <Text style={styles.notice}>
        Estos textos y porcentajes son predeterminados. No se analizó tu historial real.
      </Text>
      <Chips
        options={samples.map((item) => item.name)}
        value={sample.name}
        onChange={selectSample}
      />

      <View style={styles.description}>
        <Text style={styles.cardTitle}>Tu estilo en este ejemplo</Text>
        <Text style={styles.body}>{sample.description}</Text>
      </View>

      <Section title="Géneros predominantes" />
      <View style={styles.description}>
        {sample.genres.map((genre) => (
          <View key={genre.name} style={styles.genre}>
            <View style={styles.genreHead}>
              <Text style={styles.body}>{genre.name}</Text>
              <Text style={styles.percent}>{genre.value}%</Text>
            </View>
            <Progress value={genre.value} total={100} />
          </View>
        ))}
      </View>

      <Section title="Hábitos de ejemplo" />
      <View style={styles.description}>
        <Ionicons name="moon-outline" size={23} color={theme.colors.primarySoft} />
        <Text style={styles.body}>{sample.habit}</Text>
      </View>

      <Section title="Título sugerido" />
      <View style={styles.suggestion}>
        <Avatar size={58} />
        <View style={styles.flex}>
          <Text style={styles.name}>{currentUser.name}-kun</Text>
          <Text style={styles.handle}>@{currentUser.handle}</Text>
          <Text style={styles.title}>{sample.title}-kun</Text>
        </View>
        <Ionicons name="ribbon-outline" size={28} color={theme.colors.primarySoft} />
      </View>
      <Action
        label="Previsualizar este decorador"
        primary
        icon="sparkles-outline"
        onPress={() => router.push({ pathname: '/aura/rangos', params: { titulo: sample.title } })}
      />
      <Action label="Ver otro ejemplo" onPress={showNextSample} />
      <Text style={styles.notice}>
        La sugerencia es decorativa. No cambia tu rango ni tu posición por cantidad de animes
        vistos.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  example: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryDark,
  },
  exampleText: { color: theme.colors.text, fontSize: 12, fontWeight: '600', flex: 1 },
  notice: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 18 },
  description: {
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
  },
  cardTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '600' },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21 },
  genre: { gap: 8 },
  genreHead: { flexDirection: 'row', justifyContent: 'space-between' },
  percent: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  suggestion: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  handle: { color: theme.colors.primarySoft, fontSize: 11, marginTop: 3 },
  title: { color: theme.colors.primarySoft, fontSize: 15, fontWeight: '600', marginTop: 7 },
});
