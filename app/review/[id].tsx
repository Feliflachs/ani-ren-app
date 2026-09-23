import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Action, AnimeCard, Avatar, EmptyState, Screen, Section } from '../../src/components';
import {
  currentLikedReviewIds,
  currentUser,
  findAnime,
  findUser,
  getParam,
  reviews,
} from '../../src/mock';
import { theme } from '../../src/theme';

type Comment = { id: string; userId: string; text: string; time: string };

// TODO BACKEND [COMENTARIOS-CONSULTA]: cargar la conversación de review.id con sus autores.
const initialComments: Comment[] = [
  {
    id: 'comment-sofi',
    userId: 'sofi',
    text: '¡Me encanta leer opiniones así! Lo mejor es compartir estas historias 💜',
    time: 'Hace 1 h',
  },
  {
    id: 'comment-nico',
    userId: 'nico',
    text: 'Totalmente. Hay escenas que se quedan con vos por mucho tiempo.',
    time: 'Hace 40 min',
  },
];

export default function ReviewScreen() {
  const params = useLocalSearchParams();
  // TODO BACKEND [REVIEW-DETALLE]: consultar publicación, autor, likes y comentarios mediante params.id.
  const review = reviews.find((item) => item.id === getParam(params.id));
  const initiallyLiked = currentLikedReviewIds.includes(getParam(params.id) ?? '');
  const [liked, setLiked] = useState(initiallyLiked);
  const [revealed, setRevealed] = useState(false);
  const [draft, setDraft] = useState('');
  const [comments, setComments] = useState(initialComments);
  if (!review)
    return (
      <Screen title="Publicación" back>
        <EmptyState
          title="No encontramos esta publicación"
          text="Puede haberse eliminado o el enlace no ser correcto."
          action="Ir a Social"
          onPress={() => router.replace('/social')}
        />
      </Screen>
    );
  const author = findUser(review.userId);
  const item = findAnime(review.animeId);
  const hidden = review.spoiler && !revealed;
  const toggleLike = () => {
    // TODO BACKEND [REVIEW-LIKE]: hoy se cambia estado local; guardar interacción entre currentUser.id y review.id.
    setLiked((value) => !value);
  };
  const addComment = () => {
    const text = draft.trim();
    if (!text) return;
    // TODO BACKEND [COMENTARIO-CREAR]: hoy se agrega a la vista; enviar review.id, currentUser.id y texto; incorporar el comentario confirmado.
    setComments((previous) => [
      ...previous,
      {
        id: `local-comment-${previous.length + 1}`,
        userId: currentUser.id,
        text,
        time: 'Ahora · ejemplo',
      },
    ]);
    setDraft('');
  };
  return (
    <Screen title={item ? 'Review' : 'Publicación'} back>
      <View style={styles.card}>
        <View style={styles.row}>
          <Avatar
            user={author}
            onPress={() =>
              router.push({ pathname: '/usuario/[id]', params: { id: review.userId } })
            }
          />
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: '/usuario/[id]', params: { id: review.userId } })
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
            onPress={() => router.push({ pathname: '/anime/[id]', params: { id: item.id } })}
            style={styles.animeLink}
          >
            <Text style={styles.link}>{item.title}</Text>
            <Text style={styles.meta}>
              {item.year} · {item.genres.slice(0, 2).join(' / ')}
            </Text>
          </Pressable>
        )}
        {hidden ? (
          <EmptyState
            title="Esta review contiene spoilers"
            text="Podría revelar detalles importantes de la historia."
            action="Quiero leerla"
            onPress={() => setRevealed(true)}
          />
        ) : (
          <>
            <Text style={styles.body}>{review.text}</Text>
            {review.spoiler && (
              <Action
                label="Ocultar spoilers"
                icon="eye-off-outline"
                onPress={() => setRevealed(false)}
              />
            )}
          </>
        )}
        {item && !hidden && (
          <View style={styles.poster}>
            <AnimeCard item={item} width={160} />
          </View>
        )}
        <View style={styles.actions}>
          <View style={styles.grow}>
            <Action
              label={`${liked ? 'Te gusta' : 'Me gusta'} · ${review.likes + Number(liked) - Number(initiallyLiked)}`}
              icon={liked ? 'heart' : 'heart-outline'}
              active={liked}
              onPress={toggleLike}
            />
          </View>
          {review.userId === currentUser.id && item && (
            <View style={styles.grow}>
              <Action
                label="Editar review"
                icon="create-outline"
                onPress={() =>
                  router.push({
                    pathname: '/review/escribir',
                    params: { id: review.id, animeId: item.id },
                  })
                }
              />
            </View>
          )}
        </View>
      </View>
      <Section
        title={`Comentarios · ${review.comments + comments.length - initialComments.length}`}
      />
      <Text style={styles.meta}>Una conversación de ejemplo con la comunidad.</Text>
      {!hidden ? (
        <>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Avatar
                user={findUser(comment.userId)}
                size={32}
                onPress={() =>
                  router.push({ pathname: '/usuario/[id]', params: { id: comment.userId } })
                }
              />
              <View style={styles.grow}>
                <Text style={styles.name}>{findUser(comment.userId)?.name}</Text>
                <Text style={styles.body}>{comment.text}</Text>
                <Text style={styles.meta}>{comment.time}</Text>
              </View>
            </View>
          ))}
          <View style={styles.card}>
            <Text style={styles.name}>Sumate a la conversación</Text>
            <TextInput
              accessibilityLabel="Tu comentario"
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={500}
              placeholder="¿Qué te pareció?"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />
            <Text style={styles.meta}>{draft.length} / 500 · Se agrega solo en esta vista.</Text>
            <Action
              label="Comentar"
              icon="send-outline"
              primary
              disabled={!draft.trim()}
              onPress={addComment}
            />
          </View>
        </>
      ) : (
        <Text style={styles.meta}>Revelá la review para leer también sus comentarios.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    gap: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1, minWidth: 0, gap: 5 },
  name: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 17 },
  body: { color: theme.colors.text, fontSize: 14, lineHeight: 23 },
  rating: { color: theme.colors.primarySoft, fontWeight: '700', fontSize: 16 },
  animeLink: { padding: 11, backgroundColor: theme.colors.surfaceLight, borderRadius: 10, gap: 4 },
  link: { color: theme.colors.primarySoft, fontSize: 14, fontWeight: '600' },
  poster: { alignItems: 'center', paddingVertical: 4 },
  actions: { flexDirection: 'row', gap: 8 },
  comment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    minHeight: 85,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
    color: theme.colors.text,
    padding: 12,
    fontSize: 13,
  },
});
