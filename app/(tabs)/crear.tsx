import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Chips, EmptyState, Screen, SearchBar } from '../../src/components';
import { anime } from '../../src/mock';
import { theme } from '../../src/theme';

export default function Crear() {
  const [mode, setMode] = useState('Posteo');
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const candidates = anime
    .filter((item) => {
      const searchableText = `${item.title} ${item.genres.join(' ')}`.toLowerCase();
      return searchableText.includes(normalizedQuery);
    })
    .slice(0, 8);

  return (
    <Screen title="Crear" subtitle="Compartí tu experiencia con otros fans." avatar={false}>
      <Chips
        options={['Posteo', 'Review', 'Lista']}
        value={mode}
        onChange={setMode}
        variant="underline"
      />

      {mode === 'Posteo' ? (
        <>
          <Text style={styles.heading}>Conversaciones sobre anime</Text>
          <Text style={styles.description}>
            Preguntas, recomendaciones y opiniones con hashtags, sin tener que puntuar un anime.
          </Text>
          <Action
            label="Escribir un posteo"
            primary
            icon="create-outline"
            onPress={() => router.push('/crear/posteo')}
          />
        </>
      ) : mode === 'Review' ? (
        <>
          <View style={styles.introduction}>
            <Ionicons name="create-outline" size={25} color={theme.colors.primarySoft} />

            <View style={styles.grow}>
              <Text style={styles.heading}>Crear una review</Text>
              <Text style={styles.description}>
                Primero elegí el anime sobre el que querés escribir.
              </Text>
            </View>
          </View>

          <SearchBar value={query} onChangeText={setQuery} placeholder="Buscar anime" />

          {candidates.map((item) => (
            <Pressable
              key={item.id}
              onPress={() =>
                router.push({
                  pathname: '/crear/review/escribir',
                  params: { animeId: item.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Crear review de ${item.title}`}
              style={styles.animeRow}
            >
              <Image source={item.image} style={styles.poster} />

              <View style={styles.grow}>
                <Text style={styles.animeTitle}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.year} · {item.genres.slice(0, 2).join(' · ')}
                </Text>
                <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={theme.colors.primarySoft} />
            </Pressable>
          ))}

          {candidates.length === 0 && (
            <EmptyState title="No encontramos ese anime" text="Probá buscando otro título." />
          )}
        </>
      ) : (
        <>
          <View style={styles.introduction}>
            <Ionicons name="albums-outline" size={25} color={theme.colors.primarySoft} />

            <View style={styles.grow}>
              <Text style={styles.heading}>Crear una lista</Text>
              <Text style={styles.description}>
                Reuní anime en una colección o armá un top personal.
              </Text>
            </View>
          </View>

          <Action
            label="Crear nueva lista"
            icon="add-outline"
            primary
            onPress={() => router.push('/perfil/listas/editar')}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  introduction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  grow: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },

  heading: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },

  description: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },

  animeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },

  poster: {
    width: 52,
    height: 72,
    borderRadius: 7,
    backgroundColor: theme.colors.surfaceLight,
  },

  animeTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },

  meta: {
    color: theme.colors.textSecondary,
    fontSize: 11,
  },

  rating: {
    color: theme.colors.primarySoft,
    fontSize: 12,
    fontWeight: '600',
  },
});
