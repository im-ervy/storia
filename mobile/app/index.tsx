import { Redirect } from 'expo-router';

// A biblioteca é a tela inicial (espelha o redirect /library do app web).
export default function Index() {
  return <Redirect href="/library" />;
}
