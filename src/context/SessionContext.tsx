import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { buscarCuenta } from '../login';
import { findUser } from '../mock';
import cuentas from '../usuarios-demo.json';

const SESSION_KEY = 'ani-ren:sesion';

type SessionValue = {
  user: { id: string } | null;
  ready: boolean;
  signIn: (usuario: string, contrasena: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function restore() {
      // TODO BACKEND [SESION-RESTAURAR]: validar/renovar la sesión real; un ID local no autentica al usuario.
      try {
        const id = await AsyncStorage.getItem(SESSION_KEY);
        const savedUser = cuentas.some((cuenta) => cuenta.id === id)
          ? findUser(id ?? undefined)
          : undefined;
        if (id && !savedUser) await AsyncStorage.removeItem(SESSION_KEY);
        if (active) setUser(savedUser ? { id: savedUser.id } : null);
      } catch {
        // Si no se puede leer, la app permite volver a iniciar sesión.
        if (active) setUser(null);
      } finally {
        if (active) setReady(true);
      }
    }
    void restore();
    return () => {
      active = false;
    };
  }, []);

  async function signIn(usuario: string, contrasena: string) {
    // TODO BACKEND [SESION-ENTRAR]: autenticar con API, retirar cuentas JSON y acordar almacenamiento de credenciales de sesión.
    const account = buscarCuenta(usuario, contrasena);
    const profile = account ? findUser(account.id) : undefined;
    if (!profile) return false;
    // Solo se recuerda el ID de una cuenta de demostración, nunca la contraseña.
    await AsyncStorage.setItem(SESSION_KEY, profile.id);
    setUser({ id: profile.id });
    return true;
  }

  async function signOut() {
    // TODO BACKEND [SESION-SALIR]: cerrar/revocar la sesión según el contrato y limpiar datos privados/cache de la cuenta.
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <SessionContext.Provider value={{ user, ready, signIn, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession debe usarse dentro de SessionProvider');
  return session;
}
