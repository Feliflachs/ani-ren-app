import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ComponentProps } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Action, Dialog, EmptyState, Screen, StarRating } from '../../src/components';
import { useAppState } from '../../src/AppState';
import { currentUser, findAnime, getParam, lists, reviews } from '../../src/mock';
import { theme } from '../../src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];
type ReviewDialog = 'confirmed' | 'discard' | null;

const formatDate = (date: Date) =>
  `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;

const isValidSeenDate = (value: string, today: Date) => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return false;
  const [day, month, year] = value.split('/').map(Number);
  const parsedDate = new Date(year, month - 1, day);
  return (
    parsedDate.getDate() === day &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getFullYear() === year &&
    parsedDate.getTime() <= today.getTime()
  );
};

function ActivityButton({
  label,
  icon,
  active,
  onPress,
  activeColor = theme.colors.primarySoft,
}: {
  label: string;
  icon: IconName;
  active: boolean;
  onPress: () => void;
  activeColor?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.activityButton, active && { borderColor: activeColor }]}
    >
      <Ionicons
        name={active ? (icon.replace('-outline', '') as IconName) : icon}
        size={31}
        color={active ? activeColor : theme.colors.textSecondary}
      />
      <Text style={[styles.activityLabel, active && { color: activeColor }]}>{label}</Text>
    </Pressable>
  );
}

export default function EscribirReviewScreen() {
  const params = useLocalSearchParams();
  const reviewId = getParam(params.id) ?? getParam(params.reviewId);
  const existing = reviews.find((review) => review.id === reviewId);
  const item = findAnime(existing?.animeId ?? getParam(params.animeId) ?? 'frieren');
  const { getActivity, saveActivity } = useAppState();
  const saved = getActivity(item?.id ?? '');
  const today = new Date();

  const [watched, setWatched] = useState(saved.watched);
  const [liked, setLiked] = useState(saved.liked);
  const [watchlist, setWatchlist] = useState(saved.watchlist);
  const [rating, setRating] = useState<number | undefined>(existing?.rating ?? saved.rating);
  const [reviewOpen, setReviewOpen] = useState(Boolean(existing || saved.reviewText));
  const [text, setText] = useState(existing?.text ?? saved.reviewText ?? '');
  const [date, setDate] = useState(saved.date ?? formatDate(today));
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? saved.spoiler);
  const [listIds, setListIds] = useState(saved.listIds);
  const [listPicker, setListPicker] = useState(false);
  const [dialog, setDialog] = useState<ReviewDialog>(null);
  const [touched, setTouched] = useState(false);

  const createsLog = watched || rating !== undefined || reviewOpen;
  const validDate = !createsLog || isValidSeenDate(date, today);
  const validText = text.trim().length === 0 || text.trim().length >= 10;
  const hasActivity = createsLog || liked || watchlist || listIds.length > 0;
  const valid = hasActivity && validDate && validText;
  const ownLists = lists.filter((list) => list.userId === currentUser.id);

  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/anime/[id]', params: { id: item?.id ?? 'frieren' } });

  const toggleList = (listId: string) => {
    setListIds((current) =>
      current.includes(listId) ? current.filter((id) => id !== listId) : [...current, listId],
    );
  };

  const save = () => {
    setTouched(true);
    if (!valid || !item) return;
    // TODO BACKEND [ACTIVIDAD-GUARDAR]: reemplazar esta actualización local por una única operación del usuario y el anime.
    saveActivity(item.id, {
      watched,
      liked,
      watchlist,
      rating,
      date: createsLog ? date : undefined,
      reviewText: reviewOpen && text.trim() ? text.trim() : undefined,
      spoiler: reviewOpen && spoiler,
      listIds,
      logged: reviewOpen,
    });
    setDialog('confirmed');
  };

  if (reviewId && !existing)
    return (
      <Screen title="Review" back>
        <EmptyState title="Review no encontrada" text="No pudimos encontrar esa actividad." />
      </Screen>
    );

  if (existing && existing.userId !== currentUser.id)
    return (
      <Screen title="Review" back>
        <EmptyState
          title="Esta review pertenece a otra persona"
          text="Solo podés editar tus propias reviews."
        />
      </Screen>
    );

  if (!item)
    return (
      <Screen title="Review" back>
        <EmptyState
          title="Anime no encontrado"
          text="Elegí un anime antes de registrar tu actividad."
          action="Buscar anime"
          onPress={() => router.replace('/busqueda')}
        />
      </Screen>
    );

  return (
    <Screen title="Review" subtitle="Registrá este anime a tu manera." back>
      <View style={styles.animeHeader}>
        <Image source={item.image} style={styles.poster} />
        <View style={styles.grow}>
          <Text style={styles.animeTitle}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.year} · {item.episodes} episodios
          </Text>
          <Text style={styles.meta}>{item.genres.join(' · ')}</Text>
          <Text style={styles.general}>★ {item.rating.toFixed(1)} / 5</Text>
        </View>
      </View>

      <View style={styles.activityPanel}>
        <View style={styles.activityRow}>
          <ActivityButton
            label="Visto"
            icon="eye-outline"
            active={watched}
            onPress={() => setWatched((value) => !value)}
          />
          <ActivityButton
            label="Me gusta"
            icon="heart-outline"
            active={liked}
            activeColor={theme.colors.accentSoft}
            onPress={() => setLiked((value) => !value)}
          />
          <ActivityButton
            label="Watchlist"
            icon="bookmark-outline"
            active={watchlist}
            onPress={() => setWatchlist((value) => !value)}
          />
        </View>

        <View style={styles.divider} />
        <Text style={styles.centerLabel}>Tu puntuación</Text>
        <StarRating value={rating} onChange={setRating} size={38} />
        <Text style={styles.scoreText}>
          {rating === undefined ? 'Sin puntuación' : `${rating.toFixed(1)} / 5`}
        </Text>

        <View style={styles.divider} />
        <Action
          label="Review o log"
          icon="create-outline"
          active={reviewOpen}
          onPress={() => setReviewOpen((value) => !value)}
        />

        {reviewOpen && (
          <View style={styles.editor}>
            <TextInput
              accessibilityLabel="Texto opcional de tu review"
              value={text}
              onChangeText={setText}
              onBlur={() => setTouched(true)}
              multiline
              maxLength={2000}
              placeholder="Escribí una review o dejalo vacío para guardar solo el log."
              placeholderTextColor={theme.colors.textSecondary}
              style={[styles.input, styles.multiline]}
            />
            <Text style={styles.meta}>{text.length} / 2000 · El texto es opcional.</Text>
            {touched && !validText && (
              <Text style={styles.error}>Si escribís una review, usá al menos 10 caracteres.</Text>
            )}
            <View style={styles.switchRow}>
              <View style={styles.grow}>
                <Text style={styles.label}>Contiene spoilers</Text>
                <Text style={styles.meta}>El texto se ocultará antes de leerlo.</Text>
              </View>
              <Switch
                accessibilityLabel="Mi review contiene spoilers"
                value={spoiler}
                onValueChange={setSpoiler}
                trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primaryDark }}
                thumbColor={spoiler ? theme.colors.primarySoft : theme.colors.textSecondary}
              />
            </View>
          </View>
        )}

        {createsLog && (
          <View style={styles.dateBlock}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              accessibilityLabel="Fecha del registro, día mes y año"
              value={date}
              onChangeText={setDate}
              onBlur={() => setTouched(true)}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              placeholder="DD/MM/AAAA"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />
            {touched && !validDate && (
              <Text style={styles.error}>Ingresá una fecha válida hasta hoy.</Text>
            )}
          </View>
        )}

        <Action
          label={listIds.length ? `Agregar a lista · ${listIds.length}` : 'Agregar a lista'}
          icon="albums-outline"
          onPress={() => setListPicker(true)}
        />
      </View>

      <Action label="Listo" icon="checkmark" primary disabled={!valid} onPress={save} />
      <Action label="Cancelar" onPress={() => setDialog('discard')} />

      <Dialog
        visible={listPicker}
        title="Agregar a lista"
        text="Podés elegir más de una."
        onClose={() => setListPicker(false)}
      >
        {ownLists.map((list) => (
          <Action
            key={list.id}
            label={list.title}
            icon={listIds.includes(list.id) ? 'checkmark-circle' : 'ellipse-outline'}
            active={listIds.includes(list.id)}
            onPress={() => toggleList(list.id)}
          />
        ))}
        <Action
          label="Crear una lista"
          icon="add-outline"
          onPress={() => {
            setListPicker(false);
            router.push({ pathname: '/lista/editar', params: { animeId: item.id } });
          }}
        />
      </Dialog>

      <Dialog
        visible={dialog === 'confirmed'}
        title="Actividad guardada"
        text={
          createsLog
            ? `${item.title} ya aparece en tus vistos y en tu historial local.`
            : `Actualizamos tu actividad de ${item.title}.`
        }
        onClose={() => setDialog(null)}
      >
        <Action label="Volver al anime" onPress={goBack} />
      </Dialog>

      <Dialog
        visible={dialog === 'discard'}
        title="¿Descartar los cambios?"
        text="Los cambios de esta pantalla se perderán."
        onClose={() => setDialog(null)}
      >
        <Action label="Descartar y volver" onPress={goBack} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  animeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  poster: { width: 76, height: 106, borderRadius: 7, backgroundColor: theme.colors.surfaceLight },
  grow: { flex: 1, minWidth: 0, gap: 5 },
  animeTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  general: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600', marginTop: 3 },
  activityPanel: {
    gap: 13,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
  },
  activityRow: { flexDirection: 'row', alignItems: 'stretch' },
  activityButton: {
    flex: 1,
    minHeight: 80,
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activityLabel: { color: theme.colors.textSecondary, fontSize: 11 },
  divider: { height: 1, backgroundColor: theme.colors.border },
  centerLabel: { color: theme.colors.textSecondary, fontSize: 12, textAlign: 'center' },
  scoreText: { color: theme.colors.primarySoft, fontSize: 12, textAlign: 'center' },
  editor: { gap: 10 },
  dateBlock: { gap: 8 },
  label: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 9,
    color: theme.colors.text,
    padding: 11,
    fontSize: 13,
  },
  multiline: { minHeight: 115, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  error: { color: theme.colors.accentSoft, fontSize: 11, lineHeight: 16 },
});
