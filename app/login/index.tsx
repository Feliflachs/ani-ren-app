import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buscarCuenta } from '../../src/login';
import { theme } from '../../src/theme';

export default function LoginScreen() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [altura, setAltura] = useState(560);
  const logoSize = Math.max(0, Math.min(220, altura - 400));

  const entrar = () => {
    if (!usuario.trim() || !contrasena) {
      setError('Completá el usuario y la contraseña.');
      return;
    }
    if (!buscarCuenta(usuario, contrasena)) {
      setError('El usuario o la contraseña son incorrectos.');
      return;
    }
    setError('');
    setContrasena('');
    router.replace('/inicio');
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View
          style={styles.content}
          onLayout={(event) => setAltura(event.nativeEvent.layout.height)}
        >
          <View style={styles.brand}>
            <Image
              source={require('../../assets/mascota-login.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
              accessibilityLabel="Símbolo de Ani-ren: flor con sombrero de paja"
            />
          </View>
          <View style={styles.form}>
            <Text accessibilityRole="header" style={styles.title}>
              Iniciá sesión
            </Text>
            <TextInput
              accessibilityLabel="Usuario"
              value={usuario}
              onChangeText={(value) => {
                setUsuario(value);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              placeholder="Tu usuario"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.input}
            />
            <TextInput
              accessibilityLabel="Contraseña"
              value={contrasena}
              onChangeText={(value) => {
                setContrasena(value);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              placeholder="Tu contraseña"
              placeholderTextColor={theme.colors.textSecondary}
              returnKeyType="go"
              onSubmitEditing={entrar}
              style={styles.input}
            />
            {!!error && (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={entrar}
              style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
            >
              <Text style={styles.submitText}>Iniciar sesión</Text>
            </Pressable>
          </View>
          <Text style={styles.register}>
            ¿No tenés cuenta? Registrate{' '}
            <Text
              accessibilityRole="link"
              accessibilityLabel="Crear cuenta"
              style={styles.link}
              onPress={() => router.push('/login/crear-cuenta')}
            >
              acá
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 13 },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: '600', textAlign: 'center' },
  brand: { alignItems: 'center', marginVertical: 17 },
  form: { gap: 20 },
  input: {
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 28,
    minHeight: 52,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { color: theme.colors.accent, fontSize: 13 },
  submit: {
    minHeight: 54,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  submitPressed: { opacity: 0.8 },
  submitText: { color: theme.colors.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
  register: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingVertical: 12,
  },
  link: { color: theme.colors.primarySoft, fontWeight: '600', textDecorationLine: 'underline' },
});
