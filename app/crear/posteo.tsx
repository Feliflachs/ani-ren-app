import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Action, EmptyState } from '../../src/components';
import { useSession } from '../../src/context/SessionContext';
import { useMutation, useQuery } from '../../src/remote';
import { AnimePicker, Field, LoadState, Notice, Toggle, ui } from '../../src/remote-ui';
import type { Anime, Publication } from '../../src/models';
export default function Posteo() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const result = useQuery<{ publication: Publication }>(
    id ? '/publications/' + encodeURIComponent(id) : null,
  );
  const existing = result.data?.publication;
  const { user } = useSession();
  return (
    <Screen title={id ? 'Editar posteo' : 'Crear posteo'} back>
      {existing && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {id && !existing ? (
        <LoadState {...result} empty />
      ) : existing && (existing.userId !== user?.id || existing.kind !== 'post') ? (
        <EmptyState
          title="No podés editar este posteo"
          text="Solo podés editar tus propias publicaciones."
        />
      ) : (
        <PostForm key={id ?? 'new'} existing={existing} />
      )}
    </Screen>
  );
}
function PostForm({ existing }: { existing?: Publication }) {
  const [text, setText] = useState(existing?.text ?? '');
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const [animes, setAnimes] = useState<Anime[]>(existing?.mentionedAnime ?? []);
  const mutation = useMutation();
  const locked = mutation.pending || mutation.uncertain;
  async function save() {
    const result = await mutation.run<{ publication: Publication }>(
      existing ? '/posts/' + existing.id : '/posts',
      {
        method: existing ? 'PATCH' : 'POST',
        body: { text: text.trim(), spoiler, animeIds: animes.map((a) => a.id) },
      },
    );
    if (result)
      router.replace({ pathname: '/inicio/review/[id]', params: { id: result.publication.id } });
  }
  return (
    <>
      <Field
        label="¿Qué querés compartir?"
        value={text}
        onChange={setText}
        multiline
        maxLength={2000}
        disabled={locked}
      />
      <Text style={ui.muted}>{text.length}/2000 · mínimo 3 caracteres</Text>
      <Toggle label="Contiene spoilers" value={spoiler} onChange={setSpoiler} disabled={locked} />
      <Text style={ui.title}>Animes mencionados ({animes.length}/10)</Text>
      <View style={ui.wrap}>
        {animes.map((anime) => (
          <Action
            key={anime.id}
            label={anime.title + ' ×'}
            disabled={locked}
            onPress={() => setAnimes((items) => items.filter((a) => a.id !== anime.id))}
          />
        ))}
      </View>
      {!locked && animes.length < 10 && (
        <AnimePicker
          onSelect={(anime) =>
            setAnimes((items) => (items.some((a) => a.id === anime.id) ? items : [...items, anime]))
          }
        />
      )}
      <Notice error={mutation.error} />
      {mutation.uncertain && (
        <Text style={ui.muted}>
          Tu envío quedó pendiente de confirmación. Reintentá con el mismo contenido.
        </Text>
      )}
      <Action
        label={
          mutation.pending
            ? 'Publicando…'
            : mutation.uncertain
              ? 'Reintentar envío'
              : existing
                ? 'Guardar cambios'
                : 'Publicar'
        }
        primary
        disabled={mutation.pending || text.trim().length < 3}
        onPress={() => void save()}
      />
    </>
  );
}
