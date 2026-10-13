import { useLocalSearchParams } from 'expo-router';
import { PerfilView } from '../../../src/PerfilView';
export default function Usuario() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PerfilView key={id} id={id} publicProfile />;
}
