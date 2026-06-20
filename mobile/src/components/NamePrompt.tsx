// Pergunta o nome no primeiro acesso (quando ainda não há nome salvo). Espelha
// o onboarding do web; persiste via AppContext (AsyncStorage).
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useApp } from '@/context/AppContext';
import { brand } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

export function NamePrompt() {
  const { setUserName } = useApp();
  const [value, setValue] = useState('');

  const submit = () => {
    const name = value.trim();
    if (!name) return;
    setUserName(name);
  };

  return (
    <View style={styles.overlay}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.center}>
        <View style={styles.box}>
          <Text style={styles.title}>Bem-vindo aos Graded Readers!</Text>
          <Text style={styles.text}>Como podemos te chamar?</Text>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={setValue}
            placeholder="Seu nome"
            placeholderTextColor="#9fb6bd"
            maxLength={40}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={submit}
          />
          <Pressable
            style={[styles.button, !value.trim() && styles.buttonDisabled]}
            onPress={submit}
            disabled={!value.trim()}
          >
            <Text style={styles.buttonText}>Começar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18,70,83,0.55)',
    zIndex: 1000,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  box: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#277988',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: brand.titleTeal,
    textAlign: 'center',
    fontFamily: fonts.condensedBold,
  },
  text: {
    fontSize: 14,
    color: brand.muted,
    marginTop: 8,
    marginBottom: 18,
    textAlign: 'center',
    fontFamily: fonts.body,
  },
  input: {
    width: '100%',
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#cfdee1',
    borderRadius: 6,
    color: brand.ink,
    marginBottom: 16,
    fontFamily: fonts.body,
  },
  button: {
    width: '100%',
    backgroundColor: brand.teal,
    borderRadius: 6,
    paddingVertical: 13,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    textTransform: 'uppercase',
    fontFamily: fonts.condensedBold,
  },
});
