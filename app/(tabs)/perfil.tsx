import { PerfilView } from '../../src/PerfilView';
import { currentUser } from '../../src/mock';

export default function PerfilScreen() {
  return <PerfilView user={currentUser} />;
}
