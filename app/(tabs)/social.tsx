import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, Chips, Dialog, EmptyState, Screen, SearchBar } from '../../src/components';
import {
  currentFollowingIds,
  currentFriendIds,
  currentLikedReviewIds,
  currentUser,
  findAnime,
  findUser,
  reviews,
  users,
} from '../../src/mock';
import { theme } from '../../src/theme';

export default function SocialScreen() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Para ti');
  const [likes, setLikes] = useState<string[]>([...currentLikedReviewIds]);
  const [saved, setSaved] = useState<string[]>([]);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  // TODO BACKEND [SOCIAL-FEED]: consultar el feed con texto, filtro y usuario; hoy son relaciones y publicaciones de ejemplo.
  const feed = reviews.filter((item) => {
    const author = findUser(item.userId);
    const title = findAnime(item.animeId)?.title ?? '';
    const matchesText = `${author?.name} ${item.text} ${title}`
      .toLowerCase()
      .includes(query.toLowerCase().trim());
    const matchesFilter =
      filter === 'Para ti'
        ? item.userId === currentUser.id || currentFriendIds.includes(item.userId)
        : filter === 'Siguiendo'
          ? currentFollowingIds.includes(item.userId)
          : filter === 'Amigos'
            ? currentFriendIds.includes(item.userId)
            : true;
    return matchesText && matchesFilter;
  });
  const storyUser = findUser(storyId ?? undefined);
  const storyAnime = findAnime(storyUser?.favorites[0]);

  const toggleLike = (id: string) => {
    // TODO BACKEND [SOCIAL-LIKE]: guardar o quitar el like de currentUser.id en la publicación id y actualizar el contador confirmado.
    setLikes((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };
  const toggleSaved = (id: string) => {
    // TODO BACKEND [SOCIAL-GUARDAR]: guardar la publicación id en la colección del usuario; hoy cambia solo el icono local.
    setSaved((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  };

  return (
    <Screen title="Social" subtitle="Conectá con otakus y compartí tu pasión.">
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar usuarios, publicaciones o anime…"
        onSubmit={() => router.push({ pathname: '/busqueda', params: { q: query } })}
      />
      <Chips
        options={['Para ti', 'Siguiendo', 'Amigos', 'Global']}
        value={filter}
        onChange={setFilter}
      />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.stories}
      >
        {users.map((user) => (
          <View key={user.id} style={styles.story}>
            <Avatar user={user} size={53} onPress={() => setStoryId(user.id)} />
            <Text numberOfLines={1} style={styles.storyName}>
              {user.id === currentUser.id ? 'Tu historia' : user.name}
            </Text>
          </View>
        ))}
        <Pressable
          style={styles.moreStories}
          onPress={() => router.push('/comunidad')}
          accessibilityRole="button"
          accessibilityLabel="Ver comunidad"
        >
          <Ionicons name="ellipsis-horizontal" color={theme.colors.primarySoft} size={26} />
          <Text style={styles.storyName}>Ver más</Text>
        </Pressable>
      </ScrollView>
      {feed.map((item) => {
        const author = findUser(item.userId);
        const selectedAnime = findAnime(item.animeId);
        const liked = likes.includes(item.id);
        const initiallyLiked = currentLikedReviewIds.includes(item.id);
        return (
          <View key={item.id} style={styles.post}>
            <View style={styles.postHeader}>
              <Avatar
                user={author}
                size={34}
                onPress={() =>
                  router.push({ pathname: '/usuario/[id]', params: { id: item.userId } })
                }
              />
              <Pressable
                style={styles.author}
                onPress={() =>
                  router.push({ pathname: '/usuario/[id]', params: { id: item.userId } })
                }
                accessibilityRole="button"
              >
                <Text style={styles.authorName}>{author?.name}</Text>
                <Text style={styles.small}>{item.time}</Text>
              </Pressable>
              {item.rating !== undefined && (
                <View style={styles.rating}>
                  <Ionicons name="star" size={12} color={theme.colors.primarySoft} />
                  <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                </View>
              )}
              <Pressable
                onPress={() => setMessage('Compartir esta publicación es una demostración visual.')}
                accessibilityRole="button"
                accessibilityLabel="Opciones de publicación"
                hitSlop={8}
              >
                <Ionicons name="ellipsis-vertical" color={theme.colors.textSecondary} size={18} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => router.push({ pathname: '/review/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel="Leer publicación completa"
            >
              <Text style={styles.postText}>
                {item.spoiler
                  ? '⚠ Contiene spoilers. Abrí la review para revelar el contenido.'
                  : item.text}
              </Text>
            </Pressable>
            {selectedAnime && (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/anime/[id]', params: { id: selectedAnime.id } })
                }
                style={styles.animePreview}
                accessibilityRole="button"
                accessibilityLabel={`Ver ${selectedAnime.title}`}
              >
                <Image source={selectedAnime.image} style={styles.postImage} resizeMode="cover" />
                <View style={styles.animeBody}>
                  <Text style={styles.animeTitle}>{selectedAnime.title}</Text>
                  <Text style={styles.small}>
                    TV · {selectedAnime.year}　
                    <Text style={styles.ratingText}>★ {selectedAnime.rating.toFixed(1)}</Text>
                  </Text>
                  <Text style={styles.synopsis} numberOfLines={3}>
                    {selectedAnime.synopsis}
                  </Text>
                </View>
              </Pressable>
            )}
            <View style={styles.postActions}>
              <Pressable
                onPress={() => toggleLike(item.id)}
                accessibilityRole="button"
                accessibilityLabel={liked ? 'Quitar like' : 'Dar like'}
                accessibilityState={{ selected: liked }}
                style={styles.iconAction}
              >
                <Ionicons
                  name={liked ? 'heart' : 'heart-outline'}
                  color={liked ? theme.colors.primary : theme.colors.textSecondary}
                  size={19}
                />
                <Text style={styles.small}>
                  {item.likes + Number(liked) - Number(initiallyLiked)}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({ pathname: '/review/[id]', params: { id: item.id } })}
                accessibilityRole="button"
                accessibilityLabel="Ver comentarios"
                style={styles.iconAction}
              >
                <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.small}>{item.comments}</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setMessage('Simulación: el enlace de la publicación está listo para compartir.')
                }
                accessibilityRole="button"
                accessibilityLabel="Compartir publicación"
                style={styles.iconAction}
              >
                <Ionicons
                  name="share-social-outline"
                  size={18}
                  color={theme.colors.textSecondary}
                />
              </Pressable>
              <View style={styles.spacer} />
              <Pressable
                onPress={() => toggleSaved(item.id)}
                accessibilityRole="button"
                accessibilityLabel={
                  saved.includes(item.id) ? 'Quitar publicación guardada' : 'Guardar publicación'
                }
                accessibilityState={{ selected: saved.includes(item.id) }}
              >
                <Ionicons
                  name={saved.includes(item.id) ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={theme.colors.primarySoft}
                />
              </Pressable>
            </View>
          </View>
        );
      })}
      {feed.length === 0 && <EmptyState text="Probá con otro texto o elegí otro feed." />}
      <Action
        label="Amigos y conexiones"
        icon="people-outline"
        onPress={() => router.push('/comunidad')}
      />
      <Dialog
        visible={storyUser !== undefined}
        title={`Historia de ${storyUser?.name ?? ''}`}
        text="Historia de ejemplo"
        onClose={() => setStoryId(null)}
      >
        {storyAnime && (
          <>
            <Image source={storyAnime.image} style={styles.storyImage} resizeMode="contain" />
            <Text style={styles.postText}>Mi próxima historia: {storyAnime.title} ✨</Text>
            <Action
              label="Ver anime"
              onPress={() => {
                setStoryId(null);
                router.push({ pathname: '/anime/[id]', params: { id: storyAnime.id } });
              }}
            />
          </>
        )}
      </Dialog>
      <Dialog
        visible={message.length > 0}
        title="Compartir"
        text={message}
        onClose={() => setMessage('')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stories: { gap: 14, paddingVertical: 4 },
  story: { width: 54, gap: 5, alignItems: 'center' },
  storyName: { fontSize: 9, color: theme.colors.textSecondary, textAlign: 'center' },
  moreStories: { width: 53, gap: 12, alignItems: 'center', justifyContent: 'center' },
  post: {
    padding: 12,
    gap: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  postHeader: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  author: { flex: 1 },
  authorName: { fontSize: 12, fontWeight: '600', color: theme.colors.primarySoft },
  small: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 17 },
  postText: { color: theme.colors.text, fontSize: 12, lineHeight: 19 },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 5,
    padding: 5,
  },
  ratingText: { color: theme.colors.primarySoft, fontSize: 11, fontWeight: '600' },
  animePreview: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  postImage: { width: 87, height: 110, backgroundColor: theme.colors.surfaceLight },
  animeBody: { flex: 1, minWidth: 0, padding: 10, gap: 5 },
  animeTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '600' },
  synopsis: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 16 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  iconAction: { flexDirection: 'row', gap: 5, alignItems: 'center', minHeight: 32 },
  spacer: { flex: 1 },
  storyImage: {
    width: '100%',
    height: 210,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
  },
});
