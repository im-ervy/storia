// Biblioteca (réplica do LibraryView): faixa de filtros (níveis + Todos/Lidos/
// Não lidos) e lista de readers com scroll infinito. Dados 100% locais.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LevelMeta, Reader } from '@/lib/types';
import { getLevels, queryReaders, getReadTextsInfo } from '@/lib/data';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { ReaderCard } from '@/components/ReaderCard';
import { brand } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const STATUSES = [
  { value: 'All', label: 'Todos' },
  { value: 'Read', label: 'Lidos' },
  { value: 'Unread', label: 'Não lidos' },
];
const PAGE_SIZE = 8;

export default function LibraryScreen() {
  const { lang } = useApp();
  const [levels, setLevels] = useState<LevelMeta[]>(() => getLevels('en'));
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState('All');
  const [take, setTake] = useState(PAGE_SIZE);
  const [uniqueWords, setUniqueWords] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  // Troca de idioma: recarrega os níveis e seleciona o primeiro disponível.
  useEffect(() => {
    const lvls = getLevels(lang);
    setLevels(lvls);
    setLevel(lvls.find((l) => l.available)?.id ?? 1);
    setTake(PAGE_SIZE);
  }, [lang]);

  // Contador de palavras únicas lidas no IDIOMA ativo (async).
  const refreshWords = useCallback(() => {
    getReadTextsInfo(lang).then((info) => setUniqueWords(info.uniqueWordsNumber));
  }, [lang]);

  // Reavalia ao voltar do reader (progresso pode ter mudado) e ao trocar idioma.
  useFocusEffect(
    useCallback(() => {
      refreshWords();
      setRefreshTick((t) => t + 1);
    }, [refreshWords])
  );
  useEffect(() => {
    refreshWords();
  }, [refreshWords]);

  const query = useMemo(
    () => queryReaders({ level, readingStatus: status, lang, skip: 0, take }),
    // refreshTick força reconsultar o progresso após finalizar um reader
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, status, lang, take, refreshTick]
  );

  const published = levels.find((l) => l.id === level)?.publishedReadersCount ?? 0;
  const userProgress = useMemo(
    () => queryReaders({ level, readingStatus: 'Read', lang, skip: 0, take: 9999 }).totalRows,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [level, lang, refreshTick]
  );

  const loadMore = () => {
    if (take < query.totalRows) setTake((t) => t + PAGE_SIZE);
  };

  const renderItem = useCallback(({ item }: { item: Reader }) => <ReaderCard reader={item} />, []);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Header
        uniqueWordsNumber={uniqueWords}
        level={level}
        userProgress={userProgress}
        publishedReadersCount={published}
      />

      <View style={styles.filters}>
        <Text style={styles.sectionTitle}>Biblioteca</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {levels.map((l) => {
            const selected = l.id === level;
            return (
              <Pressable
                key={l.id}
                disabled={!l.available}
                onPress={() => setLevel(l.id)}
                style={[
                  styles.levelChip,
                  selected && styles.levelChipSelected,
                  !l.available && styles.levelChipDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.levelChipText,
                    selected && styles.levelChipTextSelected,
                    !l.available && styles.levelChipTextDisabled,
                  ]}
                >
                  {l.name ?? `Nível ${l.id}`}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <View style={styles.statusRow}>
          {STATUSES.map((s) => (
            <Pressable key={s.value} onPress={() => setStatus(s.value)}>
              <Text style={[styles.status, status === s.value && styles.statusSelected]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={query.result}
        keyExtractor={(r) => String(r.id)}
        renderItem={renderItem}
        onEndReached={loadMore}
        onEndReachedThreshold={0.6}
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum reader encontrado para este filtro.</Text>
        }
        contentContainerStyle={query.result.length === 0 && styles.emptyContainer}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  filters: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eef3f4',
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: brand.titleTeal,
    marginBottom: 12,
    fontFamily: fonts.condensedBold,
  },
  chipRow: { gap: 8, paddingRight: 16 },
  levelChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#eef4f5',
  },
  levelChipSelected: { backgroundColor: brand.teal },
  levelChipDisabled: { backgroundColor: '#f4f7f8' },
  levelChipText: { fontSize: 13, fontWeight: '700', color: '#5e7a81', fontFamily: fonts.condensedBold },
  levelChipTextSelected: { color: '#fff' },
  levelChipTextDisabled: { color: '#c5d3d6' },
  statusRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  status: {
    fontSize: 13,
    fontWeight: '700',
    color: '#9fb6bd',
    textTransform: 'uppercase',
    fontFamily: fonts.condensedBold,
  },
  statusSelected: { color: brand.teal },
  empty: { textAlign: 'center', color: brand.muted, marginTop: 40, fontSize: 14, fontFamily: fonts.body },
  emptyContainer: { flexGrow: 1 },
});
