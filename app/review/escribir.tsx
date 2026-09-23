import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Action, AnimeCard, Dialog, EmptyState, Screen, Section } from '../../src/components';
import { currentUser, findAnime, getParam, reviews } from '../../src/mock';
import { theme } from '../../src/theme';

type ReviewDialog = 'confirmed' | 'discard' | null;

const scores = Array.from({ length: 10 }, (_, index) => index + 1);

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

export default function EscribirReviewScreen() {
  const params = useLocalSearchParams();
  const id = getParam(params.id) ?? getParam(params.reviewId);
  // TODO BACKEND [REVIEW-EDITAR-CONSULTA]: obtener review por id y verificar autor actual; resolver anime por animeId.
  const existing = reviews.find((review) => review.id === id);
  const item = findAnime(existing?.animeId ?? getParam(params.animeId) ?? 'frieren');
  const today = new Date();
  const [rating, setRating] = useState(existing?.rating?.toString() ?? '');
  const [text, setText] = useState(existing?.text ?? '');
  const [date, setDate] = useState(formatDate(today));
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const [dialog, setDialog] = useState<ReviewDialog>(null);
  const [touched, setTouched] = useState(false);
  const score = Number(rating.replace(',', '.'));
  const validScore =
    rating.trim().length > 0 && Number.isFinite(score) && score >= 1 && score <= 10;
  const validDate = isValidSeenDate(date, today);
  const valid = validScore && text.trim().length >= 10 && validDate;
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/anime/[id]', params: { id: item?.id ?? 'frieren' } });
  const save = () => {
    if (!valid || !item) return;
    // TODO BACKEND [REVIEW-GUARDAR]: hoy se confirma un borrador; enviar id opcional, currentUser.id, item.id, puntuación, texto, fecha y spoilers.
    // Validar autor y mostrar éxito únicamente después de que el servidor guarde la review.
    setDialog('confirmed');
  };
  if (id && !existing)
    return (
      <Screen title="Editar review" back>
        <EmptyState
          title="Review no encontrada"
          text="Solo podés editar tus propias reviews de anime."
          action="Ir a mi perfil"
          onPress={() => router.replace('/perfil')}
        />
      </Screen>
    );
  if (existing && existing.userId !== currentUser.id)
    return (
      <Screen title="Editar review" back>
        <EmptyState
          title="Esta review pertenece a otra persona"
          text="Solo podés editar tus propias reviews de anime."
          action="Ir a mi perfil"
          onPress={() => router.replace('/perfil')}
        />
      </Screen>
    );
  if (existing && !existing.animeId)
    return (
      <Screen title="Editar review" back>
        <EmptyState
          title="Esta publicación no es una review"
          text="Solo podés editar tus propias reviews de anime."
          action="Ir a mi perfil"
          onPress={() => router.replace('/perfil')}
        />
      </Screen>
    );
  if (!item)
    return (
      <Screen title="Escribir review" back>
        <EmptyState
          title="Anime no encontrado"
          text="Elegí un anime válido antes de comenzar tu review."
          action="Buscar anime"
          onPress={() => router.replace('/busqueda')}
        />
      </Screen>
    );

  return (
    <Screen
      title={existing ? 'Editar review' : 'Escribir review'}
      subtitle="Tu mirada también forma parte de la historia."
      back
    >
      <View style={styles.anime}>
        <AnimeCard item={item} width={75} />
        <View style={styles.grow}>
          <Text style={styles.animeTitle}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.year} · {item.episodes} episodios
          </Text>
          <Text style={styles.meta}>{item.genres.join(' · ')}</Text>
          <Text style={styles.general}>
            ★ {item.rating.toFixed(1)} <Text style={styles.meta}>puntuación general</Text>
          </Text>
        </View>
      </View>
      <Section title="Tu puntuación" />
      <View style={styles.scoreRow}>
        {scores.map((value) => (
          <Pressable
            key={value}
            accessibilityRole="button"
            accessibilityLabel={`Puntuar ${value} sobre 10`}
            accessibilityState={{ selected: score === value }}
            onPress={() => setRating(String(value))}
            style={[styles.score, score === value && styles.scoreActive]}
          >
            <Text style={[styles.scoreText, score === value && styles.scoreTextActive]}>
              {value}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Puntuación exacta</Text>
          <TextInput
            accessibilityLabel="Puntuación de 1 a 10"
            value={rating}
            onChangeText={setRating}
            onBlur={() => setTouched(true)}
            keyboardType="decimal-pad"
            maxLength={4}
            placeholder="9,5"
            placeholderTextColor={theme.colors.textSecondary}
            style={[styles.input, styles.scoreInput]}
          />
          <Text style={styles.meta}>/ 10</Text>
        </View>
        {touched && !validScore && (
          <Text style={styles.error}>Elegí una puntuación entre 1 y 10.</Text>
        )}
      </View>
      <Section title="¿Qué te dejó este anime?" />
      <View style={styles.card}>
        <TextInput
          accessibilityLabel="Texto de tu review"
          value={text}
          onChangeText={setText}
          onBlur={() => setTouched(true)}
          multiline
          maxLength={2000}
          placeholder="Contá qué te gustó, qué te sorprendió y a quién se lo recomendarías…"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, styles.multiline]}
        />
        <Text style={styles.meta}>{text.length} / 2000 · Mínimo 10 caracteres.</Text>
        {touched && text.trim().length < 10 && (
          <Text style={styles.error}>Escribí un poco más para compartir tu opinión.</Text>
        )}
        <View style={styles.row}>
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
        <Text style={styles.label}>Fecha en que lo viste</Text>
        <TextInput
          accessibilityLabel="Fecha de visto, día mes y año"
          value={date}
          onChangeText={setDate}
          onBlur={() => setTouched(true)}
          keyboardType="numbers-and-punctuation"
          maxLength={10}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
        />
        {!validDate && (
          <Text style={styles.error}>Ingresá una fecha válida hasta hoy: DD/MM/AAAA.</Text>
        )}
      </View>
      <Text style={styles.meta}>
        Borrador de ejemplo. La confirmación no publica ni guarda una review real.
      </Text>
      <Action
        label={existing ? 'Guardar cambios' : 'Publicar review'}
        icon="send-outline"
        primary
        disabled={!valid}
        onPress={save}
      />
      <Action label="Cancelar" onPress={() => setDialog('discard')} />
      <Dialog
        visible={dialog === 'confirmed'}
        title={existing ? 'Simulación: cambios preparados' : 'Simulación: review preparada'}
        text="Tu borrador se validó en esta vista. La review no fue enviada ni guardada de forma permanente."
        onClose={() => setDialog(null)}
      >
        <View style={styles.card}>
          <Text style={styles.label}>
            {item.title} · ★ {score.toFixed(1)}
          </Text>
          <Text numberOfLines={3} style={styles.preview}>
            {text.trim()}
          </Text>
          <Text style={styles.meta}>
            {date} · {spoiler ? 'Con spoilers' : 'Sin spoilers'}
          </Text>
        </View>
        <Action
          label="Volver al anime"
          onPress={() => router.replace({ pathname: '/anime/[id]', params: { id: item.id } })}
        />
      </Dialog>
      <Dialog
        visible={dialog === 'discard'}
        title="¿Descartar el borrador?"
        text="Los cambios de esta edición se perderán al salir."
        onClose={() => setDialog(null)}
      >
        <Action label="Descartar y volver" onPress={goBack} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  anime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  grow: { flex: 1, minWidth: 0, gap: 6 },
  animeTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '700' },
  meta: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  general: { color: theme.colors.primarySoft, fontSize: 15, fontWeight: '600' },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  score: {
    width: 43,
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
  },
  scoreActive: { borderColor: theme.colors.primary, backgroundColor: theme.colors.primaryDark },
  scoreText: { color: theme.colors.textSecondary, fontSize: 15, fontWeight: '600' },
  scoreTextActive: { color: theme.colors.text },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 13,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    color: theme.colors.text,
    fontSize: 14,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
  },
  scoreInput: { width: 64, textAlign: 'center' },
  multiline: { minHeight: 170, textAlignVertical: 'top', lineHeight: 22 },
  error: { color: theme.colors.accentSoft, fontSize: 12, lineHeight: 18 },
  preview: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
});
