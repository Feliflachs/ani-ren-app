import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Screen, Action } from '../../src/components';
import { useSession } from '../../src/context/SessionContext';
import { useQuery, useMutation } from '../../src/remote';
import { Field, LoadState, Notice, ui } from '../../src/remote-ui';
import type { User } from '../../src/models';
export default function EditarPerfil() {
  const { user } = useSession();
  const result = useQuery<{ user: User }>(user ? '/users/' + user.id : null);
  return (
    <Screen title="Editar perfil" back>
      {result.data && !!result.error && (
        <LoadState loading={false} error={result.error} reload={result.reload} />
      )}
      {result.data ? (
        <Editor key={result.data.user.id} user={result.data.user} />
      ) : (
        <LoadState {...result} />
      )}
    </Screen>
  );
}
function Editor({ user }: { user: User }) {
  const { updateUser } = useSession();
  const [name, setName] = useState(user.name),
    [bio, setBio] = useState(user.bio);
  const mutation = useMutation();
  async function save() {
    const result = await mutation.run<{ user: User }>('/me/profile', {
      method: 'PATCH',
      body: { name: name.trim(), bio: bio.trim() },
    });
    if (result) {
      updateUser(result.user);
      router.back();
    }
  }
  return (
    <>
      <Text style={ui.muted}>@{user.handle}</Text>
      <Field
        label="Nombre"
        value={name}
        onChange={setName}
        maxLength={60}
        disabled={mutation.pending}
      />
      <Field
        label="Biografía"
        value={bio}
        onChange={setBio}
        multiline
        maxLength={500}
        disabled={mutation.pending}
      />
      <Text style={ui.muted}>La personalización del avatar estará disponible más adelante.</Text>
      <Notice error={mutation.error} />
      <Action
        label="Guardar cambios"
        primary
        disabled={!name.trim() || mutation.pending}
        onPress={() => void save()}
      />
    </>
  );
}
