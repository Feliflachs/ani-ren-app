import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, Chips, Dialog, Screen, Section } from '../../src/components';
import { currentUser, getParam, getRankProgress, ranks } from '../../src/mock';
import { theme } from '../../src/theme';

// TODO BACKEND [DECORADORES]: consultar catálogo y desbloqueos por id de usuario; no son reglas definitivas.
const decorators = [
  { id: 'titulo-aprendiz', type: 'Títulos', label: 'Aprendiz', value: 'Aprendiz', locked: false },
  {
    id: 'titulo-explorador',
    type: 'Títulos',
    label: 'Explorador',
    value: 'Explorador',
    locked: false,
  },
  {
    id: 'titulo-leyenda',
    type: 'Títulos',
    label: 'Leyenda viva',
    value: 'Leyenda viva',
    locked: true,
  },
  { id: 'sin-titulo', type: 'Títulos', label: 'Sin título', value: '', locked: false },
  { id: 'kun', type: 'Sufijos', label: '-kun', value: '-kun', locked: false },
  { id: 'chan', type: 'Sufijos', label: '-chan', value: '-chan', locked: false },
  { id: 'sama', type: 'Sufijos', label: '-sama', value: '-sama', locked: true },
  { id: 'sin-sufijo', type: 'Sufijos', label: 'Sin sufijo', value: '', locked: false },
  { id: 'badge-aprendiz', type: 'Insignias', label: 'Aprendiz', value: 'Aprendiz', locked: false },
  {
    id: 'badge-primer',
    type: 'Insignias',
    label: 'Primer capítulo',
    value: 'Primer capítulo',
    locked: false,
  },
  {
    id: 'badge-explorador',
    type: 'Insignias',
    label: 'Explorador de géneros',
    value: 'Explorador',
    locked: true,
  },
  { id: 'avatar-violeta', type: 'Avatar', label: 'Borde violeta', value: 'Violeta', locked: false },
  { id: 'avatar-lavanda', type: 'Avatar', label: 'Borde lavanda', value: 'Lavanda', locked: false },
  { id: 'avatar-coral', type: 'Avatar', label: 'Borde coral', value: 'Coral', locked: true },
];

const suggestedTitles = ['Sanji', 'Viajero', 'Espíritu shonen'];
const tabs = ['Rangos', 'Títulos', 'Sufijos', 'Insignias', 'Avatar'];
const rankProgress = getRankProgress(currentUser.watched);
const currentRankIndex = ranks.indexOf(rankProgress.rank);

export default function RanksScreen() {
  const params = useLocalSearchParams<{ titulo?: string | string[] }>();
  const suggested = getParam(params.titulo);
  const exampleTitle = suggested && suggestedTitles.includes(suggested) ? suggested : undefined;
  const [tab, setTab] = useState(exampleTitle ? 'Títulos' : 'Rangos');
  const [title, setTitle] = useState(exampleTitle ?? rankProgress.rank);
  const [suffix, setSuffix] = useState('-kun');
  const [badge, setBadge] = useState(rankProgress.rank);
  const [frame, setFrame] = useState('Violeta');
  const [message, setMessage] = useState('');
  const items = exampleTitle
    ? [
        {
          id: 'titulo-ia',
          type: 'Títulos',
          label: `${exampleTitle} · ejemplo IA`,
          value: exampleTitle,
          locked: false,
        },
        ...decorators,
      ]
    : decorators;
  const selectedValue =
    tab === 'Títulos' ? title : tab === 'Sufijos' ? suffix : tab === 'Insignias' ? badge : frame;
  // TODO BACKEND [DECORADOR-APLICAR]: validar desbloqueo y guardar selección; hoy modifica solo esta vista previa.
  const select = (item: (typeof decorators)[number]) => {
    if (item.locked) {
      setMessage(
        'Este decorador está bloqueado en el catálogo de ejemplo. Las condiciones de desbloqueo se definirán más adelante.',
      );
      return;
    }
    if (item.type === 'Títulos') setTitle(item.value);
    if (item.type === 'Sufijos') setSuffix(item.value);
    if (item.type === 'Insignias') setBadge(item.value);
    if (item.type === 'Avatar') setFrame(item.value);
  };
  return (
    <Screen title="Tu estilo Aura" subtitle="Rangos y decoradores para un perfil a tu manera." back>
      <View style={styles.preview}>
        <View
          style={[
            styles.avatarFrame,
            { borderColor: frame === 'Lavanda' ? theme.colors.primarySoft : theme.colors.primary },
          ]}
        >
          <Avatar size={72} />
          <View style={styles.badge}>
            <Ionicons
              name={badge === rankProgress.rank ? 'shield' : 'ribbon'}
              size={21}
              color={theme.colors.primarySoft}
            />
          </View>
        </View>
        <View style={styles.flex}>
          <Text style={styles.name}>
            {currentUser.name}
            {suffix}
          </Text>
          <Text style={styles.handle}>@{currentUser.handle}</Text>
          {title !== '' && <Text style={styles.title}>{title}</Text>}
          <Text style={styles.meta}>Rango actual: {rankProgress.rank}</Text>
          <Text style={styles.meta}>Insignia: {badge}</Text>
        </View>
      </View>
      <Text style={styles.notice}>
        Vista previa local. El sufijo modifica el nombre visible; tu handle permanece igual.
      </Text>
      <Chips options={tabs} value={tab} onChange={setTab} />
      {tab === 'Rangos' ? (
        <>
          <Section title="Tu camino" />
          <ScrollView
            horizontal
            style={{ flexGrow: 0 }}
            showsHorizontalScrollIndicator={Platform.OS === 'web'}
            contentContainerStyle={styles.row}
          >
            {ranks.map((rank, index) => {
              const isCurrent = rank === rankProgress.rank;
              const isLocked = index > currentRankIndex;
              const state = isCurrent ? 'Actual' : isLocked ? 'Bloqueado' : 'Disponible';
              return (
                <Pressable
                  key={rank}
                  accessibilityRole="button"
                  onPress={() =>
                    setMessage(
                      `${isCurrent ? 'Este es tu rango actual.' : isLocked ? 'Rango todavía bloqueado.' : 'Rango disponible como insignia de ejemplo.'} Los rangos se representan por cantidad de animes vistos; los umbrales no son definitivos.`,
                    )
                  }
                  style={[styles.rank, isCurrent && styles.selected]}
                >
                  <Ionicons
                    name={isLocked ? 'lock-closed-outline' : 'shield-outline'}
                    size={42}
                    color={theme.colors.primarySoft}
                  />
                  <Text style={styles.rankTitle}>{rank}</Text>
                  <Text style={styles.meta}>{state}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <View style={styles.explanation}>
            <Text style={styles.cardTitle}>{currentUser.watched} animes vistos</Text>
            <Text style={styles.body}>
              {rankProgress.nextRank
                ? `Tu siguiente referencia visual es ${rankProgress.nextRank}, con ${rankProgress.total} vistos de ejemplo.`
                : 'Ya alcanzaste el último rango de ejemplo.'}{' '}
              Los títulos por gustos y las misiones son decoradores independientes del ranking.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Section title={tab === 'Avatar' ? 'Decoradores del avatar' : tab} />
          <View style={styles.catalog}>
            {items
              .filter((item) => item.type === tab)
              .map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => select(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label}${item.locked ? ', bloqueado' : ''}`}
                  accessibilityState={{ selected: !item.locked && selectedValue === item.value }}
                  style={[
                    styles.option,
                    !item.locked && selectedValue === item.value && styles.selected,
                  ]}
                >
                  <Ionicons
                    name={
                      item.locked
                        ? 'lock-closed-outline'
                        : selectedValue === item.value
                          ? 'checkmark-circle'
                          : 'sparkles-outline'
                    }
                    size={25}
                    color={theme.colors.primarySoft}
                  />
                  <Text style={styles.optionText}>{item.label}</Text>
                  <Text style={styles.meta}>
                    {item.locked
                      ? 'Bloqueado'
                      : selectedValue === item.value
                        ? 'Seleccionado'
                        : 'Disponible'}
                  </Text>
                </Pressable>
              ))}
          </View>
        </>
      )}
      <Action
        label="Aplicar a esta vista previa"
        icon="checkmark-outline"
        primary
        onPress={() =>
          setMessage(
            'Selección aplicada a esta vista previa de ejemplo. No se guarda ni se sincroniza con otras pantallas.',
          )
        }
      />
      <Dialog
        visible={message !== ''}
        title="Personalización Aura"
        text={message}
        onClose={() => setMessage('')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 16,
  },
  avatarFrame: { padding: 4, borderWidth: 2, borderRadius: 45 },
  badge: {
    position: 'absolute',
    right: -1,
    bottom: 0,
    borderWidth: 1,
    borderColor: theme.colors.primarySoft,
    borderRadius: 15,
    padding: 4,
    backgroundColor: theme.colors.background,
  },
  name: { color: theme.colors.text, fontSize: 21, fontWeight: '700' },
  handle: { color: theme.colors.primarySoft, fontSize: 12, marginTop: 4 },
  title: { color: theme.colors.text, fontSize: 13, marginVertical: 6 },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  notice: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  row: { gap: 9 },
  rank: {
    width: 105,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    padding: 14,
    gap: 7,
  },
  rankTitle: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  selected: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryDark },
  explanation: {
    marginTop: 12,
    gap: 8,
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  cardTitle: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  catalog: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  option: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  optionText: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
});
