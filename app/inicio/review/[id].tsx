import { usePage, useRemote } from '../../../src/context/RemoteContext';
import { QueryFooter, withResources } from '../../../src/remote-ui';
import { useDirectory } from '../../../src/useDirectory';
import { usePublications } from '../../../src/context/PublicationsContext';
import { useCurrentUser } from '../../../src/useCurrentUser';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { findAnime, getParam } from '../../../src/data';
import { theme } from '../../../src/theme';

function CommentThread({
  publicationId,
  comment,
  onReply,
}: {
  publicationId: string;
  comment: import('../../../src/api/remote').Wire;
  onReply: (id: string, name: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const replies = usePage(expanded ? `/publications/${publicationId}/comments` : undefined, {
    parentId: comment.id,
  });
  const name = comment.author?.name ?? 'Usuario';
  return (
    <View style={{ gap: 8, paddingVertical: 10 }}>
      <Pressable
        onPress={() =>
          router.push({ pathname: '/perfil/usuario/[id]', params: { id: comment.userId } })
        }
      >
        <Text style={styles.name}>{name}</Text>
      </Pressable>
      <Text style={styles.commentText}>{comment.text}</Text>
      <Text style={styles.meta}>{new Date(comment.createdAt).toLocaleDateString('es-AR')}</Text>
      <View style={styles.actions}>
        <Action
          label="Responder"
          onPress={() => {
            setExpanded(true);
            onReply(comment.id, name);
          }}
        />
        {comment.replyCount > 0 && (
          <Action
            label={expanded ? 'Ocultar respuestas' : `Ver respuestas (${comment.replyCount})`}
            onPress={() => setExpanded((value) => !value)}
          />
        )}
      </View>
      {expanded && (
        <View
          style={{ paddingLeft: 18, borderLeftWidth: 1, borderColor: theme.colors.border, gap: 12 }}
        >
          {replies.items.map((reply) => (
            <View key={reply.id} style={{ gap: 5 }}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/perfil/usuario/[id]', params: { id: reply.userId } })
                }
              >
                <Text style={styles.name}>{reply.author?.name ?? 'Usuario'}</Text>
              </Pressable>
              <Text style={styles.commentText}>{reply.text}</Text>
              <Text style={styles.meta}>
                {new Date(reply.createdAt).toLocaleDateString('es-AR')}
              </Text>
            </View>
          ))}
          <QueryFooter query={replies} />
        </View>
      )}
    </View>
  );
}

function ReviewScreen() {
  const { findUser } = useDirectory();
  const {
    publications,
    getLikedIds,
    toggleLike: toggleReviewLike,
    addComment: saveComment,
  } = usePublications();

  const currentUser = useCurrentUser();

  const params = useLocalSearchParams();
  const review = publications.find((item) => item.id === getParam(params.id));
  const reviewId = getParam(params.id) ?? '';
  const liked = getLikedIds(currentUser.id).includes(reviewId);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState('');
  const commentInput = useRef<ComponentRef<typeof TextInput>>(null);
  const [sharing, setSharing] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const store = useRemote();
  const commentsPage = usePage(`/publications/${reviewId}/comments`);
  const comments = commentsPage.items;
  const [sending, setSending] = useState(false);
  if (!review)
    return (
      <Screen title="Publicación" back>
        <EmptyState
          title="No encontramos esta publicación"
          text="Puede haberse eliminado o el enlace no ser correcto."
          action="Ir a Inicio"
          onPress={() => router.replace('/inicio')}
        />
        <QueryFooter query={commentsPage} />
      </Screen>
    );
  const author = findUser(review.userId);
  const item = findAnime(review.animeId);
  const hidden = review.spoiler && !revealed;
  const toggleLike = () => {
    toggleReviewLike(currentUser.id, reviewId);
  };
  const addComment = async () => {
    if (sending) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      await saveComment(currentUser.id, reviewId, text, replyTo?.id);
    } catch (e) {
      store.report(e);
      return;
    } finally {
      setSending(false);
    }
    setDraft('');
    setReplyTo(null);
  };
  const deletePublication = async () => {
    if (deleting) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await store.mutate(`/publications/${reviewId}`, { method: 'DELETE' });
      router.replace('/inicio');
    } catch (error) {
      setDeleteError(
        error instanceof Error ? error.message : 'No pudimos eliminar la publicación.',
      );
    } finally {
      setDeleting(false);
    }
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
          {review.userId === currentUser.id && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Opciones de publicación"
              accessibilityState={{ expanded: optionsOpen }}
              onPress={() => setOptionsOpen(true)}
              style={({ pressed }) => [styles.menuTrigger, { opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="menu-outline" size={24} color={theme.colors.textSecondary} />
            </Pressable>
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
        </View>
      </View>
      <Modal
        visible={optionsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setOptionsOpen(false)}
      >
        <View style={styles.optionsBackdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            accessibilityRole="button"
            accessibilityLabel="Cerrar opciones"
            onPress={() => setOptionsOpen(false)}
          />
          <View accessibilityViewIsModal style={styles.optionsMenu}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOptionsOpen(false);
                if (review.kind === 'post')
                  router.push({ pathname: '/crear/posteo', params: { id: review.id } });
                else
                  router.push({
                    pathname: '/crear/review/escribir',
                    params: { id: review.id, animeId: review.animeId },
                  });
              }}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Ionicons name="create-outline" size={21} color={theme.colors.text} />
              <Text style={styles.menuOptionText}>Modificar</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOptionsOpen(false);
                setDeleteError('');
                setConfirmDelete(true);
              }}
              style={({ pressed }) => [styles.menuOption, pressed && styles.menuOptionPressed]}
            >
              <Ionicons name="trash-outline" size={21} color={theme.colors.accentSoft} />
              <Text style={[styles.menuOptionText, { color: theme.colors.accentSoft }]}>
                Eliminar
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Section title={`Comentarios · ${review.comments}`} />
      {!hidden ? (
        <>
          {comments.map((comment) => (
            <CommentThread
              key={comment.id}
              publicationId={reviewId}
              comment={comment}
              onReply={(id, name) => {
                setReplyTo({ id, name });
                commentInput.current?.focus();
              }}
            />
          ))}
          <QueryFooter query={commentsPage} />
          {replyTo && (
            <View style={styles.actions}>
              <Text style={styles.meta}>Respondiendo a {replyTo.name}</Text>
              <Action label="Cancelar respuesta" onPress={() => setReplyTo(null)} />
            </View>
          )}
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
              accessibilityState={{ disabled: !draft.trim() || sending }}
              style={({ pressed }) => [
                styles.sendButton,
                { opacity: !draft.trim() ? 0.35 : pressed ? 0.65 : 1 },
              ]}
              disabled={!draft.trim() || sending}
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
        visible={confirmDelete}
        title="¿Eliminar esta publicación?"
        text={
          review.kind === 'review'
            ? 'Se eliminarán el texto, los likes y los comentarios. Tus estrellas y el visto se conservarán en tu biblioteca.'
            : 'Se eliminarán el posteo, sus likes y todos sus comentarios.'
        }
        onClose={() => {
          if (!deleting) setConfirmDelete(false);
        }}
      >
        {!!deleteError && (
          <Text accessibilityRole="alert" style={styles.meta}>
            {deleteError}
          </Text>
        )}
        <Action
          label={deleting ? 'Eliminando…' : 'Eliminar'}
          disabled={deleting}
          onPress={deletePublication}
        />
      </Dialog>
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
  menuTrigger: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  optionsBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsMenu: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    minHeight: 58,
  },
  menuOptionPressed: { backgroundColor: theme.colors.surfaceLight },
  menuOptionText: { color: theme.colors.text, fontSize: 16 },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.border,
    marginHorizontal: 20,
  },
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

export default withResources(ReviewScreen, (p) => [[`/publications/${p.id}`]]);
