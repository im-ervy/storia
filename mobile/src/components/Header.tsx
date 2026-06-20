// Header logado (réplica do app-root-loggedin-template): logo Graded Readers,
// contador de palavras únicas lidas e o painel do usuário com o seletor de
// idioma (que no web fica no dropdown do perfil).
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { LANGS } from '@/lib/prefs';
import { brandingAuthor } from '@/lib/branding';
import { brand } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

function thousandSeparated(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

interface Props {
  uniqueWordsNumber: number;
  level: number;
  userProgress: number;
  publishedReadersCount: number;
}

export function Header({ uniqueWordsNumber, level, userProgress, publishedReadersCount }: Props) {
  const { lang, setLang, userName } = useApp();
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.bar}>
      <View style={styles.logoWrap}>
        <Text style={styles.logo}>
          <Text style={styles.graded}>Graded</Text> <Text style={styles.readers}>Readers</Text>
        </Text>
        <Text style={styles.byMv}>by {brandingAuthor(lang, level)}</Text>
      </View>

      <View style={styles.right}>
        <View style={styles.counter}>
          <Text style={styles.count}>{thousandSeparated(uniqueWordsNumber)}</Text>
          <Text style={styles.counterText}>Palavras{'\n'}únicas lidas</Text>
        </View>
        <Pressable style={styles.avatar} onPress={() => setOpen(true)} hitSlop={6}>
          <Ionicons name="person" size={18} color="#fff" />
        </Pressable>
      </View>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.menu} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.greeting}>
              Olá, <Text style={styles.userName}>{userName}</Text>
            </Text>
            <Text style={styles.progress}>
              Progresso nível {level}:{' '}
              <Text style={styles.progressNum}>
                {userProgress}/{publishedReadersCount}
              </Text>
            </Text>

            <View style={styles.separator} />
            <Text style={styles.langLabel}>Idioma dos Readers</Text>
            {LANGS.map((l) => {
              const active = l.code === lang;
              return (
                <Pressable
                  key={l.code}
                  style={styles.langOption}
                  onPress={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.langText, active && styles.langActive]}>{l.label}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={brand.teal} />}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6eef0',
  },
  logoWrap: { justifyContent: 'center' },
  logo: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3, fontFamily: fonts.condensedBold },
  graded: { color: '#d92e37', fontFamily: fonts.condensedBold },
  readers: { color: '#37bdd2', fontFamily: fonts.condensedBold },
  byMv: { fontSize: 9, color: '#9fb6bd', fontWeight: '600', marginTop: 1, fontFamily: fonts.condensedSemibold },
  right: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  count: { fontSize: 20, fontWeight: '800', color: brand.titleTeal, fontFamily: fonts.condensedBold },
  counterText: { fontSize: 9, color: '#9fb6bd', fontWeight: '600', lineHeight: 11, fontFamily: fonts.condensedSemibold },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: brand.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', paddingTop: 64, paddingRight: 12, alignItems: 'flex-end' },
  menu: {
    width: 250,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#27798',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  greeting: { fontSize: 15, color: brand.ink, fontFamily: fonts.body },
  userName: { fontWeight: '800', color: brand.titleTeal, fontFamily: fonts.bodyBold },
  progress: { fontSize: 12, color: brand.muted, marginTop: 4, fontFamily: fonts.body },
  progressNum: { fontWeight: '700', color: brand.teal, fontFamily: fonts.bodyBold },
  separator: { height: 1, backgroundColor: '#eef3f4', marginVertical: 12 },
  langLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9fb6bd',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontFamily: fonts.condensedBold,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  langText: { fontSize: 14, color: brand.ink, fontFamily: fonts.body },
  langActive: { fontWeight: '800', color: brand.teal, fontFamily: fonts.bodyBold },
});
