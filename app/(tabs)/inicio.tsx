import { usePage } from '../../src/context/RemoteContext';
import { QueryFooter } from '../../src/remote-ui';
import { adaptAnime, adaptPublication } from '../../src/api/remote';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { PublicationCard, Chips, EmptyState, Screen } from '../../src/components';
import { theme } from '../../src/theme';

export default function Inicio() {
  const [filter, setFilter] = useState('Para ti');

  const discovering = filter === 'Descubrir';
  const page = usePage(
    discovering ? '/discover' : '/feed',
    discovering
      ? {}
      : {
          type: filter === 'Para ti' ? 'for-you' : 'following',
        },
  );
  const feed = discovering ? [] : page.items.map(adaptPublication);

  return (
    <Screen
      onRefresh={page.reload}
      refreshing={page.loading && page.items.length === 0}
      title={
        <>
          Ani-Ren{' '}
          <Image
            source={require('../../assets/mascota-transparente.png')}
            style={{ width: 28, height: 28 }}
            resizeMode="contain"
            accessibilityLabel="Símbolo de Ani-ren"
          />
        </>
      }
      avatar={false}
      headerCentered
    >
      <Chips
        options={['Para ti', 'Siguiendo', 'Descubrir']}
        value={filter}
        onChange={setFilter}
        variant="underline"
      />
      {discovering &&
        page.items.map((row) => {
          const anime = adaptAnime(row.anime);
          return (
            <View key={row.id} style={{ gap: 4, paddingTop: 20, paddingBottom: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Ver ${anime.title}`}
                onPress={() =>
                  router.push({ pathname: '/explorar/anime/[id]', params: { id: anime.id } })
                }
                style={{
                  flexDirection: 'row',
                  gap: 14,
                  alignItems: 'center',
                  backgroundColor: theme.colors.surface,
                  borderRadius: 12,
                  padding: 14,
                  borderLeftWidth: 3,
                  borderLeftColor: theme.colors.primary,
                }}
              >
                <Image source={anime.image} style={{ width: 72, height: 102, borderRadius: 8 }} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 17 }}>
                    {anime.title}
                  </Text>
                  <Text style={{ color: theme.colors.textSecondary }}>
                    {anime.genres.join(' · ')}
                  </Text>
                  <Text style={{ color: theme.colors.primarySoft }}>
                    {row.anime.statistics.ratingUserCount > 0
                      ? `★ ${row.anime.statistics.averageRating.toFixed(1)} · ${row.anime.statistics.ratingUserCount} ${row.anime.statistics.ratingUserCount === 1 ? 'persona' : 'personas'}`
                      : 'Una historia por descubrir'}
                  </Text>
                  <Text style={{ color: theme.colors.primarySoft, fontSize: 12 }}>Ver anime</Text>
                </View>
              </Pressable>
              {row.reviews.map((review: import('../../src/api/remote').Wire) => (
                <PublicationCard
                  key={review.id}
                  review={adaptPublication(review)}
                  contextAnimeId={anime.id}
                />
              ))}
            </View>
          );
        })}
      {feed.map((item) => (
        <PublicationCard key={item.id} review={item} feed />
      ))}
      {page.items.length === 0 && !page.loading && !page.error && (
        <EmptyState
          text={
            discovering
              ? 'Todavía no hay animes nuevos para descubrir.'
              : filter === 'Para ti'
                ? 'Todavía no hay publicaciones de otras personas que no sigas. Probá otro feed.'
                : 'Todavía no hay publicaciones acá. Seguí a otras personas o probá otro feed.'
          }
        />
      )}
      <QueryFooter query={page} />
    </Screen>
  );
}
