import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  currentUser,
  findAnime,
  findUser,
  type Anime,
  type AnimeList,
  type Review,
  type User,
} from './mock';
import { theme } from './theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const rankLooks: Record<string, { icon: IconName; color: string }> = {
  Novato: { icon: 'compass-outline', color: '#6EE7B7' },
  Aprendiz: { icon: 'school-outline', color: '#60A5FA' },
  Experto: { icon: 'flame-outline', color: theme.colors.accentSoft },
  Maestro: { icon: 'diamond-outline', color: '#FBBF24' },
  Leyenda: { icon: 'trophy-outline', color: '#C084FC' },
};

export function RankInsignia({ rank, size = 34 }: { rank: string; size?: number }) {
  const look = rankLooks[rank] ?? rankLooks.Novato;
  return (
    <View
      accessibilityLabel={`Insignia ${rank}`}
      style={[
        styles.rankInsignia,
        { width: size, height: size, borderRadius: size / 2, borderColor: look.color },
      ]}
    >
      <Ionicons name={look.icon} size={size * 0.55} color={look.color} />
    </View>
  );
}

export function StarRating({
  value,
  onChange,
  size = 34,
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  size?: number;
}) {
  const selected = value ?? 0;
  const hitSize = size + 10;
  return (
    <View style={styles.starRating} accessibilityRole="adjustable">
      {Array.from({ length: 5 }, (_, index) => {
        const fullValue = index + 1;
        const halfValue = index + 0.5;
        const icon =
          selected >= fullValue ? 'star' : selected >= halfValue ? 'star-half' : 'star-outline';
        return (
          <View key={fullValue} style={[styles.starHit, { width: hitSize, height: hitSize }]}>
            <Ionicons name={icon} size={size} color={theme.colors.primarySoft} />
            <View style={styles.starTouchAreas}>
              {[halfValue, fullValue].map((next) => (
                <Pressable
                  key={next}
                  accessibilityRole="button"
                  accessibilityLabel={`Puntuar ${next} de 5`}
                  onPress={() => onChange(selected === next ? undefined : next)}
                  style={styles.starHalf}
                />
              ))}
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Elementos que se repiten de verdad en las pantallas: contenedor, búsqueda, cards y controles.
export function Avatar({
  user = currentUser,
  size = 42,
  onPress,
}: {
  user?: User;
  size?: number;
  onPress?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`Perfil de ${user.name}`}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    >
      {failed ? (
        <Text style={styles.initial}>{user.name.slice(0, 1)}</Text>
      ) : (
        <Image
          source={user.image}
          onError={() => setFailed(true)}
          style={{ width: size - 4, height: size - 4, borderRadius: size / 2 }}
        />
      )}
    </Pressable>
  );
}

export function Screen({
  title,
  subtitle,
  back = false,
  children,
  actions,
  avatar = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  children: ReactNode;
  actions?: ReactNode;
  avatar?: boolean;
}) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SafeAreaView
      style={styles.screen}
      edges={back ? ['top', 'bottom', 'left', 'right'] : ['top', 'left', 'right']}
    >
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            {back && (
              <Pressable
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                hitSlop={10}
                style={styles.back}
              >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
              </Pressable>
            )}
            <View style={styles.heading}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
            {actions ??
              (avatar && !back ? <Avatar onPress={() => router.push('/perfil')} /> : null)}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function SearchBar({
  value,
  onChangeText,
  onSubmit,
  placeholder = 'Buscar anime, review o usuario',
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search-outline" size={21} color={theme.colors.textSecondary} />
      <TextInput
        accessibilityLabel={placeholder}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType="search"
        autoCorrect={false}
        style={styles.searchInput}
      />
      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Limpiar búsqueda"
          hitSlop={8}
        >
          <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
        </Pressable>
      )}
      {onSubmit && (
        <Pressable
          onPress={onSubmit}
          accessibilityRole="button"
          accessibilityLabel="Buscar"
          hitSlop={8}
        >
          <Ionicons name="arrow-forward" size={18} color={theme.colors.primarySoft} />
        </Pressable>
      )}
    </View>
  );
}

export function Section({
  title,
  action = 'Ver todos',
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onPress && (
        <Pressable onPress={onPress} accessibilityRole="button" style={styles.sectionAction}>
          <Text style={styles.link}>{action}</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.primarySoft} />
        </Pressable>
      )}
    </View>
  );
}

export function AnimeCard({
  item,
  width = 112,
  landscape = false,
  rank,
}: {
  item: Anime;
  width?: number;
  landscape?: boolean;
  rank?: number;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/anime/[id]', params: { id: item.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${item.title}`}
      style={[styles.animeCard, { width }]}
    >
      <View
        style={{
          height: landscape ? width * 0.58 : width * 1.38,
          backgroundColor: theme.colors.surfaceLight,
        }}
      >
        {failed ? (
          <View style={styles.imageFallback}>
            <Ionicons name="image-outline" size={28} color={theme.colors.primarySoft} />
            <Text style={styles.meta}>Imagen no disponible</Text>
          </View>
        ) : (
          <Image source={item.image} style={styles.poster} onError={() => setFailed(true)} />
        )}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={11} color={theme.colors.primarySoft} />
          <Text style={styles.badgeText}>{item.rating.toFixed(1)}</Text>
        </View>
        {rank !== undefined && (
          <View style={styles.rankBadge}>
            <Text style={styles.badgeText}>#{rank}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardCaption}>
        <Text numberOfLines={1} style={styles.animeTitle}>
          {item.title}
        </Text>
        {landscape && <Text style={styles.smallRating}>★ {item.rating.toFixed(1)}</Text>}
      </View>
    </Pressable>
  );
}

export function Action({
  label,
  onPress,
  icon,
  active = false,
  primary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  active?: boolean;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      aria-selected={active}
      accessibilityState={{ disabled, selected: active }}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.action,
        (active || primary) && styles.actionActive,
        disabled && styles.disabled,
      ]}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={17}
          color={primary || active ? theme.colors.text : theme.colors.primarySoft}
        />
      )}
      <Text style={[styles.actionText, (active || primary) && styles.actionTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Chips({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ScrollView
      horizontal
      style={{ flexGrow: 0 }}
      showsHorizontalScrollIndicator={Platform.OS === 'web'}
      contentContainerStyle={styles.chips}
    >
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          accessibilityRole="button"
          aria-selected={value === option}
          accessibilityState={{ selected: value === option }}
          style={[styles.chip, value === option && styles.chipActive]}
        >
          <Text style={[styles.chipText, value === option && styles.chipTextActive]}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function EmptyState({
  title = 'No encontramos resultados',
  text = 'Probá con otra búsqueda o cambiá los filtros.',
  action,
  onPress,
  loading = false,
}: {
  title?: string;
  text?: string;
  action?: string;
  onPress?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.empty}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : (
        <Ionicons name="sparkles-outline" size={32} color={theme.colors.primarySoft} />
      )}
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      {action && onPress && <Action label={action} onPress={onPress} />}
    </View>
  );
}

export function Dialog({
  visible,
  title,
  text,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  text?: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  if (!visible) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.modalBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Cerrar diálogo"
          onPress={onClose}
        />
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.dialogContent}
          >
            <Text style={styles.emptyTitle}>{title}</Text>
            {text && <Text style={styles.dialogText}>{text}</Text>}
            {children}
            <Action label="Cerrar" onPress={onClose} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function Progress({
  value,
  total,
  label,
}: {
  value: number;
  total: number;
  label?: string;
}) {
  const percent = Math.min(100, Math.max(0, total > 0 ? (value / total) * 100 : 0));
  return (
    <View style={styles.progressWrap}>
      {label && (
        <Text style={styles.meta}>
          {label} · {value} / {total}
        </Text>
      )}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: value }}
        style={styles.track}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

export function ListCard({ list }: { list: AnimeList }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/lista/[id]', params: { id: list.id } })}
      style={styles.review}
    >
      <Text style={styles.reviewAuthor}>{list.title}</Text>
      <Text style={styles.meta}>
        Por {findUser(list.userId)?.name} · {list.animeIds.length} animes ·{' '}
        {list.ordered ? 'Top personal' : 'Colección'}
      </Text>
      <Text style={styles.reviewText}>{list.description}</Text>
      <Text style={styles.meta}>♡ {list.likes}</Text>
    </Pressable>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const author = findUser(review.userId);
  const item = findAnime(review.animeId);
  const openReview = () => router.push({ pathname: '/review/[id]', params: { id: review.id } });

  return (
    <View style={styles.review}>
      <View style={styles.reviewHeader}>
        <Avatar
          user={author}
          size={34}
          onPress={() => router.push({ pathname: '/usuario/[id]', params: { id: review.userId } })}
        />
        <Pressable style={styles.heading} accessibilityRole="button" onPress={openReview}>
          <Text style={styles.reviewAuthor}>{author?.name ?? 'Usuario'}</Text>
          <Text style={styles.meta}>
            {item?.title ?? 'Publicación'} · {review.time}
          </Text>
        </Pressable>
        {review.rating !== undefined && (
          <Text style={styles.reviewRating}>★ {review.rating.toFixed(1)}</Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Leer review de ${author?.name ?? 'Usuario'}`}
        onPress={openReview}
        style={styles.reviewContent}
      >
        <Text numberOfLines={3} style={styles.reviewText}>
          {review.spoiler
            ? 'Esta review contiene spoilers. Abrila para elegir si querés leerla.'
            : review.text}
        </Text>
        <Text style={styles.meta}>
          ♡ {review.likes} · {review.comments} comentarios
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  review: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 13,
    gap: 10,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  reviewAuthor: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  reviewContent: { gap: 10 },
  reviewText: { color: theme.colors.text, fontSize: 13, lineHeight: 20 },
  reviewRating: { color: theme.colors.primarySoft, fontSize: 13, fontWeight: '600' },
  dialogContent: { padding: 22, gap: 16 },
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  heading: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '700', letterSpacing: -0.6 },
  subtitle: { color: theme.colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 4 },
  back: { paddingVertical: 8 },
  avatar: {
    backgroundColor: theme.colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: { color: theme.colors.primarySoft, fontSize: 22, fontWeight: '700' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    minHeight: 44,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    color: theme.colors.text,
    fontSize: 13,
    paddingVertical: 12,
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sectionTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '600', flex: 1 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 6 },
  link: { color: theme.colors.primarySoft, fontSize: 12 },
  animeCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  poster: { width: '100%', height: '100%' },
  ratingBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 5,
    padding: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    padding: 4,
    borderRadius: 4,
    backgroundColor: theme.colors.background,
  },
  badgeText: { color: theme.colors.text, fontWeight: '600', fontSize: 11 },
  cardCaption: { padding: 7, flexDirection: 'row', alignItems: 'center', gap: 3 },
  animeTitle: { color: theme.colors.text, fontSize: 12, fontWeight: '500', flex: 1 },
  smallRating: { color: theme.colors.primarySoft, fontSize: 10 },
  action: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  actionActive: { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primary },
  actionText: {
    color: theme.colors.primarySoft,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'center',
  },
  actionTextActive: { color: theme.colors.text },
  disabled: { opacity: 0.4 },
  chips: { gap: 7, paddingVertical: 4 },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  chipActive: { backgroundColor: theme.colors.primaryDark, borderColor: theme.colors.primary },
  chipText: { color: theme.colors.textSecondary, fontSize: 12 },
  chipTextActive: { color: theme.colors.text },
  empty: {
    gap: 12,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  emptyTitle: { color: theme.colors.text, fontWeight: '600', fontSize: 18 },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 22,
  },
  dialog: {
    width: '100%',
    maxWidth: theme.layout.maxWidth - 44,
    alignSelf: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  dialogText: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 21 },
  progressWrap: { gap: 7 },
  track: {
    height: 5,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: theme.colors.primary, borderRadius: 4 },
  meta: { color: theme.colors.textSecondary, fontSize: 11 },
  imageFallback: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
  rankInsignia: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    backgroundColor: theme.colors.surfaceLight,
  },
  starRating: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  starHit: { alignItems: 'center', justifyContent: 'center' },
  starTouchAreas: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    flexDirection: 'row',
  },
  starHalf: { flex: 1 },
});
