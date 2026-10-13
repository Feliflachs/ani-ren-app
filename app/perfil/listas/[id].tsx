import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Screen, Action } from '../../../src/components';
import { useSession } from '../../../src/context/SessionContext';
import { useQuery, useMutation } from '../../../src/remote';
import { AnimeRow, LoadState, Notice, UserRow, ui } from '../../../src/remote-ui';
import { dateLabel, type AnimeList } from '../../../src/models';
export default function Lista() {
  const { id } = useLocalSearchParams<{ id: string }>(),
    { user } = useSession();
  const result = useQuery<{ list: AnimeList }>('/lists/' + encodeURIComponent(id));
  const mutation = useMutation(),
    list = result.data?.list;
  return (
    <Screen title={list?.title ?? 'Lista'} back>
      {list && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {list ? (
        <>
          <UserRow user={list.author} />
          <Text style={ui.text}>{list.description}</Text>
          <Text style={ui.muted}>
            {list.itemCount} animes · {dateLabel(list.createdAt)}
          </Text>
          {list.updatedAt && <Text style={ui.muted}>Editada {dateLabel(list.updatedAt)}</Text>}
          <Action
            label={(list.likedByMe ? 'Quitar like' : 'Me gusta') + ' · ' + list.likeCount}
            icon={list.likedByMe ? 'heart' : 'heart-outline'}
            active={list.likedByMe}
            disabled={mutation.pending}
            onPress={() =>
              void mutation.run('/lists/' + id + '/like', {
                method: list.likedByMe ? 'DELETE' : 'PUT',
              })
            }
          />
          <Notice error={mutation.error} />
          {list.userId === user?.id && (
            <Action
              label="Editar lista"
              onPress={() => router.push({ pathname: '/perfil/listas/editar', params: { id } })}
            />
          )}
          {list.items.map((item) => (
            <AnimeRow key={item.anime.id} anime={item.anime}>
              {list.ordered && <Text style={ui.accent}>#{item.position + 1}</Text>}
            </AnimeRow>
          ))}
        </>
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
