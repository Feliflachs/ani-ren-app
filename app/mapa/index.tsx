import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Action, AnimeCard, Chips, Screen, SearchBar, Section } from '../../src/components';
import {
  anime,
  countries,
  findAnime,
  getCountryMetric,
  getCountryTop,
  getMapMetric,
  getParam,
  mapMetrics,
} from '../../src/mock';
import { theme } from '../../src/theme';
import { WorldMap } from '../../src/WorldMap';

export default function MapScreen() {
  const params = useLocalSearchParams<{
    metric?: string | string[];
    animeId?: string | string[];
    pais?: string | string[];
  }>();
  const incomingMetric = getParam(params.metric);
  const initialAnime = findAnime(getParam(params.animeId)) ?? anime[0];
  const [metric, setMetric] = useState(
    getMapMetric(incomingMetric, getParam(params.animeId) ? 'anime' : 'reviews'),
  );
  const [selectedAnimeId, setSelectedAnimeId] = useState(initialAnime.id);
  const [animeQuery, setAnimeQuery] = useState(initialAnime.title);
  const [selectedCountryId, setSelectedCountryId] = useState(
    countries.find((item) => item.id === getParam(params.pais))?.id ?? countries[0].id,
  );
  const selectedCountry = countries.find((item) => item.id === selectedCountryId) ?? countries[0];
  const selectedAnime = findAnime(selectedAnimeId);
  const searchedTitle = selectedAnime?.title ?? (animeQuery.trim() || 'Anime');
  const animeMatches = anime
    .filter((item) => item.title.toLowerCase().includes(animeQuery.trim().toLowerCase()))
    .slice(0, 4);
  const metricValue = (country: (typeof countries)[number]) =>
    getCountryMetric(country, metric, selectedAnime?.id);
  const sorted = countries.slice().sort((a, b) => metricValue(b) - metricValue(a));
  const countryTop = getCountryTop(selectedCountry, metric);
  const valueLabel =
    metric === 'reviews'
      ? 'reviews'
      : metric === 'popularidad'
        ? 'índice ilustrativo / 100'
        : 'vistos';
  return (
    <Screen
      title="Mapa anime mundial"
      subtitle="Descubrí historias y actividad alrededor del mundo."
      back
    >
      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={19} color={theme.colors.primarySoft} />
        <Text style={styles.noticeText}>Datos de ejemplo · sin geolocalización</Text>
      </View>
      <Chips
        options={Object.values(mapMetrics)}
        value={mapMetrics[metric]}
        onChange={(label) => setMetric(getMapMetric(label))}
      />
      {metric === 'anime' && (
        <>
          <Section title="Buscar un anime" />
          <SearchBar
            value={animeQuery}
            onChangeText={(value) => {
              setAnimeQuery(value);
              const exact = anime.find(
                (item) => item.title.toLowerCase() === value.trim().toLowerCase(),
              );
              setSelectedAnimeId(exact?.id ?? '');
            }}
            placeholder="Escribí el nombre del anime"
          />
          {animeQuery.trim() !== '' && !selectedAnime && animeMatches.length > 0 && (
            <View style={styles.suggestions}>
              {animeMatches.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  onPress={() => {
                    setAnimeQuery(item.title);
                    setSelectedAnimeId(item.id);
                  }}
                  style={styles.suggestion}
                >
                  <Text style={styles.suggestionText}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text style={styles.meta}>
            {selectedAnime
              ? `Comparando vistos de ${selectedAnime.title} por país.`
              : `Podés buscar “${searchedTitle}”. Sus estadísticas aparecerán cuando el catálogo esté conectado al backend.`}
          </Text>
        </>
      )}
      {getParam(params.animeId) && !findAnime(getParam(params.animeId)) && (
        <Text style={styles.meta}>
          El anime solicitado no está disponible. Podés elegir uno de los ejemplos.
        </Text>
      )}
      <View style={styles.mapCard}>
        <WorldMap
          selectedId={selectedCountryId}
          onSelect={setSelectedCountryId}
          metric={metric}
          animeId={selectedAnime?.id}
        />
        <View style={styles.legend}>
          <Text style={styles.meta}>Menos actividad</Text>
          <View style={styles.scale}>
            {[0.25, 0.45, 0.65, 0.85, 1].map((opacity) => (
              <View key={opacity} style={[styles.scalePart, { opacity }]} />
            ))}
          </View>
          <Text style={styles.meta}>Más actividad</Text>
        </View>
      </View>
      <Chips
        options={countries.map((country) => `${country.flag} ${country.name}`)}
        value={`${selectedCountry.flag} ${selectedCountry.name}`}
        onChange={(label) =>
          setSelectedCountryId(
            countries.find((country) => `${country.flag} ${country.name}` === label)?.id ??
              countries[0].id,
          )
        }
      />
      <View style={styles.countryCard}>
        <Text style={styles.countryTitle}>
          {selectedCountry.flag} {selectedCountry.name}
        </Text>
        <Text style={styles.metricTitle}>
          {metricValue(selectedCountry).toLocaleString('es-AR')}{' '}
          <Text style={styles.body}>{valueLabel}</Text>
        </Text>
        <Text style={styles.body}>{metric === 'anime' ? searchedTitle : mapMetrics[metric]}</Text>
        <Action
          label="Explorar este país"
          primary
          icon="location-outline"
          disabled={metric === 'anime' && !selectedAnime}
          onPress={() =>
            router.push({
              pathname: '/mapa/[pais]',
              params: {
                pais: selectedCountry.id,
                metric,
                animeId: selectedAnime?.id ?? '',
                origin: 'mapa',
              },
            })
          }
        />
      </View>
      <Section
        title={metric === 'anime' ? `${searchedTitle} por país` : 'Comparación entre países'}
      />
      {sorted.map((country, index) => (
        <View key={country.id} style={styles.countryRow}>
          <Text style={styles.position}>{index + 1}</Text>
          <Text style={styles.countryName}>
            {country.flag} {country.name}
          </Text>
          <Text style={styles.count}>{metricValue(country).toLocaleString('es-AR')}</Text>
        </View>
      ))}
      {countryTop.length > 0 && (
        <>
          <Section title={`Top 5 · ${selectedCountry.name}`} />
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={Platform.OS === 'web'}
            contentContainerStyle={styles.horizontal}
          >
            {countryTop.map((item, index) => (
              <AnimeCard key={item.id} item={item} rank={index + 1} />
            ))}
          </ScrollView>
        </>
      )}
      <Text style={styles.meta}>
        La popularidad, los colores y los conteos son ilustrativos; no constituyen estadísticas
        reales.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  notice: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  noticeText: { color: theme.colors.primarySoft, fontSize: 11 },
  mapCard: {
    padding: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingTop: 10,
    paddingBottom: 4,
  },
  meta: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 16 },
  scale: { width: 72, height: 6, borderRadius: 4, overflow: 'hidden', flexDirection: 'row' },
  scalePart: { flex: 1, backgroundColor: theme.colors.primary },
  countryCard: {
    padding: 16,
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  countryTitle: { color: theme.colors.text, fontSize: 21, fontWeight: '700' },
  metricTitle: { color: theme.colors.primarySoft, fontSize: 23, fontWeight: '700' },
  body: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  countryRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
  },
  position: { width: 20, color: theme.colors.primarySoft, fontSize: 12, fontWeight: '700' },
  countryName: { flex: 1, color: theme.colors.text, fontSize: 13 },
  count: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  horizontal: { gap: 8 },
  suggestions: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
  },
  suggestion: { paddingHorizontal: 13, paddingVertical: 11 },
  suggestionText: { color: theme.colors.text, fontSize: 13 },
});
