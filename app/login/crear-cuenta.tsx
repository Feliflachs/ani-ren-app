import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Screen } from '../../src/components';
import { validarRegistro } from '../../src/login';
import { theme } from '../../src/theme';

export default function CrearCuentaScreen() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [validado, setValidado] = useState(false);

  useEffect(() => {
    if (!validado) return;
    const timer = setTimeout(() => router.replace('/login'), 3000);
    return () => clearTimeout(timer);
  }, [validado]);

  const registrar = () => {
    if (validado) return;
    const message = validarRegistro(usuario, contrasena, confirmacion);
    setError(message);
    if (message) return;
    // TODO BACKEND [REGISTRO]: crear la cuenta mediante API antes de confirmar; disponibilidad de usuario y contraseña se validan también en servidor.
    // Solo valida: no guarda una cuenta ni modifica el JSON de usuarios.
    setContrasena('');
    setConfirmacion('');
    setValidado(true);
  };

  return (
    <Screen title="Crear cuenta" headerCentered back>
      {validado ? (
        <View style={styles.form}>
          <Text accessibilityRole="alert" style={styles.label}>
            Datos válidos. Registro simulado correctamente; no se creó una cuenta real.
          </Text>
          <Text style={styles.help}>
            En 3 segundos volvés a iniciar sesión con las cuentas de prueba.
          </Text>
        </View>
      ) : (
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Usuario</Text>
            <TextInput
              accessibilityLabel="Usuario"
              value={usuario}
              onChangeText={(value) => {
                setUsuario(value);
                setError('');
              }}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              style={styles.input}
            />
            <Text style={styles.help}>Entre 3 y 20 caracteres: letras, números o guion bajo.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Contraseña</Text>
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
              autoComplete="new-password"
              style={styles.input}
            />
            <Text style={styles.help}>Al menos 8 caracteres, una letra y un número.</Text>
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Repetir contraseña</Text>
            <TextInput
              accessibilityLabel="Repetir contraseña"
              value={confirmacion}
              onChangeText={(value) => {
                setConfirmacion(value);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="go"
              onSubmitEditing={registrar}
              style={styles.input}
            />
          </View>
          {!!error && (
            <Text accessibilityRole="alert" style={styles.error}>
              {error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={registrar}
            style={({ pressed }) => [styles.submit, pressed && styles.submitPressed]}
          >
            <Text style={styles.submitText}>Crear cuenta</Text>
          </Pressable>
          <Text style={styles.signIn}>
            ¿Ya tenés cuenta?{' '}
            <Text
              accessibilityRole="link"
              style={styles.link}
              onPress={() => router.replace('/login')}
            >
              Iniciá sesión
            </Text>
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { gap: 20, paddingHorizontal: 12, paddingTop: 8 },
  field: { gap: 6 },
  label: { color: theme.colors.text, fontSize: 14, fontWeight: '500', paddingHorizontal: 4 },
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
  help: { color: theme.colors.textSecondary, fontSize: 12, lineHeight: 18 },
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
  signIn: { color: theme.colors.textSecondary, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  link: { color: theme.colors.primarySoft, fontWeight: '600', textDecorationLine: 'underline' },
});
