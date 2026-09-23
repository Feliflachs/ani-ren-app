import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Dialog,
  EmptyState,
  Screen,
  SearchBar,
  Section,
} from '../../src/components';
import { anime, currentUser, findAnime, getParam, lists } from '../../src/mock';
import { theme } from '../../src/theme';

type ListDialog = 'confirmed' | 'discard' | null;

export default function EditarListaScreen() {
  const params = useLocalSearchParams();
  const id = getParam(params.id);
  // TODO BACKEND [LISTA-EDITAR-CONSULTA]: recuperar lista por id y verificar permisos de currentUser.id.
  const existing = lists.find((item) => item.id === id);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [ordered, setOrdered] = useState(existing?.ordered ?? false);
  const initialAnime = findAnime(getParam(params.animeId));
  const initialAnimeIds = [...(existing?.animeIds ?? [])];
  if (!existing && initialAnime) initialAnimeIds.push(initialAnime.id);
  const [animeIds, setAnimeIds] = useState<string[]>(initialAnimeIds);
  const [query, setQuery] = useState('');
  const [dialog, setDialog] = useState<ListDialog>(null);
  const [titleTouched, setTitleTouched] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  // TODO BACKEND [LISTA-ANIME-BUSCAR]: reemplazar el filtro del catálogo mock por una búsqueda de anime con normalizedQuery.
  const candidates = anime.filter((item) => item.title.toLowerCase().includes(normalizedQuery));
  const selected = animeIds.map(findAnime).filter((item) => item !== undefined);
  const valid = title.trim().length >= 3 && selected.length > 0;
  const goBack = () =>
    router.canGoBack()
      ? router.back()
      : router.replace({ pathname: '/biblioteca', params: { tab: 'Listas' } });
  const moveAnime = (index: number, direction: number) => {
    setAnimeIds((previous) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= previous.length) return previous;
      const next = [...previous];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };
  const addAnime = (animeId: string) => {
    setAnimeIds((previous) => (previous.includes(animeId) ? previous : [...previous, animeId]));
  };
  const removeAnime = (animeId: string) => {
    setAnimeIds((previous) => previous.filter((item) => item !== animeId));
  };
  const save = () => {
    if (!valid) return;
    // TODO BACKEND [LISTA-GUARDAR]: hoy se confirma una vista previa; guardar id opcional, currentUser.id, título, descripción, animeIds y ordered.
    // Verificar autor y confirmar únicamente tras la respuesta real del servidor.
    setDialog('confirmed');
  };

  if (id && !existing)
    return (
      <Screen title="Editar lista" back>
        <EmptyState
          title="Lista no encontrada"
          text="Podés crear una colección propia con tus historias favoritas."
          action="Crear mi lista"
          onPress={() => router.replace('/lista/editar')}
        />
      </Screen>
    );
  if (existing && existing.userId !== currentUser.id)
    return (
      <Screen title="Editar lista" back>
        <EmptyState
          title="Esta lista pertenece a otra persona"
          text="Podés crear una colección propia con tus historias favoritas."
          action="Crear mi lista"
          onPress={() => router.replace('/lista/editar')}
        />
      </Screen>
    );
  return (
    <Screen
      title={existing ? 'Editar lista' : 'Nueva lista'}
      subtitle="Guardá historias juntas, a tu manera."
      back
    >
      <View style={styles.card}>
        <Text style={styles.label}>Nombre de la lista</Text>
        <TextInput
          accessibilityLabel="Nombre de la lista"
          value={title}
          onChangeText={setTitle}
          onBlur={() => setTitleTouched(true)}
          maxLength={80}
          placeholder="Mi próxima maratón"
          placeholderTextColor={theme.colors.textSecondary}
          style={styles.input}
        />
        {titleTouched && title.trim().length < 3 && (
          <Text style={styles.error}>Escribí un nombre de al menos 3 caracteres.</Text>
        )}
        <Text style={styles.label}>Descripción</Text>
        <TextInput
          accessibilityLabel="Descripción de la lista"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={500}
          placeholder="¿Qué une a estos animes?"
          placeholderTextColor={theme.colors.textSecondary}
          style={[styles.input, styles.multiline]}
        />
        <View style={styles.row}>
          <View style={styles.grow}>
            <Text style={styles.label}>Convertir en top personal</Text>
            <Text style={styles.meta}>Mostrar puestos según el orden elegido.</Text>
          </View>
          <Switch
            accessibilityLabel="Lista ordenada"
            value={ordered}
            onValueChange={setOrdered}
            trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primaryDark }}
            thumbColor={ordered ? theme.colors.primarySoft : theme.colors.textSecondary}
          />
        </View>
      </View>
      <Section title={`Tu lista · ${selected.length} animes`} />
      {selected.length === 0 && (
        <EmptyState
          title="La primera historia está por llegar"
          text="Buscá un anime y agregalo a tu colección."
        />
      )}
      {selected.map((item, index) => (
        <View key={item.id} style={styles.selected}>
          <View style={styles.row}>
            <AnimeCard item={item} width={60} />
            <View style={styles.grow}>
              <Text style={styles.title}>
                {ordered ? `#${index + 1} · ` : ''}
                {item.title}
              </Text>
              <Text style={styles.meta}>{item.genres.slice(0, 2).join(' · ')}</Text>
              <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
            </View>
          </View>
          <View style={styles.controls}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Subir ${item.title}`}
              accessibilityState={{ disabled: index === 0 }}
              disabled={index === 0}
              onPress={() => moveAnime(index, -1)}
              style={[styles.control, index === 0 && styles.disabled]}
            >
              <Ionicons name="arrow-up" size={17} color={theme.colors.primarySoft} />
              <Text style={styles.controlText}>Subir</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bajar ${item.title}`}
              accessibilityState={{ disabled: index === selected.length - 1 }}
              disabled={index === selected.length - 1}
              onPress={() => moveAnime(index, 1)}
              style={[styles.control, index === selected.length - 1 && styles.disabled]}
            >
              <Ionicons name="arrow-down" size={17} color={theme.colors.primarySoft} />
              <Text style={styles.controlText}>Bajar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item.title}`}
              onPress={() => removeAnime(item.id)}
              style={styles.control}
            >
              <Ionicons name="close" size={17} color={theme.colors.accentSoft} />
              <Text style={styles.controlText}>Quitar</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <Section title="Agregar anime" />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar anime para tu lista" />
      {candidates.length === 0 && <EmptyState text="Probá con otro título para encontrarlo." />}
      {candidates.map((item) => {
        const isAdded = animeIds.includes(item.id);
        return (
          <View key={item.id} style={styles.candidate}>
            <View style={styles.grow}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.year} · ★ {item.rating}
              </Text>
            </View>
            <Action
              label={isAdded ? 'Ya agregado' : 'Agregar'}
              icon={isAdded ? 'checkmark' : 'add'}
              disabled={isAdded}
              onPress={() => addAnime(item.id)}
            />
          </View>
        );
      })}
      {!valid && (
        <Text style={styles.meta}>Para guardar, elegí un nombre y agregá al menos un anime.</Text>
      )}
      <Text style={styles.meta}>La lista es una demostración local; no se guarda al salir.</Text>
      <Action
        label={existing ? 'Guardar cambios' : 'Crear lista'}
        icon="checkmark-circle-outline"
        primary
        disabled={!valid}
        onPress={save}
      />
      <Action label="Cancelar" onPress={() => setDialog('discard')} />
      <Dialog
        visible={dialog === 'confirmed'}
        title="Simulación: lista preparada"
        text="La vista previa está lista. No se creó ni modificó una colección permanente."
        onClose={() => setDialog(null)}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{title.trim()}</Text>
          <Text style={styles.meta}>
            {selected.length} animes · {ordered ? 'Top personal' : 'Colección'}
          </Text>
          <Text numberOfLines={3} style={styles.meta}>
            {description.trim() || 'Sin descripción'}
          </Text>
        </View>
        <Action label="Volver" onPress={goBack} />
      </Dialog>
      <Dialog
        visible={dialog === 'discard'}
        title="¿Salir de la edición?"
        text="Tu borrador local se descarta al salir."
        onClose={() => setDialog(null)}
      >
        <Action label="Descartar y volver" onPress={goBack} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    color: theme.colors.text,
    fontSize: 14,
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  multiline: { minHeight: 95, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  grow: { flex: 1, minWidth: 0, gap: 5 },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  rating: { color: theme.colors.primarySoft, fontSize: 13 },
  error: { color: theme.colors.accentSoft, fontSize: 12 },
  selected: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 10,
  },
  controls: { flexDirection: 'row', gap: 8 },
  control: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 9,
  },
  controlText: { color: theme.colors.textSecondary, fontSize: 11 },
  disabled: { opacity: 0.35 },
  candidate: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    padding: 11,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
