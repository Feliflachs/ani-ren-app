import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Action, Chips, StarRating, EmptyState } from '../../../src/components';
import { useSession } from '../../../src/context/SessionContext';
import { useMutation, useQuery } from '../../../src/remote';
import { AnimeRow, Field, LoadState, Notice, Toggle, ui } from '../../../src/remote-ui';
import type { Anime, Publication, Rating } from '../../../src/models';
export default function EscribirReview() {
  const params = useLocalSearchParams<{
    id?: string;
    reviewId?: string;
    animeId?: string;
    mode?: string;
  }>();
  const id = params.id ?? params.reviewId;
  const publication = useQuery<{ publication: Publication }>(
    id ? '/publications/' + encodeURIComponent(id) : null,
  );
  const anime = useQuery<{ anime: Anime }>(
    !id && params.animeId ? '/anime/' + encodeURIComponent(params.animeId) : null,
  );
  const existing = publication.data?.publication;
  const item = existing?.anime ?? anime.data?.anime;
  const { user } = useSession();
  if (id && existing && (existing.userId !== user?.id || existing.kind !== 'review'))
    return (
      <Screen title="Review" back>
        <EmptyState
          title="No podés editar esta publicación"
          text="Solo podés editar tus propias reviews."
        />
      </Screen>
    );
  return (
    <Screen
      title={id ? 'Editar review' : params.mode === 'rating' ? 'Nueva valoración' : 'Nueva review'}
      subtitle="Registrá este anime a tu manera."
      back
    >
      {item && !!(publication.error || anime.error) && (
        <LoadState
          loading={false}
          error={publication.error || anime.error}
          reload={id ? publication.reload : anime.reload}
        />
      )}
      {item ? (
        <ReviewForm
          key={id ?? item.id + params.mode}
          anime={item}
          existing={existing}
          ratingOnly={params.mode === 'rating'}
        />
      ) : (
        <LoadState
          loading={publication.loading || anime.loading}
          error={publication.error || anime.error}
          reload={id ? publication.reload : anime.reload}
          empty
        />
      )}
    </Screen>
  );
}
function ReviewForm({
  anime,
  existing,
  ratingOnly,
}: {
  anime: Anime;
  existing?: Publication;
  ratingOnly: boolean;
}) {
  const [kind, setKind] = useState(ratingOnly && !existing ? 'Solo valoración' : 'Review');
  const [rating, setRating] = useState<number | undefined>(existing?.rating ?? undefined);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [text, setText] = useState(existing?.text ?? '');
  const [date, setDate] = useState(existing?.watchedOn ?? '');
  const [rewatched, setRewatched] = useState(existing?.rewatched ?? false);
  const [spoiler, setSpoiler] = useState(existing?.spoiler ?? false);
  const mutation = useMutation();
  const locked = mutation.pending || mutation.uncertain;
  const isReview = kind === 'Review';
  const valid =
    rating !== undefined &&
    (!isReview || text.trim().length >= 10) &&
    (!date || /^\d{4}-\d{2}-\d{2}$/.test(date));
  async function save() {
    const body = {
      ...(!existing ? { animeId: anime.id } : {}),
      rating,
      watchedOn: date || null,
      rewatched,
      ...(isReview ? { title: title.trim() || null, text: text.trim(), spoiler } : {}),
    };
    const result = await mutation.run<{ publication?: Publication; rating?: Rating }>(
      existing ? '/reviews/' + existing.id : isReview ? '/reviews' : '/ratings',
      { method: existing ? 'PATCH' : 'POST', body },
    );
    if (result?.publication)
      router.replace({ pathname: '/inicio/review/[id]', params: { id: result.publication.id } });
    else if (result?.rating)
      router.replace({ pathname: '/explorar/anime/[id]', params: { id: anime.id } });
  }
  return (
    <>
      <AnimeRow anime={anime} />
      <View style={ui.card}>
        {!existing && !locked && (
          <Chips options={['Review', 'Solo valoración']} value={kind} onChange={setKind} />
        )}
        <Text style={ui.text}>Tu puntuación</Text>
        <StarRating
          value={rating}
          onChange={(value) => {
            if (!locked) setRating(value);
          }}
        />
        <Text style={ui.accent}>{rating ? rating + ' / 5' : 'Elegí una puntuación'}</Text>
        <Field
          label="Fecha de visto (opcional)"
          placeholder="AAAA-MM-DD"
          value={date}
          onChange={setDate}
          maxLength={10}
          disabled={locked}
        />
        <Toggle
          label="Lo volví a ver"
          value={rewatched}
          onChange={setRewatched}
          disabled={locked}
        />
      </View>
      {isReview && (
        <>
          <Field
            label="Título (opcional)"
            value={title}
            onChange={setTitle}
            maxLength={100}
            disabled={locked}
          />
          <Field
            label="Tu review"
            value={text}
            onChange={setText}
            maxLength={2000}
            multiline
            disabled={locked}
          />
          <Text style={ui.muted}>{text.length}/2000 · mínimo 10 caracteres</Text>
          <Toggle
            label="Contiene spoilers"
            value={spoiler}
            onChange={setSpoiler}
            disabled={locked}
          />
        </>
      )}
      <Notice error={mutation.error} />
      {mutation.uncertain && (
        <Text style={ui.muted}>
          Conservamos el envío. Reintentá para confirmar si se guardó, sin duplicarlo.
        </Text>
      )}
      <Action
        label={
          mutation.pending
            ? 'Guardando…'
            : mutation.uncertain
              ? 'Reintentar el mismo envío'
              : existing
                ? 'Guardar cambios'
                : isReview
                  ? 'Publicar review'
                  : 'Guardar valoración'
        }
        primary
        disabled={!valid || mutation.pending}
        onPress={() => void save()}
      />
    </>
  );
}
