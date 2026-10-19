import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Action, Avatar, PublicationContent } from './components';
import { Notice, ui } from './remote-ui';
import { useMutation } from './remote';
import type { DiscoveryItem } from './models';
import { theme } from './theme';

export function DiscoveryCard({ item }: { item: DiscoveryItem }) {
  const { anime } = item;
  const mutation = useMutation();
  const open = () => router.push({ pathname: '/explorar/anime/[id]', params: { id: anime.id } });
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={'Ver ' + anime.title}
        onPress={open}
        style={ui.row}
      >
        {anime.imageUrl ? (
          <Image source={{ uri: anime.imageUrl }} style={styles.poster} />
        ) : (
          <View style={styles.poster} />
        )}
        <View style={[ui.grow, { gap: 8 }]}>
          <Text style={styles.eyebrow}>TU PRÓXIMO ANIME</Text>
          <Text style={ui.title}>{anime.title}</Text>
          <Text style={ui.muted}>{anime.genres.map((genre) => genre.name).join(' · ')}</Text>
          <Text style={styles.score}>
            {anime.statistics?.averageRating == null
              ? 'Sin puntuaciones'
              : `★ ${anime.statistics.averageRating.toFixed(1)} / 5`}
          </Text>
          <Text style={ui.muted}>{anime.statistics?.ratingUserCount ?? 0} personas en Ani-Ren</Text>
        </View>
      </Pressable>
      <View style={ui.wrap}>
        <Action label="Ver anime" primary onPress={open} />
        <Action
          label={item.watchlist ? 'En tu Watchlist' : 'Agregar a Watchlist'}
          icon="bookmark-outline"
          active={item.watchlist}
          disabled={mutation.pending}
          onPress={() =>
            void mutation.run('/me/library/' + encodeURIComponent(anime.id), {
              method: 'PATCH',
              body: { watchlist: !item.watchlist },
            })
          }
        />
      </View>
      <Notice error={mutation.error} />
      <Text style={styles.eyebrow}>LO QUE DICE LA COMUNIDAD</Text>
      {item.reviews.map((review) => (
        <View key={review.id} style={styles.opinion}>
          <View style={ui.row}>
            <Avatar
              user={review.author}
              size={30}
              onPress={() =>
                router.push({ pathname: '/perfil/usuario/[id]', params: { id: review.userId } })
              }
            />
            <Text style={[ui.accent, ui.grow]}>{review.author.name}</Text>
            <Text style={ui.accent}>★ {review.rating}</Text>
          </View>
          <PublicationContent review={review} numberOfLines={3} />
          <Action
            label="Leer review"
            onPress={() =>
              router.push({ pathname: '/inicio/review/[id]', params: { id: review.id } })
            }
          />
        </View>
      ))}
      {!item.reviews.length && (
        <Text style={ui.muted}>Todavía no hay reviews. Podés conocer más en su ficha.</Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  poster: { width: 106, height: 156, borderRadius: 14, backgroundColor: theme.colors.surfaceLight },
  eyebrow: { color: theme.colors.primarySoft, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  score: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  opinion: { gap: 10, borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 14 },
});
