import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View, Image, Linking } from 'react-native';
import {
  Screen,
  Action,
  Section,
  PublicationCard,
  Dialog,
  StarRating,
  ListCard,
} from '../../../src/components';
import { useSession } from '../../../src/context/SessionContext';
import { useMutation, usePage, useQuery } from '../../../src/remote';
import { query } from '../../../src/api';
import { AnimeRow, Field, LoadState, Notice, PageEnd, Toggle, ui } from '../../../src/remote-ui';
import {
  dateLabel,
  type Anime,
  type Publication,
  type Rating,
  type Activity,
  type Favorite,
  type Extras,
  type AnimeList,
} from '../../../src/models';
export default function AnimeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Detail key={id} id={id} />;
}
function Detail({ id }: { id: string }) {
  const result = useQuery<{ anime: Anime }>('/anime/' + encodeURIComponent(id));
  const activity = usePage<Rating>('/me/anime/' + encodeURIComponent(id) + '/activity');
  const favorites = useQuery<{ items: Favorite[] }>('/me/favorites');
  const reviews = usePage<Publication>(query('/publications', { animeId: id, kind: 'review' }));
  const lists = usePage<AnimeList>(query('/lists', { animeId: id }));
  const mutation = useMutation();
  const [listPicker, setListPicker] = useState(false);
  const [editing, setEditing] = useState<Rating | null>(null);
  const flags = activity.data as Activity | undefined;
  const anime = result.data?.anime;
  const favoriteIds = favorites.data?.items.map((item) => item.anime.id) ?? [];
  const favorite = favoriteIds.includes(id);
  async function toggleFavorite() {
    await mutation.run('/me/favorites', {
      method: 'PUT',
      body: {
        animeIds: favorite ? favoriteIds.filter((value) => value !== id) : [...favoriteIds, id],
      },
    });
  }
  return (
    <Screen title={anime?.title ?? 'Anime'} back>
      {anime && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {anime ? (
        <>
          <AnimeRow anime={anime} />
          <View style={ui.card}>
            <Text style={ui.title}>
              {anime.statistics?.averageRating == null
                ? 'Sin puntuaciones'
                : '★ ' + anime.statistics.averageRating.toFixed(1) + ' / 5'}
            </Text>
            <Text style={ui.muted}>
              {anime.statistics?.ratingCount ?? 0} valoraciones ·{' '}
              {anime.statistics?.ratingUserCount ?? 0} personas ·{' '}
              {anime.statistics?.reviewCount ?? 0} reviews en Ani-Ren
            </Text>
            <Text style={ui.text}>{anime.synopsis || 'Sin sinopsis disponible.'}</Text>
            {anime.metadataStale && (
              <Text style={ui.muted}>Mostramos la última información disponible del catálogo.</Text>
            )}
          </View>
          <Section title="Tu actividad" />
          <LoadState
            loading={activity.loading && !flags}
            error={activity.error}
            reload={activity.retry}
          />
          {flags && (
            <View style={ui.card}>
              <Text style={ui.text}>
                Tu puntuación actual: {flags.currentRating?.rating ?? 'Sin valorar'}
              </Text>
              <View style={ui.wrap}>
                <Action
                  label={flags.watched ? 'Visto' : 'Marcar visto'}
                  icon="eye-outline"
                  active={flags.watched}
                  disabled={flags.watched || mutation.pending}
                  onPress={() =>
                    void mutation.run('/me/library/' + encodeURIComponent(id), {
                      method: 'PATCH',
                      body: { watched: true },
                    })
                  }
                />
                <Action
                  label={flags.watchlist ? 'Quitar de watchlist' : 'Watchlist'}
                  icon="bookmark-outline"
                  active={flags.watchlist}
                  disabled={mutation.pending}
                  onPress={() =>
                    void mutation.run('/me/library/' + encodeURIComponent(id), {
                      method: 'PATCH',
                      body: { watchlist: !flags.watchlist },
                    })
                  }
                />
                <Action
                  label={favorite ? 'Quitar favorito' : 'Favorito'}
                  icon="heart-outline"
                  active={favorite}
                  disabled={
                    mutation.pending ||
                    favorites.loading ||
                    !favorites.data ||
                    (!favorite && favoriteIds.length >= 100)
                  }
                  onPress={() => void toggleFavorite()}
                />
                <Action
                  label="Agregar a lista"
                  icon="list-outline"
                  onPress={() => setListPicker(true)}
                />
              </View>
            </View>
          )}
          <LoadState loading={false} error={favorites.error} reload={favorites.reload} />
          <Notice error={mutation.error} />
          <Action
            label="Valorar o escribir review"
            primary
            icon="create-outline"
            onPress={() =>
              router.push({ pathname: '/crear/review/escribir', params: { animeId: id } })
            }
          />
          <Section title="Dónde ver y personajes" />
          <AnimeExtras id={id} />
          <Section title="Tus valoraciones" />
          {activity.items.map((item) => (
            <View key={item.id} style={ui.card}>
              <Text style={ui.accent}>
                ★ {item.rating} {item.rewatched ? '· Vuelto a ver' : ''}
              </Text>
              <Text style={ui.muted}>
                {dateLabel(item.createdAt)}
                {item.watchedOn ? ' · Visto ' + item.watchedOn : ''}
              </Text>
              {item.updatedAt && <Text style={ui.muted}>Editado {dateLabel(item.updatedAt)}</Text>}
              <Action
                label={item.publicationId ? 'Ver review' : 'Editar valoración'}
                onPress={() =>
                  item.publicationId
                    ? router.push({
                        pathname: '/inicio/review/[id]',
                        params: { id: item.publicationId },
                      })
                    : setEditing(item)
                }
              />
            </View>
          ))}
          <PageEnd page={activity} />
          <Section title="Reviews de la comunidad" />
          {reviews.items.map((review) => (
            <PublicationCard key={review.id} review={review} />
          ))}
          <PageEnd page={reviews} />
          <Section title="Listas con este anime" />
          {lists.items.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
          <PageEnd page={lists} />
          <Dialog
            visible={listPicker}
            title="Agregar a una lista"
            onClose={() => setListPicker(false)}
          >
            {listPicker && <ListPicker animeId={id} onCreate={() => setListPicker(false)} />}
          </Dialog>
          <Dialog visible={!!editing} title="Editar valoración" onClose={() => setEditing(null)}>
            {editing && (
              <RatingEditor key={editing.id} rating={editing} onSaved={() => setEditing(null)} />
            )}
          </Dialog>
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
function RatingEditor({ rating, onSaved }: { rating: Rating; onSaved: () => void }) {
  const [value, setValue] = useState<number | undefined>(rating.rating);
  const [date, setDate] = useState(rating.watchedOn ?? '');
  const [rewatched, setRewatched] = useState(rating.rewatched);
  const mutation = useMutation();
  async function save() {
    if (
      await mutation.run('/ratings/' + rating.id, {
        method: 'PATCH',
        body: { rating: value, watchedOn: date || null, rewatched },
      })
    )
      onSaved();
  }
  return (
    <>
      <StarRating
        value={value}
        onChange={(v) => {
          if (!mutation.pending) setValue(v);
        }}
      />
      <Field
        label="Fecha de visto (AAAA-MM-DD)"
        value={date}
        onChange={setDate}
        disabled={mutation.pending}
      />
      <Toggle
        label="Lo volví a ver"
        value={rewatched}
        onChange={setRewatched}
        disabled={mutation.pending}
      />
      <Notice error={mutation.error} />
      <Action label="Guardar" disabled={!value || mutation.pending} onPress={() => void save()} />
    </>
  );
}
function ListPicker({ animeId, onCreate }: { animeId: string; onCreate: () => void }) {
  const { user } = useSession();
  const lists = usePage<AnimeList>(query('/lists', { userId: user?.id }));
  const mutation = useMutation();
  return (
    <>
      <Action
        label="Crear lista"
        onPress={() => {
          onCreate();
          router.push({ pathname: '/perfil/listas/editar', params: { animeId } });
        }}
      />
      {lists.items.map((list) => (
        <Action
          key={list.id}
          label={list.title + (list.animeIds.includes(animeId) ? ' · Agregado' : '')}
          disabled={
            mutation.pending || list.animeIds.includes(animeId) || list.animeIds.length >= 100
          }
          onPress={() =>
            void mutation.run('/lists/' + list.id, {
              method: 'PATCH',
              body: { animeIds: [...list.animeIds, animeId] },
            })
          }
        />
      ))}
      <Notice error={mutation.error} />
      <PageEnd page={lists} />
    </>
  );
}
function AnimeExtras({ id }: { id: string }) {
  const [page, setPage] = useState(1);
  const result = useQuery<{ extras: Extras }>(
    query('/anime/' + encodeURIComponent(id) + '/extras', { page }),
  );
  const [linkError, setLinkError] = useState('');
  const extras = result.data?.extras;
  return (
    <>
      <LoadState {...result} />
      {extras && (
        <View style={ui.card}>
          <Text style={ui.muted}>
            Consultá la disponibilidad en cada plataforma; puede variar según tu país.
          </Text>
          {extras.streamingLinks.length === 0 && (
            <Text style={ui.muted}>No hay enlaces disponibles en esta consulta.</Text>
          )}
          {extras.streamingLinks
            .filter((link) => link.url.startsWith('https://'))
            .map((link) => (
              <Action
                key={link.id}
                label={link.site}
                icon="open-outline"
                onPress={() =>
                  void Linking.openURL(link.url).catch(() =>
                    setLinkError('No pudimos abrir el enlace.'),
                  )
                }
              />
            ))}
          <Notice error={linkError} />
          <Text style={ui.title}>Personajes y voces japonesas</Text>
          {extras.characters.map((entry) => (
            <View key={entry.character.id} style={ui.row}>
              {entry.character.imageUrl && (
                <Image
                  source={{ uri: entry.character.imageUrl }}
                  style={{ width: 50, height: 64, borderRadius: 8 }}
                />
              )}
              <View style={ui.grow}>
                <Text style={ui.text}>{entry.character.name ?? 'Nombre no disponible'}</Text>
                <Text style={ui.muted}>
                  {entry.voiceActors.map((actor) => actor.name ?? 'Sin nombre').join(' · ') ||
                    'Voz sin datos'}
                </Text>
              </View>
            </View>
          ))}
          {!extras.characters.length && <Text style={ui.muted}>Sin personajes disponibles.</Text>}
          <View style={ui.wrap}>
            {page > 1 && (
              <Action
                label="Anteriores"
                disabled={result.loading}
                onPress={() => setPage((n) => n - 1)}
              />
            )}
            {extras.nextPage && (
              <Action
                label="Más personajes"
                disabled={result.loading}
                onPress={() => setPage(extras.nextPage!)}
              />
            )}
          </View>
        </View>
      )}
    </>
  );
}
