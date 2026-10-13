import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';
import { Screen, Chips } from '../../src/components';
import { useSession } from '../../src/context/SessionContext';
import { usePage } from '../../src/remote';
import { PageEnd, UserRow, ui } from '../../src/remote-ui';
import type { User } from '../../src/models';
const tabs: Record<string, string> = {
  Seguidores: 'followers',
  Siguiendo: 'following',
  Amigos: 'friends',
};
export default function Comunidad() {
  const params = useLocalSearchParams<{ id?: string; tab?: string }>();
  const { user } = useSession();
  const [tab, setTab] = useState(params.tab && tabs[params.tab] ? params.tab : 'Seguidores');
  const page = usePage<User>(
    '/users/' + encodeURIComponent(params.id ?? user!.id) + '/' + tabs[tab],
  );
  return (
    <Screen title="Comunidad" back>
      <Chips options={Object.keys(tabs)} value={tab} onChange={setTab} />
      {page.data?.total !== undefined && (
        <Text style={ui.muted}>
          {page.data.total} {tab.toLowerCase()}
        </Text>
      )}
      {page.items.map((user) => (
        <UserRow key={user.id} user={user} />
      ))}
      <PageEnd page={page} />
    </Screen>
  );
}
