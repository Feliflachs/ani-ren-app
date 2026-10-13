import { useState } from 'react';
import { Text, View } from 'react-native';
import { Screen, Chips } from '../../src/components';
import { usePage } from '../../src/remote';
import { PageEnd, UserRow, ui } from '../../src/remote-ui';
import type { Page, User, Rank } from '../../src/models';
type Entry = { user: User; watched: number; position: number; rank: Rank };
export default function Ranking() {
  const [tab, setTab] = useState('Global');
  const page = usePage<Entry>('/ranking?scope=' + (tab === 'Global' ? 'global' : 'friends'));
  const data = page.data as
    | (Page<Entry> & { me: { position: number; watched: number; rank: Rank } })
    | undefined;
  return (
    <Screen title="Ranking" back>
      <Chips options={['Global', 'Amigos']} value={tab} onChange={setTab} />
      {data && (
        <View style={ui.card}>
          <Text style={ui.accent}>Tu posición: #{data.me.position}</Text>
          <Text style={ui.text}>
            {data.me.watched} animes vistos · {data.me.rank.name}
          </Text>
          <Text style={ui.muted}>{data.total} participantes</Text>
        </View>
      )}
      {page.items.map((entry) => (
        <View key={entry.user.id} style={ui.card}>
          <Text style={ui.title}>
            #{entry.position} · {entry.watched} vistos
          </Text>
          <UserRow user={entry.user} />
          <Text style={ui.accent}>{entry.rank.name}</Text>
        </View>
      ))}
      <PageEnd page={page} />
    </Screen>
  );
}
