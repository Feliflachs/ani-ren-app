import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { Action, Chips, Dialog, Screen, Section } from '../src/components';
import { theme } from '../src/theme';

const getPreviewFontSize = (size: string) => {
  if (size === 'Pequeño') return 12;
  if (size === 'Grande') return 18;
  return 14;
};

export default function AjustesScreen() {
  // TODO BACKEND [AJUSTES-CARGAR]: recuperar las preferencias del usuario; hoy se usan valores iniciales de ejemplo.
  const [textSize, setTextSize] = useState('Normal');
  const [hideSpoilers, setHideSpoilers] = useState(true);
  const [saved, setSaved] = useState(false);
  const previewFontSize = getPreviewFontSize(textSize);
  const previewTextStyle = { fontSize: previewFontSize, lineHeight: previewFontSize * 1.6 };
  const save = () => {
    // TODO BACKEND [AJUSTES-GUARDAR]: guardar tamaño de texto y preferencia de spoilers del usuario; hoy solo confirma esta demostración.
    setSaved(true);
  };

  return (
    <Screen title="Ajustes" subtitle="Elegí cómo querés vivir Ani-ren." back>
      <Section title="Lectura" />
      <View style={styles.panel}>
        <Text style={styles.title}>Tamaño de texto</Text>
        <Chips options={['Pequeño', 'Normal', 'Grande']} value={textSize} onChange={setTextSize} />
        <Text style={styles.meta}>El cambio se muestra en la vista previa de esta pantalla.</Text>
      </View>
      <View style={styles.panel}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <Text style={styles.title}>Ocultar spoilers</Text>
            <Text style={styles.meta}>Ocultá el contenido marcado como spoiler.</Text>
          </View>
          <Switch
            accessibilityLabel="Ocultar spoilers en la vista previa"
            value={hideSpoilers}
            onValueChange={setHideSpoilers}
            trackColor={{ false: theme.colors.surfaceLight, true: theme.colors.primaryDark }}
            thumbColor={theme.colors.primarySoft}
          />
        </View>
      </View>
      <Section title="Vista previa" />
      <View style={styles.preview}>
        <Text style={styles.previewLabel}>REVIEW DE EJEMPLO · FRIEREN</Text>
        <Text style={[styles.previewText, previewTextStyle]}>
          Las historias también viven en los recuerdos que compartimos.
        </Text>
        <View style={styles.spoilerBox}>
          <Text style={styles.spoilerLabel}>⚠ Spoiler de demostración</Text>
          <Text style={[styles.previewText, previewTextStyle]}>
            {hideSpoilers
              ? 'Contenido oculto. Desactivá el control para revelar el ejemplo.'
              : 'Ejemplo revelado: un personaje descubre una carta de su antiguo compañero.'}
          </Text>
        </View>
      </View>
      <Section title="Cámara y galería" />
      <View style={styles.panel}>
        <Text style={styles.body}>
          En Editar perfil podés probar un selector y una vista previa de avatar. La cámara, galería
          y sus permisos reales se conectarán después.
        </Text>
        <Action
          label="Probar selector de avatar"
          icon="camera-outline"
          onPress={() => router.push('/editar-perfil')}
        />
      </View>
      <Section title="Acerca de Ani-ren" />
      <View style={styles.panel}>
        <Text style={styles.title}>Tus anime, tu comunidad, tu Aura.</Text>
        <Text style={styles.body}>
          Prototipo visual con datos de ejemplo. El mapa, rangos, publicaciones y análisis Aura son
          demostraciones.
        </Text>
        <Text style={styles.meta}>
          La app conserva su identidad oscura. Los ajustes son locales y no cambian otras pantallas.
        </Text>
      </View>
      <Action
        label="Solicitar agregar un anime"
        icon="add-circle-outline"
        onPress={() => router.push('/solicitar-anime')}
      />
      <Action
        label="Guardar preferencias de ejemplo"
        primary
        icon="checkmark-outline"
        onPress={save}
      />
      <Dialog
        visible={saved}
        title="Preferencias de ejemplo"
        text="Simulación: las opciones se reflejan en esta vista previa. No se guardaron en un servidor ni al reiniciar."
        onClose={() => setSaved(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: 15,
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 6 },
  preview: {
    padding: 16,
    gap: 13,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewLabel: { color: theme.colors.primarySoft, fontSize: 10, letterSpacing: 1 },
  previewText: { color: theme.colors.text },
  spoilerBox: { paddingTop: 12, gap: 8, borderTopWidth: 1, borderColor: theme.colors.border },
  spoilerLabel: { color: theme.colors.accentSoft, fontSize: 11 },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 21 },
});
