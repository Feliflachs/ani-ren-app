import { Text, TextInput, View, Image, Pressable, StyleSheet, Switch } from 'react-native';
import { router } from 'expo-router';
import { Action, Avatar, EmptyState, SearchBar } from './components';
import { theme } from './theme';
import { useState, type ReactNode } from 'react';
import { useDebounce, usePage } from './remote';
import { query } from './api';
import type { Anime, User } from './models';
export const ui = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flex: 1, minWidth: 0 },
  title: { color: theme.colors.text, fontSize: 19, fontWeight: '700' },
  text: { color: theme.colors.textSoft, fontSize: 14, lineHeight: 22 },
  muted: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
  accent: { color: theme.colors.primarySoft, fontWeight: '600' },
  error: { color: theme.colors.accent, fontSize: 13, lineHeight: 20 },
  input: {
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 46,
  },
  poster: { width: 64, height: 92, borderRadius: 10, backgroundColor: theme.colors.surfaceLight },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
export function Notice({ error }: { error: string }) {
  return error ? (
    <Text accessibilityRole="alert" style={ui.error}>
      {error}
    </Text>
  ) : null;
}
export function LoadState({
  loading,
  error,
  reload,
  empty = false,
}: {
  loading: boolean;
  error: string;
  reload: () => void;
  empty?: boolean;
}) {
  if (error)
    return (
      <EmptyState
        title="No pudimos cargar los datos"
        text={error}
        action="Reintentar"
        onPress={reload}
      />
    );
  if (loading) return <EmptyState title="Cargando…" text="Consultando Ani-Ren." loading />;
  if (empty)
    return (
      <EmptyState
        title="Todavía no hay resultados"
        text="Lo que agregues o encuentres aparecerá acá."
      />
    );
  return null;
}
export function PageEnd({
  page,
}: {
  page: {
    loading: boolean;
    error: string;
    items: unknown[];
    next: string | number | null;
    retry: () => void;
    more: () => void;
  };
}) {
  return (
    <>
      <LoadState
        loading={page.loading}
        error={page.error}
        reload={page.retry}
        empty={!page.items.length}
      />
      {page.next !== null && !page.error && (
        <Action label="Cargar más" disabled={page.loading} onPress={page.more} />
      )}
    </>
  );
}
export function Field({
  label,
  value,
  onChange,
  multiline = false,
  maxLength,
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={ui.text}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        maxLength={maxLength}
        editable={!disabled}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        style={[ui.input, multiline && { minHeight: 120, textAlignVertical: 'top' }]}
      />
    </View>
  );
}
export function Toggle({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View style={ui.row}>
      <Text style={[ui.text, ui.grow]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        trackColor={{ true: theme.colors.primary }}
      />
    </View>
  );
}
export function AnimeRow({
  anime,
  onPress,
  children,
}: {
  anime: Anime;
  onPress?: () => void;
  children?: ReactNode;
}) {
  return (
    <View style={ui.card}>
      <Pressable
        style={ui.row}
        accessibilityRole="button"
        onPress={
          onPress ??
          (() => router.push({ pathname: '/explorar/anime/[id]', params: { id: anime.id } }))
        }
      >
        {anime.imageUrl ? (
          <Image source={{ uri: anime.imageUrl }} style={ui.poster} />
        ) : (
          <View style={ui.poster} />
        )}
        <View style={ui.grow}>
          <Text style={ui.title}>{anime.title}</Text>
          <Text style={ui.muted}>
            {anime.year ?? 'Año sin datos'} · {anime.episodes ?? '—'} episodios
          </Text>
          <Text style={ui.muted}>{anime.genres.map((g) => g.name).join(' · ')}</Text>
        </View>
      </Pressable>
      {children}
    </View>
  );
}
export function UserRow({ user }: { user: User }) {
  return (
    <Pressable
      style={[ui.card, ui.row]}
      onPress={() => router.push({ pathname: '/perfil/usuario/[id]', params: { id: user.id } })}
    >
      <Avatar user={user} />
      <View style={ui.grow}>
        <Text style={ui.accent}>{user.name}</Text>
        <Text style={ui.muted}>@{user.handle}</Text>
        <Text style={ui.text}>{user.bio}</Text>
      </View>
    </Pressable>
  );
}
export function AnimePicker({
  onSelect,
  disabled = false,
}: {
  onSelect: (anime: Anime) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');
  const q = useDebounce(value.trim());
  const page = usePage<Anime>(q.length >= 2 ? query('/anime', { q }) : null, true);
  return (
    <View style={{ gap: 12 }}>
      <SearchBar
        value={value}
        onChangeText={setValue}
        placeholder="Buscar anime (mínimo 2 letras)"
      />
      {q.length >= 2 && (
        <>
          {page.items.map((anime) => (
            <AnimeRow
              key={anime.id}
              anime={anime}
              onPress={() => {
                if (!disabled) onSelect(anime);
              }}
            />
          ))}
          <PageEnd page={page} />
        </>
      )}
    </View>
  );
}
export function Pending({ text }: { text: string }) {
  return <EmptyState title="Próximamente" text={text} />;
}
