import { useQuery, usePage } from '../../../src/context/RemoteContext';
import { QueryFooter } from '../../../src/remote-ui';
import { adaptCountry } from '../../../src/map-data';
import { adaptAnime, adaptPublication } from '../../../src/api/remote';
import { countryTop } from '../../../src/api/country-top';
import { usePublications } from '../../../src/context/PublicationsContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  EmptyState,
  Progress,
  PublicationCard,
  Screen,
  Section,
} from '../../../src/components';
import { findAnime, getCountryMetric, getMapMetric, getParam, mapMetrics } from '../../../src/data';
import { theme } from '../../../src/theme';
import { WorldMap } from '../../../src/WorldMap';

export default function CountryScreen() {
  usePublications();

  const params = useLocalSearchParams<{
    pais?: string | string[];
    metric?: string | string[];
    animeId?: string | string[];
    origin?: string | string[];
  }>();
  const animeId = getParam(params.animeId)?.trim() || undefined;
  const detail = useQuery(`/explore/countries/${getParam(params.pais)}`, { animeId });
  const page = usePage(`/explore/countries/${getParam(params.pais)}/reviews`, { animeId });
  const countries = (detail.data?.comparison ?? []).map(
    adaptCountry,
  ) as import('../../../src/data').Country[];
  const country = detail.data
    ? {
        ...adaptCountry({
          ...detail.data.country,
          ...detail.data.comparison?.find(
            (row: import('../../../src/api/remote').Wire) => row.code === detail.data?.country.code,
          ),
          ...detail.data.statistics,
        }),
        top: [],
      }
    : undefined;
  const metric = getMapMetric(getParam(params.metric));
  useQuery(getParam(params.animeId) ? `/anime/${getParam(params.animeId)}` : undefined);
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
      : router.replace({ pathname: '/explorar/mapa', params: mapParams });
  if (!country)
    return (
      <Screen title="Actividad del país" back>
        {!detail.loading && !detail.error && (
          <EmptyState
            title="No encontramos este país"
            text="Elegí un país del mapa para consultar su actividad."
            action="Ir al mapa"
            onPress={() => router.replace({ pathname: '/explorar/mapa', params: mapParams })}
          />
        )}
        <QueryFooter query={detail} />
        <QueryFooter query={page} />
      </Screen>
    );
  const animeViews = (item: (typeof countries)[number]) =>
    getCountryMetric(item, 'anime', selectedAnime?.id);
  const topSelection = countryTop(detail.data, metric);
  const top = topSelection.items.map((row) => ({
    ...adaptAnime({
      ...row.anime,
      views: row.views,
      averageRating: row.averageRating,
      popularity: row.popularity,
    }),
    reviewCount: row.reviews as number,
  }));
  const localReviews = page.items.map(adaptPublication);
  const comparison = countries.slice().sort((a, b) => animeViews(b) - animeViews(a));
  const maxViews = Math.max(1, ...comparison.map(animeViews));
  return (
    <Screen title={`${country.flag} ${country.name}`} subtitle={mapMetrics[metric]} back>
      <Text style={styles.notice}>Actividad registrada por país</Text>
      <View style={styles.map}>
        <WorldMap
          selectedId={country.id}
          metric={metric}
          animeId={selectedAnime?.id}
          onSelect={(pais) =>
            router.replace({ pathname: '/explorar/mapa/[pais]', params: { ...mapParams, pais } })
          }
        />
      </View>
      {country.reviews === 0 && country.watched === 0 ? (
        <EmptyState
          title="Este país todavía no tiene datos"
          text="Todavía no hay visualizaciones ni reviews registradas en este país."
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
                    Vistos de {selectedAnime.title} en {country.name}
                  </Text>
                  <Action
                    label="Ver ficha del anime"
                    onPress={() =>
                      router.push({
                        pathname: '/explorar/anime/[id]',
                        params: { id: selectedAnime.id },
                      })
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
                Popularidad relativa a las visualizaciones registradas en Ani-Ren por país.
              </Text>
            </View>
          )}
          {metric !== 'anime' && (
            <>
              <Section title={`Top 5 · ${country.name}`} />
              <Text style={styles.meta}>{topSelection.label}</Text>
              {top.length === 0 && (
                <EmptyState
                  title="Todavía no hay datos para este top"
                  text="Se necesitan valoraciones o reviews registradas en este país."
                />
              )}
              <ScrollView
                horizontal
                style={{ flexGrow: 0 }}
                showsHorizontalScrollIndicator={Platform.OS === 'web'}
                contentContainerStyle={styles.horizontal}
              >
                {top.map((item, index) => (
                  <View key={item.id} style={styles.topItem}>
                    <AnimeCard item={item} rank={index + 1} unframed />
                    {metric === 'reviews' && (
                      <Text style={styles.meta}>{item.reviewCount} reviews</Text>
                    )}
                    {metric === 'popularidad' && (
                      <Text style={styles.meta}>Popularidad: {item.popularity}/100</Text>
                    )}
                    {metric === 'vistos' && (
                      <Text style={styles.meta}>{item.watched.toLocaleString('es-AR')} vistos</Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            </>
          )}
          <Section title="Reviews del país" />
          {localReviews.map((review) => (
            <PublicationCard key={review.id} review={review} />
          ))}
        </>
      )}
      <Action label="Volver al mapa" icon="map-outline" onPress={returnToMap} />
      <QueryFooter query={page} />
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
