import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Action, Avatar, Dialog, Screen, Section } from '../src/components';
import { anime, currentUser, findAnime, users } from '../src/mock';
import { theme } from '../src/theme';

type ProfileDialog = 'avatar' | 'favorites' | 'saved' | 'cancel' | null;

export default function EditarPerfilScreen() {
  // TODO BACKEND [PERFIL-EDITAR-CARGAR]: obtener los campos editables y favoritos de currentUser.id; hoy se inicia con el perfil mock.
  const [name, setName] = useState(currentUser.name);
  const [handle, setHandle] = useState(currentUser.handle);
  const [bio, setBio] = useState(currentUser.bio);
  const [favorites, setFavorites] = useState(currentUser.favorites);
  const [avatar, setAvatar] = useState(currentUser.image);
  const [dialog, setDialog] = useState<ProfileDialog>(null);
  const [avatarNotice, setAvatarNotice] = useState('');
  const [attempted, setAttempted] = useState(false);
  const nameError = name.trim().length === 0;
  const handleError = handle.trim().length === 0 || /[^a-zA-Z0-9_.]/.test(handle.trim());
  const canSave = !nameError && !handleError;
  const preview = {
    ...currentUser,
    name: name.trim() || currentUser.name,
    handle: handle.trim(),
    bio,
    image: avatar,
    favorites,
  };
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/perfil'));
  const save = () => {
    setAttempted(true);
    if (!canSave) return;
    // TODO BACKEND [PERFIL-EDITAR-GUARDAR]: enviar currentUser.id, nombre, handle, bio y favoritos ordenados; hoy solo se confirma el borrador local.
    // TODO BACKEND [AVATAR-SUBIR]: subir la imagen seleccionada y guardar su referencia en el perfil después de la respuesta del servidor.
    setName(name.trim());
    setHandle(handle.trim());
    setDialog('saved');
  };
  const chooseImage = (source: 'Cámara' | 'Galería') => {
    // TODO DISPOSITIVO [AVATAR-SELECCIONAR]: solicitar permiso contextual de cámara/galería y obtener la imagen real; hoy elige una imagen mock.
    setAvatar(users[source === 'Cámara' ? 1 : 3].image);
    setAvatarNotice(
      `${source}: vista previa de ejemplo. No se abrió el dispositivo ni se pidió permiso.`,
    );
    setDialog(null);
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
        style={[styles.input, attempted && handleError && styles.invalid]}
        value={handle}
        onChangeText={setHandle}
        placeholder="usuario"
        placeholderTextColor={theme.colors.textSecondary}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={24}
      />
      {handleError && (
        <Text style={styles.error}>Usá letras, números, punto o guion bajo, sin espacios.</Text>
      )}
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
              onPress={() => router.push({ pathname: '/anime/[id]', params: { id } })}
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
      <Action label="Guardar cambios" primary icon="checkmark-outline" onPress={save} />
      <Action label="Cancelar" onPress={() => setDialog('cancel')} />
      <Text style={styles.meta}>
        El borrador y su confirmación son locales; otras pantallas conservan el perfil de ejemplo.
      </Text>
      <Dialog
        visible={dialog === 'avatar'}
        title="Cambiar avatar"
        text="Selector de demostración"
        onClose={() => setDialog(null)}
      >
        <Action
          label="Tomar foto de ejemplo"
          icon="camera-outline"
          onPress={() => chooseImage('Cámara')}
        />
        <Action
          label="Elegir de la galería de ejemplo"
          icon="images-outline"
          onPress={() => chooseImage('Galería')}
        />
        <Action
          label="Simular permiso no disponible"
          onPress={() => {
            setDialog(null);
            setAvatarNotice('Permiso no disponible (simulado). El avatar anterior se conserva.');
          }}
        />
        <Action
          label="Cancelar selección"
          onPress={() => {
            setDialog(null);
            setAvatarNotice('Selección cancelada. Conservás la imagen anterior.');
          }}
        />
      </Dialog>
      <Dialog
        visible={dialog === 'favorites'}
        title="Elegí tus favoritos"
        text={`${favorites.length}/4 seleccionados. Tocá uno para agregarlo o quitarlo.`}
        onClose={() => setDialog(null)}
      >
        <ScrollView style={styles.pickerList}>
          {anime.map((item) => (
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
      </Dialog>
      <Dialog
        visible={dialog === 'saved'}
        title="Cambios preparados"
        text="Simulación: guardaste el borrador local. El perfil no se actualizó en un servidor."
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
