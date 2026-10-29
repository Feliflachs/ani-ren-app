import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter, withResources } from '../../src/remote-ui';
import { adaptAnime, genreIds } from '../../src/api/remote';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AnimeCard, Chips, EmptyState, Screen, Section } from '../../src/components';
import { genres, getParam } from '../../src/data';
import { theme } from '../../src/theme';

function TopsScreen() {
  const params = useLocalSearchParams();
  const criterionOptions = ['Mejor puntuados', 'Más vistos', 'Más populares'];
  const requestedCriterion = getParam(params.criterion);
  const [criterion, setCriterion] = useState(
    criterionOptions.find((option) => option === requestedCriterion) ?? 'Mejor puntuados',
  );
  const [period, setPeriod] = useState('Esta semana');
  const [genre, setGenre] = useState('Todos los géneros');
  const page = usePage('/explore/tops', {
    criterion:
      criterion === 'Mejor puntuados'
        ? 'rating'
        : criterion === 'Más vistos'
          ? 'views'
          : 'trending',
    period: period === 'Esta semana' ? 'week' : period === 'Este mes' ? 'month' : 'all',
    genre: genreIds.get(genre),
  });
  const results = page.items.map((row) => ({
    ...adaptAnime(row.anime),
    rating: row.averageRating ?? 0,
    watched: row.views,
    popularity: row.popularity,
  }));
  return (
    <Screen title="Tops de anime" subtitle="Las historias que más conversación generan." back>
      <Chips
        options={criterionOptions}
        value={criterion}
        onChange={setCriterion}
        variant="underline"
      />
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
          <Text numberOfLines={1} style={[styles.position, index < 3 && styles.podium]}>
            #{index + 1}
          </Text>
          <AnimeCard item={item} width={70} unframed showTitle={false} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ver ${item.title}`}
            onPress={() =>
              router.push({ pathname: '/explorar/anime/[id]', params: { id: item.id } })
            }
            style={styles.info}
          >
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>{item.genres.slice(0, 2).join(' · ')}</Text>
            <Text style={styles.rating}>
              ★ {item.rating > 0 ? item.rating.toFixed(1) : '—'}{' '}
              <Text style={styles.meta}>/ 5</Text>
            </Text>
            <Text style={styles.meta}>{item.watched.toLocaleString('es-AR')} vistos</Text>
            {criterion === 'Más populares' && (
              <Text style={styles.meta}>Popularidad: {item.popularity} / 100</Text>
            )}
          </Pressable>
        </View>
      ))}
      <Text style={styles.disclaimer}>Actividad registrada en Ani-Ren.</Text>
      <QueryFooter query={page} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
  },
  position: {
    fontSize: 17,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    minWidth: 44,
    flexShrink: 0,
  },
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

export default withResources(TopsScreen, () => [['/explore']]);
