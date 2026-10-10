import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { Action, EmptyState, Screen } from '../../src/components';
import { usePublications } from '../../src/context/PublicationsContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import { anime, getParam } from '../../src/mock';
import { normalizeTag } from '../../src/publications';
import { theme } from '../../src/theme';

export default function PosteoScreen() {
  const { publications, savePost } = usePublications();
  const user = useCurrentUser();
  const params = useLocalSearchParams();
  const id = getParam(params.id);
  const existing = publications.find((p) => p.id === id && p.kind === 'post');
  const [text, setText] = useState(existing?.text ?? '');
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const [animeIds, setAnimeIds] = useState<string[]>(
    existing?.kind === 'post' ? existing.animeIds : [],
  );
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function publish() {
    // TODO BACKEND [POSTEO-FORMULARIO]: la conexión va en PublicationsContext.savePost; conservar borrador y errores aquí.
    if (saving || text.trim().length < 3) return;
    setSaving(true);
    setError('');
    try {
      const postId = await savePost(user.id, { text, spoiler, animeIds }, id);
      router.replace({ pathname: '/inicio/review/[id]', params: { id: postId } });
    } catch {
      setError('No pudimos guardar el posteo. Tu texto sigue acá; volvé a intentarlo.');
    } finally {
      setSaving(false);
    }
  }

  if (id && (!existing || existing.userId !== user.id))
    return (
      <Screen title="Posteo" back>
        <EmptyState text="No encontrás este posteo o no te pertenece." />
      </Screen>
    );

  return (
    <Screen
      title={id ? 'Editar posteo' : 'Crear posteo'}
      back
      subtitle="Preguntá, recomendá o compartí una idea."
    >
      <TextInput
        accessibilityLabel="Texto del posteo"
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
        editable={!saving}
        placeholder="Busco algo parecido a #Frieren, ¿qué recomiendan?"
        placeholderTextColor={theme.colors.textSecondary}
        style={[styles.input, styles.textarea]}
      />
      <Text style={styles.meta}>{text.length} / 2000 · Mínimo 3 caracteres.</Text>
      <Text style={styles.label}>Animes mencionados (opcional)</Text>
      <Text style={styles.meta}>
        Elegí un anime para vincularlo a su ficha. También podés escribir hashtags en el texto.
      </Text>
      <View style={styles.tags}>
        {animeIds.map((animeId) => (
          <Action
            key={animeId}
            label={`#${normalizeTag(animeId)} ×`}
            active
            disabled={saving}
            onPress={() => setAnimeIds((previous) => previous.filter((value) => value !== animeId))}
          />
        ))}
      </View>
      <TextInput
        accessibilityLabel="Buscar anime para mencionar"
        value={query}
        onChangeText={setQuery}
        editable={!saving}
        placeholder="Buscar anime"
        placeholderTextColor={theme.colors.textSecondary}
        style={styles.input}
      />
      {!!query.trim() &&
        anime
          .filter(
            (item) =>
              !animeIds.includes(item.id) &&
              item.title.toLowerCase().includes(query.trim().toLowerCase()),
          )
          .map((item) => (
            <Action
              key={item.id}
              label={item.title}
              disabled={saving}
              onPress={() => {
                setAnimeIds((previous) => [...previous, item.id]);
                setQuery('');
              }}
            />
          ))}
      <View style={styles.row}>
        <Text style={styles.label}>Contiene spoilers</Text>
        <Switch
          accessibilityLabel="El posteo contiene spoilers"
          value={spoiler}
          onValueChange={setSpoiler}
          disabled={saving}
        />
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
      <Action
        label={saving ? 'Guardando…' : id ? 'Guardar cambios' : 'Publicar'}
        primary
        disabled={saving || text.trim().length < 3}
        onPress={publish}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: theme.colors.surfaceLight,
    color: theme.colors.text,
  },
  textarea: { minHeight: 150, textAlignVertical: 'top' },
  meta: { color: theme.colors.textSecondary, fontSize: 12 },
  label: { color: theme.colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { color: theme.colors.accentSoft },
});
