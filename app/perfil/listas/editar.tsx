import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Action, Screen, EmptyState } from '../../../src/components';
import { useSession } from '../../../src/context/SessionContext';
import { useMutation, useQuery } from '../../../src/remote';
import {
  AnimePicker,
  AnimeRow,
  Field,
  LoadState,
  Notice,
  Toggle,
  ui,
} from '../../../src/remote-ui';
import type { Anime, AnimeList } from '../../../src/models';
export default function EditarLista() {
  const { id, animeId } = useLocalSearchParams<{ id?: string; animeId?: string }>();
  const result = useQuery<{ list: AnimeList }>(id ? '/lists/' + encodeURIComponent(id) : null);
  const anime = useQuery<{ anime: Anime }>(
    !id && animeId ? '/anime/' + encodeURIComponent(animeId) : null,
  );
  const { user } = useSession();
  return (
    <Screen title={id ? 'Editar lista' : 'Crear lista'} back>
      {result.data && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {(id && !result.data) || (animeId && !id && !anime.data) ? (
        <LoadState
          loading={result.loading || anime.loading}
          error={result.error || anime.error}
          reload={id ? result.reload : anime.reload}
        />
      ) : result.data && result.data.list.userId !== user?.id ? (
        <EmptyState
          title="No podés editar esta lista"
          text="Solo podés editar tus propias listas."
        />
      ) : (
        <Editor
          key={id ?? animeId ?? 'new'}
          list={result.data?.list}
          initialAnime={anime.data?.anime}
        />
      )}
    </Screen>
  );
}
function Editor({ list, initialAnime }: { list?: AnimeList; initialAnime?: Anime }) {
  const [title, setTitle] = useState(list?.title ?? '');
  const [description, setDescription] = useState(list?.description ?? '');
  const [ordered, setOrdered] = useState(list?.ordered ?? false);
  const [animes, setAnimes] = useState<Anime[]>(
    list?.items.map((item) => item.anime) ?? (initialAnime ? [initialAnime] : []),
  );
  const mutation = useMutation(),
    locked = mutation.pending || mutation.uncertain;
  function move(index: number, delta: number) {
    setAnimes((old) => {
      const next = [...old];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }
  async function save() {
    const result = await mutation.run<{ list: AnimeList }>(list ? '/lists/' + list.id : '/lists', {
      method: list ? 'PATCH' : 'POST',
      body: {
        title: title.trim(),
        description: description.trim(),
        ordered,
        animeIds: animes.map((a) => a.id),
      },
    });
    if (result) router.replace({ pathname: '/perfil/listas/[id]', params: { id: result.list.id } });
  }
  return (
    <>
      <Field label="Título" value={title} onChange={setTitle} maxLength={100} disabled={locked} />
      <Field
        label="Descripción"
        value={description}
        onChange={setDescription}
        multiline
        maxLength={2000}
        disabled={locked}
      />
      <Toggle
        label="Mostrar como top personal"
        value={ordered}
        onChange={setOrdered}
        disabled={locked}
      />
      <Text style={ui.title}>Animes ({animes.length}/100)</Text>
      {animes.map((anime, index) => (
        <AnimeRow key={anime.id} anime={anime}>
          <Text style={ui.muted}>Posición {index + 1}</Text>
          <View style={ui.wrap}>
            <Action
              label="Quitar"
              disabled={locked}
              onPress={() => setAnimes((items) => items.filter((a) => a.id !== anime.id))}
            />
            <Action
              label="Subir"
              disabled={locked || index === 0}
              onPress={() => move(index, -1)}
            />
            <Action
              label="Bajar"
              disabled={locked || index === animes.length - 1}
              onPress={() => move(index, 1)}
            />
          </View>
        </AnimeRow>
      ))}
      {!locked && animes.length < 100 && (
        <AnimePicker
          onSelect={(anime) =>
            setAnimes((items) => (items.some((a) => a.id === anime.id) ? items : [...items, anime]))
          }
        />
      )}
      <Notice error={mutation.error} />
      {mutation.uncertain && (
        <Text style={ui.muted}>Reintentá el envío pendiente con su contenido original.</Text>
      )}
      <Action
        label={
          mutation.pending
            ? 'Guardando…'
            : mutation.uncertain
              ? 'Reintentar envío'
              : 'Guardar lista'
        }
        primary
        disabled={mutation.pending || title.trim().length < 3 || !animes.length}
        onPress={() => void save()}
      />
    </>
  );
}
