import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  EmptyState,
  Progress,
  ReviewCard,
  Screen,
  Section,
} from '../../src/components';
import {
  countries,
  findAnime,
  getCountryMetric,
  getCountryTop,
  getMapMetric,
  getParam,
  mapMetrics,
  reviews,
} from '../../src/mock';
import { theme } from '../../src/theme';
import { WorldMap } from '../../src/WorldMap';

// TODO BACKEND [REVIEWS-PAIS]: recuperar reviews locales por país; estas asociaciones son solo ejemplos.
const localReviewIds: Record<string, string[]> = {
  argentina: ['review-felipe', 'review-nico'],
  japon: ['review-sofi', 'review-shonen'],
  brasil: ['review-shonen', 'review-sofi'],
  espana: ['review-nico', 'review-felipe'],
  'estados-unidos': ['review-sofi', 'review-shonen'],
};

export default function CountryScreen() {
  const params = useLocalSearchParams<{
    pais?: string | string[];
    metric?: string | string[];
    animeId?: string | string[];
    origin?: string | string[];
  }>();
  const country = countries.find((item) => item.id === getParam(params.pais));
  const metric = getMapMetric(getParam(params.metric));
  const selectedAnime = findAnime(getParam(params.animeId));
  const mapParams = {
    metric,
    ...(selectedAnime ? { animeId: selectedAnime.id } : {}),
    ...(country ? { pais: country.id } : {}),
    ...(getParam(params.origin) === 'mapa' ? { origin: 'mapa' } : {}),
  };
  const returnToMap = () =>
    getParam(params.origin) === 'mapa' && router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/mapa', params: mapParams });
  if (!country)
    return (
      <Screen title="País no encontrado" back>
        <EmptyState
          title="No encontramos este país"
          text="Elegí un país del mapa de ejemplo para consultar su actividad."
          action="Ir al mapa"
          onPress={() => router.replace({ pathname: '/mapa', params: mapParams })}
        />
      </Screen>
    );
  // TODO BACKEND [PAIS-DETALLE]: consultar estadísticas, top 5 y vistos según país, métrica y animeId.
  const animeViews = (item: (typeof countries)[number]) =>
    getCountryMetric(item, 'anime', selectedAnime?.id);
  const top = getCountryTop(country, metric);
  const localReviews = reviews.filter((review) =>
    (localReviewIds[country.id] ?? []).includes(review.id),
  );
  const comparison = countries.slice().sort((a, b) => animeViews(b) - animeViews(a));
  const maxViews = Math.max(1, ...comparison.map(animeViews));
  return (
    <Screen title={`${country.flag} ${country.name}`} subtitle={mapMetrics[metric]} back>
      <Text style={styles.notice}>Datos de ejemplo · métricas y reviews locales simuladas</Text>
      <View style={styles.map}>
        <WorldMap
          selectedId={country.id}
          metric={metric}
          animeId={selectedAnime?.id}
          onSelect={(pais) =>
            router.replace({ pathname: '/mapa/[pais]', params: { ...mapParams, pais } })
          }
        />
      </View>
      {country.reviews === 0 && country.watched === 0 ? (
        <EmptyState
          title="Este país todavía no tiene datos"
          text="En este conjunto de ejemplo no hay vistos, rankings ni reviews disponibles."
          action="Elegir otro país"
          onPress={returnToMap}
        />
      ) : (
        <>
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Ionicons name="chatbox-outline" size={23} color={theme.colors.primarySoft} />
              <Text style={styles.number}>{country.reviews.toLocaleString('es-AR')}</Text>
              <Text style={styles.meta}>Reviews</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="eye-outline" size={23} color={theme.colors.primarySoft} />
              <Text style={styles.number}>{country.watched.toLocaleString('es-AR')}</Text>
              <Text style={styles.meta}>Animes vistos</Text>
            </View>
          </View>
          {metric === 'anime' &&
            (selectedAnime ? (
              <>
                <Section title={selectedAnime.title} />
                <View style={styles.metricCard}>
                  <Text style={styles.mainNumber}>
                    {animeViews(country).toLocaleString('es-AR')}
                  </Text>
                  <Text style={styles.body}>
                    Vistos de {selectedAnime.title} en {country.name} · ejemplo
                  </Text>
                  <Action
                    label="Ver ficha del anime"
                    onPress={() =>
                      router.push({ pathname: '/anime/[id]', params: { id: selectedAnime.id } })
                    }
                  />
                </View>
                <Section title="Comparación con otros países" />
                {comparison.map((item) => (
                  <View key={item.id} style={styles.comparison}>
                    <View style={styles.comparisonHead}>
                      <Text style={styles.body}>
                        {item.flag} {item.name}
                      </Text>
                      <Text style={styles.value}>{animeViews(item).toLocaleString('es-AR')}</Text>
                    </View>
                    <Progress value={animeViews(item)} total={maxViews} />
                  </View>
                ))}
              </>
            ) : (
              <EmptyState
                title="Anime no disponible"
                text="Volvé al mapa y seleccioná un anime para comparar sus vistos."
                action="Elegir anime"
                onPress={returnToMap}
              />
            ))}
          {metric === 'popularidad' && (
            <View style={styles.metricCard}>
              <Text style={styles.mainNumber}>{getCountryMetric(country, 'popularidad')}/100</Text>
              <Text style={styles.body}>
                Índice de popularidad ilustrativo. La fórmula real queda pendiente.
              </Text>
            </View>
          )}
          <Section title={`Top 5 · ${country.name}`} />
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={Platform.OS === 'web'}
            contentContainerStyle={styles.horizontal}
          >
            {top.map((item, index) => (
              <View key={item.id} style={styles.topItem}>
                <AnimeCard item={item} rank={index + 1} />
                {metric === 'popularidad' && (
                  <Text style={styles.meta}>Índice de ejemplo: {item.popularity}/100</Text>
                )}
                {metric === 'vistos' && (
                  <Text style={styles.meta}>
                    {getCountryMetric(country, 'anime', item.id).toLocaleString('es-AR')} vistos ·
                    ejemplo
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
          <Section title="Reviews del país" />
          {localReviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </>
      )}
      <Action label="Volver al mapa" icon="map-outline" onPress={returnToMap} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { color: theme.colors.primarySoft, fontSize: 11, lineHeight: 17 },
  map: {
    padding: 8,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stats: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  number: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  meta: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 16 },
  metricCard: {
    gap: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mainNumber: { color: theme.colors.primarySoft, fontSize: 30, fontWeight: '700' },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  comparison: { gap: 9, padding: 12, backgroundColor: theme.colors.surface, borderRadius: 10 },
  comparisonHead: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  value: { color: theme.colors.primarySoft, fontSize: 12, fontWeight: '600' },
  horizontal: { gap: 8 },
  topItem: { width: 112, gap: 5 },
});
