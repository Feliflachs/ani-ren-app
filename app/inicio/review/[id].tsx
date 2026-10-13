import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Action, PublicationCard, Section } from '../../../src/components';
import { useSession } from '../../../src/context/SessionContext';
import { useMutation, usePage, useQuery } from '../../../src/remote';
import { Field, LoadState, Notice, PageEnd, UserRow, ui } from '../../../src/remote-ui';
import { dateLabel, type Publication, type Comment } from '../../../src/models';
export default function PublicationDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Detail key={id} id={id} />;
}
function Detail({ id }: { id: string }) {
  const { user } = useSession();
  const result = useQuery<{ publication: Publication }>('/publications/' + encodeURIComponent(id));
  const comments = usePage<Comment>('/publications/' + encodeURIComponent(id) + '/comments');
  const [text, setText] = useState('');
  const mutation = useMutation();
  const publication = result.data?.publication;
  async function comment() {
    const saved = await mutation.run<{ comment: Comment }>('/publications/' + id + '/comments', {
      method: 'POST',
      body: { text: text.trim() },
    });
    if (saved) setText('');
  }
  return (
    <Screen title={publication?.kind === 'post' ? 'Posteo' : 'Review'} back>
      {publication && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {publication ? (
        <>
          <PublicationCard review={publication} feed />
          {publication.userId === user?.id && (
            <Action
              label="Editar"
              icon="create-outline"
              onPress={() =>
                router.push({
                  pathname:
                    publication.kind === 'review' ? '/crear/review/escribir' : '/crear/posteo',
                  params: { id },
                })
              }
            />
          )}
        </>
      ) : (
        <LoadState {...result} />
      )}
      <Section
        title={
          'Comentarios' +
          (comments.data?.total !== undefined ? ' (' + comments.data.total + ')' : '')
        }
      />
      <Field
        label="Escribí un comentario"
        value={text}
        onChange={setText}
        multiline
        maxLength={2000}
        disabled={mutation.pending || mutation.uncertain}
      />
      <Notice error={mutation.error} />
      <Action
        label={
          mutation.pending ? 'Enviando…' : mutation.uncertain ? 'Reintentar comentario' : 'Comentar'
        }
        disabled={!text.trim() || mutation.pending || !publication}
        primary
        onPress={() => void comment()}
      />
      {comments.items.map((item) => (
        <View key={item.id} style={ui.card}>
          <UserRow user={item.author} />
          <Text style={ui.text}>{item.text}</Text>
          <Text style={ui.muted}>{dateLabel(item.createdAt)}</Text>
        </View>
      ))}
      <PageEnd page={comments} />
    </Screen>
  );
}
