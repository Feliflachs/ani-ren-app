import { useActivities } from '../../src/context/AppState';
import { useAnimeSearch, QueryFooter } from '../../src/remote-ui';
import { useQuery } from '../../src/context/RemoteContext';
import { useProfiles } from '../../src/context/ProfilesContext';
import { useCurrentUser } from '../../src/useCurrentUser';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Action, Avatar, Dialog, Screen, Section } from '../../src/components';
import { findAnime } from '../../src/data';
import { theme } from '../../src/theme';
import { mediaUrl } from '../../src/api/media';
type CatalogAvatar = { id: string; name: string; collection: string; imageUrl: string };

type ProfileDialog = 'avatar' | 'favorites' | 'saved' | 'cancel' | null;

export default function EditarPerfilScreen() {
  const currentUser = useCurrentUser();

  // Borrador local: solo Guardar modifica los datos compartidos.
  const [name, setName] = useState(currentUser.name);
  useQuery(`/users/${currentUser.id}`);
  const search = useAnimeSearch('');
  const { setFavorites: saveFavorites } = useActivities();
  const handle = currentUser.handle;
  const { updateProfile } = useProfiles();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [bio, setBio] = useState(currentUser.bio);
  const [favorites, setFavorites] = useState(currentUser.favorites);
  const [avatar, setAvatar] = useState(currentUser.image);
  const [avatarId, setAvatarId] = useState<string | null | undefined>(undefined);
  const [dialog, setDialog] = useState<ProfileDialog>(null);
  const avatarQuery = useQuery(dialog === 'avatar' ? '/avatars' : undefined);
  const catalog: CatalogAvatar[] = avatarQuery.data?.items ?? [];
  const [avatarNotice, setAvatarNotice] = useState('');
  const [attempted, setAttempted] = useState(false);
  const nameError = name.trim().length === 0;
  const canSave = !nameError;
  const preview = {
    ...currentUser,
    name: name.trim() || currentUser.name,
    handle: handle.trim(),
    bio,
    image: avatar,
    favorites,
  };
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));
  const save = async () => {
    setAttempted(true);
    if (!canSave || saving) return;
    setSaveError('');
    setSaving(true);
    try {
      await updateProfile(currentUser.id, {
        name: name.trim(),
        bio: bio.trim(),
        image: avatar,
        avatarId,
      });
      await saveFavorites(currentUser.id, favorites);
      setName(name.trim());
      setDialog('saved');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'No pudimos guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };
  const toggleFavorite = (id: string) => {
    setFavorites((previous) => {
      if (previous.includes(id)) return previous.filter((item) => item !== id);
      if (previous.length >= 4) return previous;
      return [...previous, id];
    });
  };
  const moveUp = (index: number) => {
    if (index === 0) return;
    const reordered = [...favorites];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    setFavorites(reordered);
  };

  return (
    <Screen title="Editar perfil" subtitle="Tu identidad y tus cuatro historias favoritas." back>
      <View style={styles.avatarPreview}>
        <Avatar user={preview} size={92} onPress={() => setDialog('avatar')} />
        <Text style={styles.name}>{preview.name}</Text>
        <Text style={styles.meta}>@{preview.handle || 'usuario'}</Text>
        <Action label="Cambiar avatar" icon="camera-outline" onPress={() => setDialog('avatar')} />
      </View>
      {avatarNotice.length > 0 && (
        <Text accessibilityLiveRegion="polite" style={styles.notice}>
          {avatarNotice}
        </Text>
      )}
      <Text style={styles.label}>Nombre</Text>
      <TextInput
        accessibilityLabel="Nombre"
        style={[styles.input, attempted && nameError && styles.invalid]}
        value={name}
        onChangeText={setName}
        placeholder="Tu nombre"
        placeholderTextColor={theme.colors.textSecondary}
        maxLength={44}
      />
      {attempted && nameError && <Text style={styles.error}>Ingresá un nombre.</Text>}
      <Text style={styles.label}>Usuario</Text>
      <TextInput
        accessibilityLabel="Usuario"
        style={styles.input}
        value={handle}
        editable={false}
        placeholder="usuario"
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={24}
      />
      <Text style={styles.meta}>El nombre de usuario no se puede cambiar.</Text>
      <Text style={styles.label}>Bio</Text>
      <TextInput
        accessibilityLabel="Biografía"
        style={[styles.input, styles.multiline]}
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={160}
        placeholder="Contá qué historias te gustan…"
        placeholderTextColor={theme.colors.textSecondary}
        textAlignVertical="top"
      />
      <Text style={styles.counter}>{bio.length}/160</Text>
      <Section
        title="Top de favoritos"
        action="Elegir anime"
        onPress={() => setDialog('favorites')}
      />
      <Text style={styles.meta}>
        Seleccioná hasta cuatro anime. La posición determina su orden.
      </Text>
      {favorites.map((id, index) => {
        const item = findAnime(id);
        return (
          <View key={id} style={styles.favoriteRow}>
            <Text style={styles.position}>#{index + 1}</Text>
            <Pressable
              style={styles.flex}
              onPress={() => router.push({ pathname: '/explorar/anime/[id]', params: { id } })}
              accessibilityRole="button"
            >
              <Text style={styles.label}>{item?.title}</Text>
            </Pressable>
            <Pressable
              onPress={() => moveUp(index)}
              disabled={index === 0}
              style={[styles.iconButton, index === 0 && styles.disabled]}
              accessibilityRole="button"
              accessibilityLabel={`Subir ${item?.title} una posición`}
            >
              <Ionicons name="arrow-up" size={18} color={theme.colors.primarySoft} />
            </Pressable>
            <Pressable
              onPress={() => toggleFavorite(id)}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${item?.title} de favoritos`}
              style={styles.iconButton}
            >
              <Ionicons name="close-outline" size={22} color={theme.colors.textSecondary} />
            </Pressable>
          </View>
        );
      })}
      {favorites.length === 0 && (
        <Text style={styles.notice}>
          Sin favoritos destacados. Podés elegirlos con el selector.
        </Text>
      )}
      <Action
        label="Personalizar título y sufijo Aura"
        icon="sparkles-outline"
        onPress={() => router.push('/aura/rangos')}
      />
      {!!saveError && (
        <Text accessibilityRole="alert" style={styles.error}>
          {saveError}
        </Text>
      )}
      <Action
        label={saving ? 'Guardando…' : 'Guardar cambios'}
        primary
        icon="checkmark-outline"
        onPress={save}
      />
      <Action label="Cancelar" onPress={() => setDialog('cancel')} />
      <Text style={styles.meta}>El nombre y la bio se guardan en tu cuenta.</Text>
      <Dialog
        visible={dialog === 'avatar'}
        title="Elegí tu avatar"
        text="Elegí un personaje. Se guardará cuando guardes el perfil."
        onClose={() => setDialog(null)}
      >
        <Action
          label="Usar mascota de Ani-Ren"
          icon="happy-outline"
          onPress={() => {
            setAvatar(require('../../assets/mascota.png'));
            setAvatarId(null);
            setAvatarNotice('Avatar elegido. Guardá el perfil para confirmar.');
            setDialog(null);
          }}
        />
        <QueryFooter query={avatarQuery} />
        {!avatarQuery.loading && !avatarQuery.error && catalog.length === 0 && (
          <Text style={styles.meta}>Todavía no hay avatares disponibles.</Text>
        )}
        {[...new Set(catalog.map((item) => item.collection))].map((collection) => (
          <View key={collection} style={{ gap: 12 }}>
            <Text style={styles.label}>{collection}</Text>
            <ScrollView horizontal contentContainerStyle={{ gap: 12 }}>
              {catalog
                .filter((item) => item.collection === collection)
                .map((item) => {
                  const selected =
                    (avatarId === undefined ? currentUser.avatarId : avatarId) === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityLabel={`Elegir a ${item.name} de ${collection}`}
                      accessibilityState={{ selected }}
                      onPress={() => {
                        setAvatar({ uri: mediaUrl(item.imageUrl) });
                        setAvatarId(item.id);
                        setAvatarNotice(
                          `${item.name} seleccionado. Guardá el perfil para confirmar.`,
                        );
                        setDialog(null);
                      }}
                      style={{ width: 78, alignItems: 'center', gap: 6, paddingVertical: 6 }}
                    >
                      <View
                        style={{
                          padding: 3,
                          borderRadius: 38,
                          borderWidth: 2,
                          borderColor: selected ? theme.colors.primary : 'transparent',
                        }}
                      >
                        <Avatar
                          user={{
                            ...currentUser,
                            name: item.name,
                            image: { uri: mediaUrl(item.imageUrl) },
                          }}
                          size={62}
                        />
                      </View>
                      <Text style={styles.meta}>
                        {selected ? '✓ ' : ''}
                        {item.name}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </View>
        ))}
      </Dialog>
      <Dialog
        visible={dialog === 'favorites'}
        title="Elegí tus favoritos"
        text={`${favorites.length}/4 seleccionados. Tocá uno para agregarlo o quitarlo.`}
        onClose={() => setDialog(null)}
      >
        <ScrollView style={styles.pickerList}>
          {search.animes.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleFavorite(item.id)}
              style={styles.pickerRow}
              accessibilityRole="button"
              accessibilityState={{ selected: favorites.includes(item.id) }}
            >
              <Text style={styles.body}>{item.title}</Text>
              <Ionicons
                name={favorites.includes(item.id) ? 'checkmark-circle' : 'ellipse-outline'}
                color={theme.colors.primarySoft}
                size={22}
              />
            </Pressable>
          ))}
        </ScrollView>
        <QueryFooter query={search} />
      </Dialog>
      <Dialog
        visible={dialog === 'saved'}
        title="Cambios guardados"
        text="Tu perfil y tus favoritos se actualizaron en tu cuenta."
        onClose={() => setDialog(null)}
      />
      <Dialog
        visible={dialog === 'cancel'}
        title="¿Descartar el borrador?"
        text="Podés seguir editando o volver al perfil."
        onClose={() => setDialog(null)}
      >
        <Action label="Descartar y volver" onPress={goBack} />
      </Dialog>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarPreview: { alignItems: 'center', gap: 9, paddingVertical: 12 },
  name: { color: theme.colors.text, fontSize: 20, fontWeight: '600' },
  label: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  meta: { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 18 },
  input: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    color: theme.colors.text,
    fontSize: 14,
  },
  multiline: { minHeight: 110 },
  invalid: { borderColor: theme.colors.accent },
  error: { color: theme.colors.accentSoft, fontSize: 12 },
  counter: { color: theme.colors.textSecondary, fontSize: 11, textAlign: 'right' },
  notice: {
    color: theme.colors.primarySoft,
    fontSize: 12,
    lineHeight: 19,
    padding: 12,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: 10,
  },
  favoriteRow: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  position: { color: theme.colors.primarySoft, fontWeight: '600', fontSize: 13 },
  flex: { flex: 1 },
  iconButton: { padding: 8 },
  disabled: { opacity: 0.3 },
  pickerList: { maxHeight: 300 },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  body: { color: theme.colors.text, fontSize: 13 },
});
