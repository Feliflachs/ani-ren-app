import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { AnimeCard, Avatar, Screen, SearchBar, Section } from '../../src/components';
import { anime, currentFriendIds, currentUser, findAnime, findUser, reviews } from '../../src/mock';
import { theme } from '../../src/theme';

export default function Inicio() {
  const [query, setQuery] = useState('');
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(windowWidth, theme.layout.maxWidth);
  const cardWidth = Math.max(96, Math.min(124, (width - 52) / 3));
  // TODO BACKEND [HOME-REVIEWS]: consultar reviews de amigos y populares; hoy se usan datos compartidos.
  const friendReviews = reviews
    .filter((review) => currentFriendIds.includes(review.userId) && review.animeId)
    .slice(0, 2);
  const popular = anime
    .slice()
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 3);
  const rated = anime
    .slice()
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);
  const search = () => router.push({ pathname: '/busqueda', params: { q: query } });

  return (
    <Screen title={`Hola, ${currentUser.name} 👋`} subtitle="¿Qué anime vas a descubrir hoy?">
      <SearchBar value={query} onChangeText={setQuery} onSubmit={search} />
      <Section
        title="Últimas reviews de amigos"
        action="Ver"
        onPress={() => router.push('/social')}
      />
      {friendReviews.map((review) => {
        const author = findUser(review.userId);
        const related = findAnime(review.animeId);
        if (!author || !related) return null;
        return (
          <View key={review.id} style={styles.review}>
            <Avatar
              user={author}
              size={44}
              onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: author.id } })}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Leer review de ${author.name} sobre ${related.title}`}
              onPress={() => router.push({ pathname: '/review/[id]', params: { id: review.id } })}
              style={styles.reviewContent}
            >
              <View style={styles.reviewBody}>
                <Text style={styles.username}>{author.name}</Text>
                <Text style={styles.anime}>{related.title}</Text>
                <Text numberOfLines={1} style={styles.excerpt}>
                  {review.text}
                </Text>
              </View>
              <View style={styles.reviewSide}>
                <Text style={styles.rating}>★ {review.rating?.toFixed(1)}</Text>
                <Ionicons name="chatbubbles-outline" size={22} color={theme.colors.primarySoft} />
              </View>
            </Pressable>
          </View>
        );
      })}
      <Section
        title="Populares esta semana"
        action="Ver"
        onPress={() => router.push({ pathname: '/tops', params: { criterion: 'Más populares' } })}
      />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.row}
      >
        {popular.map((item) => (
          <AnimeCard key={item.id} item={item} width={cardWidth} />
        ))}
      </ScrollView>
      <Section
        title="Más rateados últimamente"
        action="Ver"
        onPress={() => router.push({ pathname: '/tops', params: { criterion: 'Mejor puntuados' } })}
      />
      <ScrollView
        horizontal
        style={{ flexGrow: 0 }}
        showsHorizontalScrollIndicator={Platform.OS === 'web'}
        contentContainerStyle={styles.row}
      >
        {rated.map((item) => (
          <AnimeCard key={item.id} item={item} width={cardWidth} landscape />
        ))}
      </ScrollView>
      <Section title="Tu actividad rápida" />
      <View style={styles.quickRow}>
        {(['Watchlist', 'Vistos', 'Likes'] as const).map((label) => (
          <Pressable
            key={label}
            onPress={() => router.push({ pathname: '/biblioteca', params: { tab: label } })}
            accessibilityRole="button"
            style={styles.quick}
          >
            <Ionicons
              name={
                label === 'Watchlist'
                  ? 'bookmark-outline'
                  : label === 'Vistos'
                    ? 'eye-outline'
                    : 'heart'
              }
              size={22}
              color={label === 'Likes' ? theme.colors.accentSoft : theme.colors.primarySoft}
            />
            <Text style={[styles.quickText, label === 'Likes' && styles.coral]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reviewContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  row: { gap: 10 },
  review: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    minHeight: 88,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
  },
  reviewBody: { flex: 1, minWidth: 0, gap: 5 },
  username: { color: theme.colors.primarySoft, fontSize: 12, fontWeight: '600' },
  anime: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  excerpt: { color: theme.colors.textSecondary, fontSize: 12 },
  reviewSide: { alignItems: 'flex-end', gap: 14 },
  rating: { color: theme.colors.primarySoft, fontSize: 16, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: 8 },
  quick: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  quickText: { color: theme.colors.primarySoft, fontSize: 12 },
  coral: { color: theme.colors.accentSoft },
});
