import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import {
  Action,
  AnimeCard,
  Avatar,
  Chips,
  ListCard,
  Progress,
  PublicationCard,
  RankInsignia,
  Screen,
  Section,
} from './components';
import { useSession } from './context/SessionContext';
import { useMutation, usePage, useQuery } from './remote';
import { query, errorMessage } from './api';
import { LoadState, Notice, PageEnd, ui } from './remote-ui';
import type { Profile, Publication, AnimeList } from './models';
export function PerfilView({ id, publicProfile = false }: { id: string; publicProfile?: boolean }) {
  const result = useQuery<{ user: Profile }>('/users/' + encodeURIComponent(id));
  const profile = result.data?.user;
  const [tab, setTab] = useState('Reviews');
  const publications = usePage<Publication>(
    tab === 'Listas'
      ? null
      : query('/publications', { userId: id, kind: tab === 'Reviews' ? 'review' : 'post' }),
  );
  const lists = usePage<AnimeList>(tab === 'Listas' ? query('/lists', { userId: id }) : null);
  const mutation = useMutation();
  const { signOut } = useSession();
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState('');
  async function logout() {
    setClosing(true);
    setError('');
    try {
      await signOut();
    } catch (failure) {
      setError(errorMessage(failure));
      setClosing(false);
    }
  }
  const connections = (tab: string) =>
    router.push({ pathname: '/perfil/comunidad', params: { id, tab } });
  return (
    <Screen title="Perfil" back={publicProfile} avatar={false}>
      {profile && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {profile ? (
        <>
          <View style={ui.row}>
            <Avatar user={profile} size={82} />
            <View style={ui.grow}>
              <Text style={ui.title}>{profile.name}</Text>
              <Text style={ui.muted}>@{profile.handle}</Text>
              <Text style={ui.text}>{profile.bio}</Text>
            </View>
          </View>
          <View style={ui.wrap}>
            {profile.isMe ? (
              <>
                <Action label="Editar perfil" onPress={() => router.push('/perfil/editar')} />
                <Action label="Mi biblioteca" onPress={() => router.push('/perfil/biblioteca')} />
                <Action
                  label={closing ? 'Cerrando…' : 'Cerrar sesión'}
                  disabled={closing}
                  onPress={() => void logout()}
                />
              </>
            ) : (
              <Action
                label={profile.isFollowing ? 'Dejar de seguir' : 'Seguir'}
                active={profile.isFollowing}
                disabled={mutation.pending}
                onPress={() =>
                  void mutation.run('/me/following/' + id, {
                    method: profile.isFollowing ? 'DELETE' : 'PUT',
                  })
                }
              />
            )}
          </View>
          {profile.isFriend && <Text style={ui.accent}>Son amigos</Text>}
          <Notice error={error || mutation.error} />
          <View style={ui.card}>
            <View style={ui.row}>
              <RankInsignia rank={profile.rank.name} size={46} />
              <Text style={ui.title}>{profile.rank.name}</Text>
            </View>
            <Progress
              value={profile.statistics.watched}
              total={profile.rank.nextThreshold ?? profile.rank.threshold}
              label="Animes vistos"
            />
          </View>
          <View style={ui.wrap}>
            <Text style={ui.text}>
              {profile.statistics.watched} vistos · {profile.statistics.reviews} reviews ·{' '}
              {profile.statistics.posts} posteos
            </Text>
            {(['Seguidores', 'Siguiendo', 'Amigos'] as const).map((label, index) => (
              <Action
                key={label}
                label={
                  label +
                  ' ' +
                  [
                    profile.statistics.followers,
                    profile.statistics.following,
                    profile.statistics.friends,
                  ][index]
                }
                onPress={() => connections(label)}
              />
            ))}
          </View>
          <Section title="Favoritos" />
          <View style={ui.grid}>
            {profile.favorites.map((item) => (
              <AnimeCard key={item.anime.id} item={item.anime} width={100} />
            ))}
          </View>
          {!profile.favorites.length && <Text style={ui.muted}>Todavía no hay favoritos.</Text>}
          <Chips
            options={['Reviews', 'Posteos', 'Listas']}
            value={tab}
            onChange={setTab}
            variant="underline"
          />
          {tab === 'Listas' ? (
            <>
              {lists.items.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
              <PageEnd page={lists} />
            </>
          ) : (
            <>
              {publications.items.map((review) => (
                <PublicationCard key={review.id} review={review} />
              ))}
              <PageEnd page={publications} />
            </>
          )}
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
