import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  OpenSans_400Regular,
  OpenSans_600SemiBold,
  OpenSans_700Bold,
} from '@expo-google-fonts/open-sans';
import {
  BarlowCondensed_300Light,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { Barlow_400Regular, Barlow_700Bold } from '@expo-google-fonts/barlow';
import { ActivityIndicator, View } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { NamePrompt } from '@/components/NamePrompt';
import { brand } from '@/theme/colors';

function SplashGate() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.bg }}>
      <ActivityIndicator size="large" color={brand.teal} />
    </View>
  );
}

function RootStack() {
  const { ready, userName } = useApp();
  if (!ready) {
    return <SplashGate />;
  }
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: brand.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="library" />
        <Stack.Screen name="reading/[id]/index" />
        <Stack.Screen name="reading/[id]/congratulation" />
      </Stack>
      {!userName && <NamePrompt />}
    </>
  );
}

export default function RootLayout() {
  // Carrega as fontes do app (Open Sans / Barlow / Barlow Condensed). Não
  // renderiza nada além do splash até estarem prontas — combinado com o gate
  // `ready` do AppProvider em RootStack.
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_600SemiBold,
    OpenSans_700Bold,
    BarlowCondensed_300Light,
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    Barlow_400Regular,
    Barlow_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {fontsLoaded ? (
          <AppProvider>
            <RootStack />
          </AppProvider>
        ) : (
          <SplashGate />
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
