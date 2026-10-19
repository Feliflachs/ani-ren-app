import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Screen, Action } from '../../src/components';
import { AnimePicker, ui } from '../../src/remote-ui';
import { theme } from '../../src/theme';

export default function Crear() {
  const [mode, setMode] = useState<'review' | 'rating' | null>(null);
  return (
    <Screen
      title="Tu próxima opinión"
      subtitle="Un anime, muchas formas de compartirlo."
      avatar={false}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>CREÁ EN ANI-REN</Text>
        <Text style={styles.heading}>¿Qué te dejó ese anime?</Text>
        <Text style={ui.text}>
          Guardá tu puntuación, contá tu experiencia o abrí una conversación.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        style={[styles.choice, mode === 'review' && styles.selected]}
        onPress={() => setMode('review')}
      >
        <Ionicons name="create-outline" size={28} color={theme.colors.primarySoft} />
        <View style={ui.grow}>
          <Text style={ui.title}>Escribir una review</Text>
          <Text style={ui.muted}>Tu puntuación y una opinión con tu mirada.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primarySoft} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        style={[styles.choice, mode === 'rating' && styles.selected]}
        onPress={() => setMode('rating')}
      >
        <Ionicons name="star-outline" size={28} color={theme.colors.primarySoft} />
        <View style={ui.grow}>
          <Text style={ui.title}>Valorar un anime</Text>
          <Text style={ui.muted}>Elegí tus estrellas. Podés guardar sin escribir.</Text>
        </View>
      </Pressable>
      {mode && (
        <View style={ui.card}>
          <Text style={ui.title}>
            {mode === 'rating' ? '¿Qué anime querés valorar?' : 'Elegí el anime de tu review'}
          </Text>
          <AnimePicker
            onSelect={(anime) =>
              router.push({
                pathname: '/crear/review/escribir',
                params: { animeId: anime.id, mode },
              })
            }
          />
          <Action label="Cancelar selección" onPress={() => setMode(null)} />
        </View>
      )}
      <Pressable
        accessibilityRole="button"
        style={styles.choice}
        onPress={() => router.push('/crear/posteo')}
      >
        <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.accentSoft} />
        <View style={ui.grow}>
          <Text style={ui.title}>Publicar</Text>
          <Text style={ui.muted}>Preguntá, recomendá o compartí lo que pensás.</Text>
        </View>
      </Pressable>
      <View style={styles.list}>
        <Text style={ui.title}>También podés crear una lista</Text>
        <Text style={ui.muted}>
          Tus favoritos de un género, un top personal o una selección para compartir.
        </Text>
        <Action
          label="Armar lista"
          icon="list-outline"
          onPress={() => router.push('/perfil/listas/editar')}
        />
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  hero: {
    backgroundColor: '#211831',
    borderRadius: 24,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  kicker: { color: theme.colors.primarySoft, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  heading: { color: theme.colors.text, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    minHeight: 96,
  },
  selected: { borderColor: theme.colors.primarySoft, backgroundColor: '#211831' },
  list: { padding: 16, gap: 10 },
});
