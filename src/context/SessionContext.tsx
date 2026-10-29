import {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { createConfiguredApi } from '../api/config';
import { createSession } from '../api/session';
import { tokenStorage } from '../api/tokenStorage';

function useSessionState() {
  const [session] = useState(() => createSession(tokenStorage, createConfiguredApi));
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  useEffect(() => {
    void session.restore();
  }, [session]);
  return { ...session, ...state };
}
const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  return (
    <SessionContext.Provider value={session}>
      <Fragment key={session.generation}>{children}</Fragment>
    </SessionContext.Provider>
  );
}
export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession debe usarse dentro de SessionProvider');
  return session;
}
