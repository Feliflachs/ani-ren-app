import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, AnimeCard, Avatar, EmptyState, Screen, Section } from '../../src/components';
import { currentUser, findAnime, findUser, getParam, lists } from '../../src/mock';
import { theme } from '../../src/theme';

export default function ListaScreen() {
  const params = useLocalSearchParams();
  // TODO BACKEND [LISTA-DETALLE]: consultar lista por id, autor, pertenencia y orden de animeIds.
  const list = lists.find((item) => item.id === getParam(params.id));
  const [liked, setLiked] = useState(false);
  if (!list)
    return (
      <Screen title="Lista" back>
        <EmptyState
          title="Esta lista no está disponible"
          text="Puede haberse eliminado o el enlace no ser correcto."
          action="Ver mi biblioteca"
          onPress={() => router.replace({ pathname: '/biblioteca', params: { tab: 'Listas' } })}
        />
      </Screen>
    );
  const author = findUser(list.userId);
  const items = list.animeIds.map(findAnime).filter((item) => item !== undefined);
  const own = list.userId === currentUser.id;
  const toggleLike = () => {
    // TODO BACKEND [LISTA-LIKE]: hoy cambia un contador local; guardar like de currentUser.id a list.id.
    setLiked((value) => !value);
  };
  return (
    <Screen title={list.ordered ? 'Top personal' : 'Lista de anime'} back>
      <View style={styles.hero}>
        <Text style={styles.title}>{list.title}</Text>
        <Text style={styles.body}>{list.description}</Text>
        <View style={styles.row}>
          <Avatar
            user={author}
            size={38}
            onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: list.userId } })}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: list.userId } })}
            style={styles.grow}
          >
            <Text style={styles.name}>{author?.name ?? 'Usuario'}</Text>
            <Text style={styles.meta}>
              {items.length} animes · {list.ordered ? 'Lista ordenada' : 'Colección'}
            </Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={styles.grow}>
          <Action
            label={`${liked ? 'Te gusta' : 'Me gusta'} · ${list.likes + (liked ? 1 : 0)}`}
            icon={liked ? 'heart' : 'heart-outline'}
            active={liked}
            onPress={toggleLike}
          />
        </View>
        {own && (
          <View style={styles.grow}>
            <Action
              label="Editar lista"
              icon="create-outline"
              onPress={() => router.push({ pathname: '/lista/editar', params: { id: list.id } })}
            />
          </View>
        )}
      </View>
      <Section title={list.ordered ? 'El orden de mis favoritos' : 'Historias de esta colección'} />
      {items.length === 0 && (
        <EmptyState
          title="Todavía no hay anime"
          text="Esta colección está esperando su primera historia."
        />
      )}
      {items.map((item, index) => (
        <View key={item.id} style={styles.card}>
          {list.ordered && <Text style={styles.position}>#{index + 1}</Text>}
          <AnimeCard item={item} width={74} />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: item.id } })}
            style={styles.grow}
          >
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.year} · {item.episodes} episodios
            </Text>
            <Text style={styles.body}>{item.genres.join(' · ')}</Text>
            <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>
          </Pressable>
        </View>
      ))}
      <Text style={styles.meta}>Lista de ejemplo. Los likes de esta vista son temporales.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  title: { color: theme.colors.text, fontSize: 23, fontWeight: '700', lineHeight: 29 },
  body: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1, minWidth: 0, gap: 7 },
  name: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  position: { color: theme.colors.primarySoft, fontSize: 18, fontWeight: '700', width: 29 },
  rating: { color: theme.colors.primarySoft, fontSize: 15, fontWeight: '600' },
});
