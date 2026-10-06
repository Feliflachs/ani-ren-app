import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Avatar, Chips, Dialog, EmptyState, Screen} from '../../src/components';
import { useAppState } from '../../src/AppState';
import {
  currentLikedReviewIds,
  currentUser,
  findAnime,
  findUser,
  reviews,
} from '../../src/mock';
import { theme } from '../../src/theme';

export default function Inicio() {
  const { followingIds, friendIds, toggleFollowing } = useAppState();
  const [filter, setFilter] = useState('Para ti');
  const [likes, setLikes] = useState<string[]>([...currentLikedReviewIds]);
  const [saved, setSaved] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  // TODO BACKEND [SOCIAL-FEED]: consultar el feed con texto, filtro y usuario; hoy son relaciones y publicaciones de ejemplo.
  const feed = reviews
    .filter((item) => {
      if (filter === 'Para ti') {
        return item.userId === currentUser.id || friendIds.includes(item.userId);
      }

      if (filter === 'Siguiendo') {
        return followingIds.includes(item.userId);
      }

      return true;
    })
    .sort((a, b) => {
      if (filter === 'Tendencia') {
        const interactionsA = a.likes + a.comments;
        const interactionsB = b.likes + b.comments;

        return interactionsB - interactionsA;
      }

      return 0;
    });

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
    <Screen
      title={
        <>
          Ani-Ren{' '}
          <Image
            source={require('../../assets/mascota-transparente.png')}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
            accessibilityLabel="Símbolo de Ani-ren"
          />
        </>
      }
      avatar={false}
      headerCentered
    >
      <Chips
        options={['Para ti', 'Siguiendo', 'Tendencia']}
        value={filter}
        onChange={setFilter}
        variant="underline"
      />
      {feed.map((item) => {
        const author = findUser(item.userId);
        const isFollowing = followingIds.includes(item.userId);
        const isCurrentUser = item.userId === currentUser.id;
        const selectedAnime = findAnime(item.animeId);
        const liked = likes.includes(item.id);
        const initiallyLiked = currentLikedReviewIds.includes(item.id);
        return (
          <View key={item.id} style={styles.post}>
            <View style={styles.postHeader}>
              <Avatar
                user={author}
                size={50}
                onPress={() =>
                  router.push({ pathname: '/perfil/usuario/[id]', params: { id: item.userId } })
                }
              />
              <View style={styles.author}>
                <View style={styles.authorLine}>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/perfil/usuario/[id]',
                        params: { id: item.userId },
                      })
                    }
                    accessibilityRole="button"
                  >
                    <Text style={styles.authorName}>{author?.name}</Text>
                  </Pressable>

                  {!isCurrentUser && (
                    <Pressable
                      onPress={() => toggleFollowing(item.userId)}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isFollowing
                          ? `Dejar de seguir a ${author?.name}`
                          : `Seguir a ${author?.name}`
                      }
                      style={[
                        styles.followButton,
                        isFollowing && styles.followingButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.followText,
                          isFollowing && styles.followingText,
                        ]}
                      >
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                      </Text>
                    </Pressable>
                  )}
                </View>

                <Text style={styles.small}>{item.time}</Text>
              </View>
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
              onPress={() => router.push({ pathname: '/inicio/review/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel="Leer publicación completa"
            >
              {item.title && (
                <Text style={styles.reviewTitle}>{item.title}</Text>
              )}
              <Text style={styles.postText}>
                {item.spoiler
                  ? '⚠ Contiene spoilers. Abrí la review para revelar el contenido.'
                  : item.text}
              </Text>
            </Pressable>
            {selectedAnime && (
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/explorar/anime/[id]', params: { id: selectedAnime.id } })
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
                onPress={() => router.push({ pathname: '/inicio/review/[id]', params: { id: item.id } })}
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
  post: {
    paddingVertical: 16,
    paddingHorizontal: 2,
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  postHeader: { flexDirection: 'row', gap: 9, alignItems: 'center' },
  author: {
    flex: 1,
    gap: 3,
  },

  authorLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  followButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary,
  },

  followingButton: {
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },

  followText: {
    color: theme.colors.text,
    fontSize: 9,
    fontWeight: '600',
  },

  followingText: {
    color: theme.colors.textSecondary,
  },
  authorName: { fontSize: 12, fontWeight: '600', color: theme.colors.primarySoft },
  small: { color: theme.colors.textSecondary, fontSize: 10, lineHeight: 17 },
  postText: { color: theme.colors.textSoft, fontSize: 12, lineHeight: 19 },
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
  reviewTitle: {
    color: theme.colors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginBottom: 6,
  },
});
