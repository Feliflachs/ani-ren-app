import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Action, Dialog, Screen } from '../src/components';
import { anime, getParam } from '../src/mock';
import { theme } from '../src/theme';

type RequestDialog = 'sent' | 'cancel' | null;

const validLink = (value: string) => {
  try {
    const url = new URL(value);
    return (
      ['http:', 'https:'].includes(url.protocol) && url.hostname.length > 0 && !/\s/.test(value)
    );
  } catch {
    return false;
  }
};

export default function SolicitarAnimeScreen() {
  const params = useLocalSearchParams<{
    title?: string | string[];
    q?: string | string[];
    titulo?: string | string[];
  }>();
  const [title, setTitle] = useState(
    getParam(params.title) ?? getParam(params.titulo) ?? getParam(params.q) ?? '',
  );
  const [alternative, setAlternative] = useState('');
  const [link, setLink] = useState('');
  const [note, setNote] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [dialog, setDialog] = useState<RequestDialog>(null);
  const titleError = title.trim().length === 0;
  const linkError = link.trim().length > 0 && !validLink(link.trim());
  // TODO BACKEND [SOLICITUD-COINCIDENCIAS]: consultar coincidencias del catálogo para el título ingresado; hoy se busca en el array mock.
  const normalizedTitle = title.trim().toLowerCase();
  const matches =
    normalizedTitle.length >= 2
      ? anime.filter((item) => item.title.toLowerCase().includes(normalizedTitle))
      : [];
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/explorar'));
  const send = () => {
    setAttempted(true);
    if (titleError || linkError) return;
    // TODO BACKEND [SOLICITUD-ENVIAR]: enviar título, título alternativo, enlace y nota con el usuario; confirmar recepción solo tras la respuesta real.
    setDialog('sent');
  };

  return (
    <Screen
      title="Solicitar un anime"
      subtitle="¿Falta una historia? Ayudanos a completar el catálogo."
      back
    >
      <View style={styles.intro}>
        <Text style={styles.body}>
          Revisá primero si el anime ya está en el catálogo. Este formulario demuestra el recorrido
          de una solicitud.
        </Text>
      </View>
      <Text style={styles.label}>Título del anime *</Text>
      <TextInput
        style={[styles.input, attempted && titleError && styles.invalid]}
        accessibilityLabel="Título del anime, obligatorio"
        value={title}
        onChangeText={setTitle}
        placeholder="Título original o conocido"
        placeholderTextColor={theme.colors.textSecondary}
        maxLength={100}
      />
      {attempted && titleError && (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          Ingresá el título del anime.
        </Text>
      )}
      {matches.length > 0 && (
        <View style={styles.coincidences}>
          <Text style={styles.warning}>Encontramos una posible coincidencia de ejemplo.</Text>
          {matches.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => router.push({ pathname: '/anime/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              style={styles.match}
            >
              <Text style={styles.label}>{item.title}</Text>
              <Text style={styles.link}>Ver ficha →</Text>
            </Pressable>
          ))}
          <Text style={styles.meta}>
            Podés abrir la ficha o continuar si se trata de otro anime.
          </Text>
        </View>
      )}
      <Text style={styles.label}>Título alternativo</Text>
      <TextInput
        style={styles.input}
        accessibilityLabel="Título alternativo, opcional"
        value={alternative}
        onChangeText={setAlternative}
        placeholder="Opcional"
        placeholderTextColor={theme.colors.textSecondary}
        maxLength={100}
      />
      <Text style={styles.label}>Enlace de referencia</Text>
      <TextInput
        style={[styles.input, attempted && linkError && styles.invalid]}
        accessibilityLabel="Enlace de referencia, opcional"
        value={link}
        onChangeText={setLink}
        placeholder="https://… (opcional)"
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {attempted && linkError && (
        <Text style={styles.error}>Ingresá un enlace válido con http:// o https://.</Text>
      )}
      <Text style={styles.label}>Nota</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        accessibilityLabel="Nota opcional"
        value={note}
        onChangeText={setNote}
        placeholder="Contanos por qué querés agregarlo…"
        placeholderTextColor={theme.colors.textSecondary}
        multiline
        textAlignVertical="top"
        maxLength={400}
      />
      <Text style={styles.counter}>{note.length}/400</Text>
      <Action
        label="Enviar solicitud de ejemplo"
        primary
        icon="paper-plane-outline"
        onPress={send}
      />
      <Action label="Cancelar" onPress={() => setDialog('cancel')} />
      <Text style={styles.meta}>Simulación: este formulario no envía información.</Text>
      <Dialog
        visible={dialog === 'sent'}
        title="Solicitud de ejemplo"
        text={`Simulación: la solicitud de “${title.trim()}” no fue enviada. Este es el aspecto de la confirmación futura.`}
        onClose={goBack}
      />
      <Dialog
        visible={dialog === 'cancel'}
        title="¿Cancelar la solicitud?"
        text="Podés continuar completando el formulario o descartarlo."
        onClose={() => setDialog(null)}
      >
        <Action label="Descartar y volver" onPress={goBack} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21 },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    color: theme.colors.text,
    fontSize: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  invalid: { borderColor: theme.colors.accent },
  multiline: { minHeight: 120 },
  error: { color: theme.colors.accentSoft, fontSize: 12 },
  counter: { color: theme.colors.textSecondary, fontSize: 11, textAlign: 'right' },
  coincidences: {
    padding: 14,
    gap: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },
  warning: { color: theme.colors.primarySoft, fontSize: 12, lineHeight: 19 },
  match: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  link: { color: theme.colors.primarySoft, fontSize: 12 },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 18 },
});
