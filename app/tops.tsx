import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimeCard, Chips, EmptyState, Screen, Section } from '../src/components';
import { anime, genres, getParam } from '../src/mock';
import { theme } from '../src/theme';

export default function TopsScreen() {
  const params = useLocalSearchParams();
  const criterionOptions = ['Mejor puntuados', 'Más vistos', 'Más populares'];
  const requestedCriterion = getParam(params.criterion);
  const [criterion, setCriterion] = useState(
    criterionOptions.find((option) => option === requestedCriterion) ?? 'Mejor puntuados',
  );
  const [period, setPeriod] = useState('Esta semana');
  const [genre, setGenre] = useState('Todos los géneros');
  // TODO BACKEND [TOPS]: consultar ranking por período, género y criterio; el recorte actual representa conjuntos de ejemplo.
  const periodItems =
    period === 'Esta semana'
      ? anime.slice(0, 5)
      : period === 'Este mes'
        ? anime.slice(0, 7)
        : anime;
  const results = periodItems
    .filter((item) => genre === 'Todos los géneros' || item.genres.includes(genre))
    .sort((a, b) =>
      criterion === 'Mejor puntuados'
        ? b.rating - a.rating
        : criterion === 'Más vistos'
          ? b.watched - a.watched
          : b.popularity - a.popularity,
    );
  return (
    <Screen title="Tops de anime" subtitle="Las historias que más conversación generan." back>
      <Chips options={criterionOptions} value={criterion} onChange={setCriterion} />
      <Chips
        options={['Esta semana', 'Este mes', 'Todo el tiempo']}
        value={period}
        onChange={setPeriod}
      />
      <Chips options={['Todos los géneros', ...genres]} value={genre} onChange={setGenre} />
      <Section title={`${criterion} · ${results.length}`} />
      {results.length === 0 && (
        <EmptyState
          title="Sin anime en este top"
          text="Elegí otro género o un período más amplio."
        />
      )}
      {results.map((item, index) => (
        <View key={item.id} style={styles.card}>
          <Text style={[styles.position, index < 3 && styles.podium]}>#{index + 1}</Text>
          <AnimeCard item={item} width={70} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver ${item.title}`}
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: item.id } })}
            style={styles.info}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.genres.slice(0, 2).join(' · ')}</Text>
            <Text style={styles.rating}>
              ★ {item.rating.toFixed(1)} <Text style={styles.meta}>/ 5</Text>
            </Text>
            <Text style={styles.meta}>{item.watched.toLocaleString('es-AR')} vistos</Text>
            {criterion === 'Más populares' && (
              <Text style={styles.meta}>Popularidad: {item.popularity} / 100</Text>
            )}
          </Pressable>
        </View>
      ))}
      <Text style={styles.disclaimer}>Ranking y períodos con datos de ejemplo.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  position: { fontSize: 17, color: theme.colors.textSecondary, fontWeight: '700', width: 28 },
  podium: { color: theme.colors.primarySoft },
  info: { flex: 1, minWidth: 0, gap: 7 },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16 },
  rating: { color: theme.colors.primarySoft, fontSize: 16, fontWeight: '700' },
  disclaimer: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
