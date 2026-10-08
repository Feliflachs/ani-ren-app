import { Redirect } from 'expo-router';
import { useSession } from '../src/context/SessionContext';

export default function EntradaScreen() {
  const { user } = useSession();
  return <Redirect href={user ? '/inicio' : '/login'} />;
}
