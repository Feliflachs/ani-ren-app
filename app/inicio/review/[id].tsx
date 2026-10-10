import { useDirectory } from '../../../src/useDirectory';
import { usePublications } from '../../../src/context/PublicationsContext';
import { useCurrentUser } from '../../../src/useCurrentUser';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  PublicationContent,
  Action,
  SocialAction,
  Dialog,
  Avatar,
  EmptyState,
  Screen,
  Section,
} from '../../../src/components';
import { findAnime, getParam } from '../../../src/mock';
import { theme } from '../../../src/theme';

export default function ReviewScreen() {
  const { findUser } = useDirectory();
  const {
    publications,
    getLikedIds,
    getComments,
    toggleLike: toggleReviewLike,
    addComment: saveComment,
  } = usePublications();

  const currentUser = useCurrentUser();

  const params = useLocalSearchParams();
  // TODO BACKEND [REVIEW-DETALLE]: consultar publicación, autor, likes y comentarios mediante params.id.
  const review = publications.find((item) => item.id === getParam(params.id));
  const reviewId = getParam(params.id) ?? '';
  const liked = getLikedIds(currentUser.id).includes(reviewId);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState('');
  const commentInput = useRef<TextInput>(null);
  const [sharing, setSharing] = useState(false);
  const comments = getComments(reviewId);
  if (!review)
    return (
      <Screen title="Publicación" back>
        <EmptyState
          title="No encontramos esta publicación"
          text="Puede haberse eliminado o el enlace no ser correcto."
          action="Ir a Inicio"
          onPress={() => router.replace('/inicio')}
        />
      </Screen>
    );
  const author = findUser(review.userId);
  const item = findAnime(review.animeId);
  const hidden = review.spoiler && !revealed;
  const toggleLike = () => {
    // TODO BACKEND [REVIEW-LIKE]: conectar toggleLike del contexto con la API.
    toggleReviewLike(currentUser.id, reviewId);
  };
  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    // TODO BACKEND [COMENTARIO-CREAR]: conectar addComment del contexto con la API.
    saveComment(currentUser.id, reviewId, text);
    setDraft('');
  };
  return (
    <Screen title={item ? 'Review' : 'Publicación'} back>
      <View style={styles.reviewContainer}>
        <View style={styles.row}>
          <Avatar
            user={author}
            onPress={() =>
              router.push({ pathname: '/perfil/usuario/[id]', params: { id: review.userId } })
            }
          />
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/perfil/usuario/[id]', params: { id: review.userId } })
            }
            style={styles.grow}
          >
            <Text style={styles.name}>{author?.name ?? 'Usuario'}</Text>
            <Text style={styles.meta}>
              @{author?.handle ?? 'usuario'} · {review.time}
            </Text>
          </Pressable>
          {review.rating !== undefined && (
            <Text style={styles.rating}>★ {review.rating.toFixed(1)}</Text>
          )}
        </View>
        {item && (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/explorar/anime/[id]', params: { id: item.id } })
            }
            style={styles.animeLink}
          >
            <Image source={item.image} style={styles.animeThumbnail} />
            <View style={styles.grow}>
              <Text style={styles.link}>{item.title}</Text>
              <Text style={styles.meta}>
                {item.year} · {item.genres.slice(0, 2).join(' / ')}
              </Text>
            </View>
          </Pressable>
        )}
        <PublicationContent
          key={reviewId}
          review={review}
          revealed={revealed}
          onReveal={() => setRevealed(true)}
        />
        {review.spoiler && revealed && (
          <Action label="Ocultar spoilers" onPress={() => setRevealed(false)} />
        )}
        <View style={styles.actions}>
          <SocialAction
            count={review.likes}
            label={liked ? 'Quitar like' : 'Dar like'}
            icon={liked ? 'heart' : 'heart-outline'}
            active={liked}
            onPress={toggleLike}
          />
          <SocialAction
            count={review.comments}
            label="Escribir comentario"
            icon="chatbubble-outline"
            disabled={hidden}
            onPress={() => commentInput.current?.focus()}
          />
          <SocialAction
            label="Compartir publicación"
            icon="share-outline"
            onPress={() => setSharing(true)}
          />
          {review.userId === currentUser.id && review.kind === 'post' && (
            <Action
              label="Editar posteo"
              icon="create-outline"
              onPress={() => router.push({ pathname: '/crear/posteo', params: { id: review.id } })}
            />
          )}
          {review.userId === currentUser.id && item && (
            <Action
              label="Editar review"
              icon="create-outline"
              onPress={() =>
                router.push({
                  pathname: '/crear/review/escribir',
                  params: { id: review.id, animeId: item.id },
                })
              }
            />
          )}
        </View>
      </View>
      <Section title={`Comentarios · ${review.comments}`} />
      {!hidden ? (
        <>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Avatar
                user={findUser(comment.userId)}
                size={32}
                onPress={() =>
                  router.push({ pathname: '/perfil/usuario/[id]', params: { id: comment.userId } })
                }
              />
              <View style={styles.grow}>
                <Text style={styles.name}>{findUser(comment.userId)?.name}</Text>
                <Text style={styles.commentText}>{comment.text}</Text>
                <Text style={styles.meta}>{comment.time}</Text>
              </View>
            </View>
          ))}
          <View style={styles.commentComposer}>
            <TextInput
              ref={commentInput}
              accessibilityLabel="Tu comentario"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={500}
              placeholder="Escribí un comentario…"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar comentario"
              accessibilityState={{ disabled: !draft.trim() }}
              style={({ pressed }) => [
                styles.sendButton,
                { opacity: !draft.trim() ? 0.35 : pressed ? 0.65 : 1 },
              ]}
              disabled={!draft.trim()}
              onPress={addComment}
            >
              <Ionicons name="send-outline" size={21} color={theme.colors.primarySoft} />
            </Pressable>
          </View>
          {draft.length >= 400 && <Text style={styles.characterCount}>{draft.length} / 500</Text>}
        </>
      ) : (
        <Text style={styles.meta}>Revelá la review para leer también sus comentarios.</Text>
      )}
      <Dialog
        visible={sharing}
        title="Compartir publicación"
        text="Demostración: esta publicación local todavía no tiene un enlace público para compartir."
        onClose={() => setSharing(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 14,
    padding: 4,
  },
  sendButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  characterCount: { color: theme.colors.textSecondary, fontSize: 11, textAlign: 'right' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1, minWidth: 0, gap: 5 },
  name: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  rating: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 16 },
  animeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
    gap: 12,
  },
  animeThumbnail: { width: 40, height: 56, borderRadius: 5 },
  link: { color: theme.colors.primarySoft, fontSize: 14, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 2,
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    textAlignVertical: 'top',
    color: theme.colors.text,
    padding: 12,
    fontSize: 13,
  },
  reviewContainer: {
    paddingVertical: 14,
    paddingHorizontal: 2,
    gap: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: 'transparent',
  },
  commentText: {
    color: theme.colors.text,
    fontSize: 12,
    lineHeight: 19,
  },
});
