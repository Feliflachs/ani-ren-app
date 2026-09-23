import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import shapes from '../assets/paises.json';
import { countries, getCountryMetric, type MapMetric } from './mock';
import { theme } from './theme';

// Siluetas estáticas Natural Earth 1:110m, dominio público. No se consulta un servicio de mapas.
const countryCodes: Record<string, string> = {
  ARG: 'argentina',
  JPN: 'japon',
  BRA: 'brasil',
  ESP: 'espana',
  USA: 'estados-unidos',
  ISL: 'islandia',
};
// La geometría no cambia: preparar una sola vez el fondo y los seis países con datos.
const backgroundPath = shapes
  .filter((shape) => !countryCodes[shape.iso])
  .map((shape) => shape.path)
  .join('');
const activeShapes = shapes
  .filter((shape) => countryCodes[shape.iso])
  .map((shape) => ({
    ...shape,
    country: countries.find((country) => country.id === countryCodes[shape.iso])!,
  }));

export function WorldMap({
  selectedId,
  onSelect,
  metric = 'reviews',
  animeId,
}: {
  selectedId?: string;
  onSelect?: (id: string) => void;
  metric?: MapMetric;
  animeId?: string;
}) {
  const activity = (country: (typeof countries)[number]) =>
    getCountryMetric(country, metric, animeId);
  const maximum = Math.max(1, ...countries.map(activity));
  return (
    <View style={styles.map}>
      {[25, 50, 75].map((top) => (
        <View key={`h${top}`} style={[styles.horizontal, { top: `${top}%` }]} />
      ))}
      {[20, 40, 60, 80].map((left) => (
        <View key={`v${left}`} style={[styles.vertical, { left: `${left}%` }]} />
      ))}
      <Svg width="100%" height="100%" viewBox="0 0 360 145" style={StyleSheet.absoluteFill}>
        <Path
          d={backgroundPath}
          fill={theme.colors.primaryDark}
          fillOpacity={0.18}
          fillRule="evenodd"
          stroke={theme.colors.primarySoft}
          strokeOpacity={0.25}
          strokeWidth={0.3}
        />
        {activeShapes.map((shape) => {
          const selected = shape.country.id === selectedId;
          const value = activity(shape.country);
          return (
            <Path
              key={shape.iso}
              d={shape.path}
              fill={theme.colors.primary}
              fillOpacity={value > 0 ? 0.3 + (value / maximum) * 0.7 : 0.18}
              fillRule="evenodd"
              stroke={selected ? theme.colors.text : theme.colors.primarySoft}
              strokeOpacity={selected ? 1 : 0.25}
              strokeWidth={selected ? 0.9 : 0.3}
            />
          );
        })}
      </Svg>
      {countries.map((country) => {
        const selected = country.id === selectedId;
        const value = activity(country);
        return (
          <Pressable
            key={country.id}
            onPress={() => onSelect?.(country.id)}
            disabled={!onSelect}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityLabel={`${country.name}${selected ? ', seleccionado' : ''}${value === 0 ? ', sin datos' : ''}`}
            accessibilityState={{ selected }}
            hitSlop={4}
            style={[
              styles.point,
              {
                left: `${country.x}%`,
                top: `${country.y}%`,
                backgroundColor: `rgba(139,92,246,${value > 0 ? 0.2 + (value / maximum) * 0.5 : 0.08})`,
              },
              selected && styles.pointActive,
            ]}
          >
            <View
              style={[styles.dot, value === 0 && styles.dotEmpty, selected && styles.dotActive]}
            />
            {selected && <Text style={styles.countryLabel}>{country.name}</Text>}
          </Pressable>
        );
      })}
      <Text style={styles.caption}>Datos de ejemplo</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    aspectRatio: 360 / 145,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  horizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(167,139,250,0.06)',
  },
  vertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(167,139,250,0.06)',
  },
  point: {
    position: 'absolute',
    width: 26,
    height: 26,
    marginLeft: -13,
    marginTop: -13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
  },
  pointActive: {
    borderWidth: 1.5,
    borderColor: theme.colors.text,
    backgroundColor: theme.colors.primary,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.primarySoft },
  dotActive: { backgroundColor: theme.colors.text },
  dotEmpty: { backgroundColor: theme.colors.textSecondary },
  countryLabel: {
    position: 'absolute',
    bottom: 27,
    color: theme.colors.text,
    fontSize: 10,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 5,
  },
  caption: {
    position: 'absolute',
    left: 8,
    bottom: 6,
    color: theme.colors.textSecondary,
    fontSize: 9,
  },
});
