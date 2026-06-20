// Linha da biblioteca (réplica do .reader-item, layout mobile do web):
// capa 96px com badges, título, "READER NÍVEL X" + estrelas, prévia e o
// contador de palavras novas. O card inteiro abre o reader.
import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { Reader } from '@/lib/types';
import { coverSource } from '@/lib/covers';
import { brand } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { Stars } from './Stars';

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function ReaderCardBase({ reader }: { reader: Reader }) {
  const router = useRouter();
  const cover = coverSource(reader.coverUrl);
  const levelLabel = reader.level === 9 ? 'Real Books' : `Nível ${reader.level}`;

  return (
    <Pressable
      style={styles.item}
      onPress={() => router.push(`/reading/${reader.id}`)}
      android_ripple={{ color: '#e3eef0' }}
    >
      <View style={styles.coverContainer}>
        {cover ? (
          <Image source={cover} style={styles.cover} />
        ) : (
          <View style={[styles.cover, styles.coverFallback]} />
        )}
        <View style={styles.readerTag}>
          {reader.times > 0 && (
            <Ionicons name="checkmark-circle" size={22} color={brand.greenA} style={styles.badge} />
          )}
          {reader.position > 1 && (
            <Ionicons name="play-circle" size={22} color={brand.teal} style={styles.badge} />
          )}
        </View>
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {reader.title}
        </Text>
        <View style={styles.levelRow}>
          <Text style={styles.level}>READER {levelLabel.toUpperCase()}</Text>
          <Stars score={reader.score} size={14} />
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {truncate(reader.sampleText ?? '', 166)}
        </Text>
        <Text style={styles.unique}>
          <Text style={styles.quantity}>{reader.uniqueWordsNumber}</Text> palavras novas
        </Text>
      </View>
    </Pressable>
  );
}

export const ReaderCard = memo(ReaderCardBase);

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dde9eb',
  },
  coverContainer: { width: 96, height: 96, position: 'relative' },
  cover: {
    width: 96,
    height: 96,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cfdee1',
    backgroundColor: '#eef4f5',
  },
  coverFallback: { backgroundColor: '#dbe8ea' },
  readerTag: { position: 'absolute', top: 8, left: -10, alignItems: 'center', gap: 2 },
  badge: {
    backgroundColor: '#fff',
    borderRadius: 11,
  },
  text: { flex: 1, paddingLeft: 16 },
  title: {
    color: '#124653',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
    marginBottom: 5,
    fontFamily: fonts.condensedBold,
  },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 14, height: 22 },
  level: { color: '#9fb6bd', fontSize: 13, fontWeight: '700', fontFamily: fonts.condensedBold },
  preview: {
    color: '#6d969a',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    lineHeight: 18,
    fontFamily: fonts.body,
  },
  unique: {
    color: '#9fb6bd',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
    fontFamily: fonts.body,
  },
  quantity: { color: '#6d848b', fontFamily: fonts.bodyBold },
});
