// Tela de congratulation — porta do Congratulation.tsx web: 4 estágios com
// count-up (palavras do reader, total do usuário, progresso do nível) e a
// avaliação por estrelas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getReader, getReaderInfo, getReadTextsInfo, getReadingStats, getScore, setScore } from '@/lib/data';
import { Stars } from '@/components/Stars';
import { brand } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const COUNT_UP_MS = 2000;

function useCountUp(target: number, active: boolean, onComplete?: () => void) {
  const [value, setValue] = useState(0);
  const doneRef = useRef(false);
  const cbRef = useRef(onComplete);
  cbRef.current = onComplete;

  useEffect(() => {
    if (!active || doneRef.current) return;
    doneRef.current = true;
    const start = Date.now();
    let raf = 0;
    const tick = () => {
      const t = Math.min(1, (Date.now() - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(2, -10 * t);
      setValue(Math.round(target * (t === 1 ? 1 : eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else cbRef.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return value;
}

interface Info {
  wordsNumber: number;
  uniqueWordsNumber: number;
  level: number;
}
interface Stat {
  publishedReadersCount: number;
  userProgress: number;
  level: number;
  totalReadersFinished: number;
}

export default function CongratulationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const readerId = Number(id);
  const router = useRouter();

  const [stage, setStage] = useState(1);
  const [info, setInfo] = useState<Info | null>(null);
  const [userWords, setUserWords] = useState<{ wordsNumber: number; uniqueWordsNumber: number } | null>(null);
  const [stat, setStat] = useState<Stat | null>(null);
  const [scoreValue, setScoreValue] = useState(0);
  const [hadScore, setHadScore] = useState(false);
  const [showUnique, setShowUnique] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const lang = getReader(readerId)?.lang ?? 'en';
        const [rInfo, words] = await Promise.all([
          getReaderInfo(readerId),
          getReadTextsInfo(lang),
        ]);
        const stats = getReadingStats(lang);
        const score = getScore(readerId);
        setInfo(rInfo);
        setUserWords(words);
        setStat(stats.find((s) => s.level === rInfo.level) ?? stats[0]);
        setScoreValue(score.scoreValue ?? 0);
        setHadScore(!!score.creationDate);
      } catch {
        router.replace('/library');
      }
    })();
  }, [readerId, router]);

  const totalWords = useCountUp(
    info?.wordsNumber ?? 0,
    stage === 1 && !!info,
    useCallback(() => setShowUnique(true), [])
  );
  const uniqueWords = useCountUp(info?.uniqueWordsNumber ?? 0, showUnique);
  const userTotal = useCountUp(userWords?.wordsNumber ?? 0, stage === 2 && !!userWords);
  const userUnique = useCountUp(userWords?.uniqueWordsNumber ?? 0, stage === 2 && !!userWords);

  useEffect(() => {
    if (stage !== 3 || !stat) return;
    const pct =
      stat.userProgress >= stat.publishedReadersCount
        ? 100
        : (100 * stat.userProgress) / stat.publishedReadersCount;
    const t = setTimeout(() => setBarWidth(pct), 200);
    return () => clearTimeout(t);
  }, [stage, stat]);

  const submitScore = () => {
    if (scoreValue >= 1) setScore(readerId, scoreValue);
    router.replace('/library');
  };

  if (!info || !stat) return <View style={styles.bg} />;

  const complete = stat.userProgress >= stat.publishedReadersCount;
  const remaining = stat.publishedReadersCount - stat.userProgress;

  return (
    <SafeAreaView style={styles.bg}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Congratulations!</Text>
        <Text style={styles.subTitle}>
          Você concluiu o seu <Text style={styles.highlight}>reader </Text>
          <Text style={styles.number}>#{stat.totalReadersFinished}</Text>
        </Text>

        {stage === 1 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Neste reader você...</Text>
              <View style={styles.wordsRow}>
                <View style={styles.wordBox}>
                  <Text style={styles.wordsAction}>Leu</Text>
                  <Text style={[styles.bigCount, { color: brand.teal }]}>{totalWords}</Text>
                  <Text style={styles.wordsLabel}>palavras</Text>
                </View>
                <View style={styles.wordBox}>
                  <Text style={styles.wordsAction}>Aprendeu</Text>
                  <Text style={[styles.bigCount, { color: brand.greenA }]}>
                    {showUnique ? uniqueWords : 0}
                  </Text>
                  <Text style={styles.wordsLabel}>palavras únicas</Text>
                </View>
              </View>
            </View>
            <NextButton onPress={() => setStage(2)} />
          </>
        )}

        {stage === 2 && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                <Text style={styles.strong}>Seu total</Text> de palavras é...
              </Text>
              <View style={styles.wordsRow}>
                <View style={styles.wordBox}>
                  <Text style={[styles.bigCount, { color: brand.teal }]}>{userTotal}</Text>
                  <Text style={styles.wordsLabel}>Palavras lidas</Text>
                </View>
                <View style={styles.wordBox}>
                  <Text style={[styles.bigCount, { color: brand.greenA }]}>{userUnique}</Text>
                  <Text style={styles.wordsLabel}>Palavras únicas aprendidas</Text>
                </View>
              </View>
            </View>
            <NextButton onPress={() => setStage(3)} />
          </>
        )}

        {stage === 3 && (
          <>
            <View style={styles.card}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeLabel}>nível</Text>
                  <Text style={styles.levelBadgeNum}>{stat.level}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.progressLabel}>Seu progresso</Text>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${barWidth}%`, backgroundColor: complete ? brand.greenA : brand.teal },
                      ]}
                    />
                    <Text style={styles.progressGoal}>
                      {stat.userProgress}/{stat.publishedReadersCount}
                    </Text>
                  </View>
                  <Text style={styles.progressText}>
                    {complete ? (
                      <>
                        <Text style={styles.strong}>Você concluiu todos os readers do nível!</Text>{' '}
                        Acesse os readers do nível {stat.level + 1} para desbloquear a próxima etapa.
                      </>
                    ) : (
                      `Você leu ${stat.userProgress} ${
                        stat.userProgress > 1 ? 'readers' : 'reader'
                      } do nível ${stat.level}. Leia mais ${remaining} ${
                        remaining > 1 ? 'readers' : 'reader'
                      } para finalizar este nível.`
                    )}
                  </Text>
                </View>
              </View>
            </View>
            <NextButton onPress={() => setStage(4)} />
          </>
        )}

        {stage === 4 && (
          <>
            <View style={styles.card}>
              <Text style={styles.opinionTitle}>
                {hadScore
                  ? 'Gostaria de mudar sua opinião sobre o reader?'
                  : 'Gostaríamos da sua opinião sobre o reader.'}
              </Text>
              <Text style={styles.opinionText}>
                De 1 a 5, que nota você daria para a história do reader que acabou de ler?
              </Text>
              <View style={styles.starsContainer}>
                <Stars score={scoreValue} size={32} onSelect={setScoreValue} />
              </View>
              <Text style={styles.opinionScore}>
                {hadScore ? 'Nova' : 'Minha'} nota: {scoreValue}
              </Text>
            </View>
            <NextButton
              onPress={submitScore}
              label={
                scoreValue < 1
                  ? 'Manter minha opinião'
                  : hadScore
                    ? 'Enviar nova opinião'
                    : 'Confirmar minha nota'
              }
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function NextButton({ onPress, label = 'Próximo' }: { onPress: () => void; label?: string }) {
  return (
    <Pressable style={styles.nextBtn} onPress={onPress}>
      <Text style={styles.nextBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#eef6f8' },
  container: { padding: 20, alignItems: 'center' },
  title: { fontSize: 34, fontWeight: '800', color: brand.titleTeal, marginTop: 12, fontFamily: fonts.condensedBold },
  subTitle: { fontSize: 16, color: brand.muted, marginTop: 6, marginBottom: 20, fontFamily: fonts.body },
  highlight: { color: brand.teal, fontWeight: '700', fontFamily: fonts.bodyBold },
  number: { color: brand.greenA, fontWeight: '800', fontFamily: fonts.bodyBold },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#27798',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  cardTitle: { fontSize: 18, color: brand.ink, textAlign: 'center', marginBottom: 18, fontFamily: fonts.body },
  strong: { fontWeight: '800', color: brand.titleTeal, fontFamily: fonts.bodyBold },
  wordsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  wordBox: { alignItems: 'center', flex: 1, paddingHorizontal: 6 },
  wordsAction: { fontSize: 13, color: brand.muted, fontWeight: '600', fontFamily: fonts.bodySemibold },
  bigCount: { fontSize: 46, fontWeight: '800', marginVertical: 2, fontFamily: fonts.condensedBold },
  wordsLabel: { fontSize: 13, color: brand.muted, textAlign: 'center', fontFamily: fonts.body },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levelBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: brand.titleTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeLabel: { color: '#bfe0e8', fontSize: 11, textTransform: 'uppercase', fontFamily: fonts.condensedSemibold },
  levelBadgeNum: { color: '#fff', fontSize: 24, fontWeight: '800', fontFamily: fonts.condensedBold },
  progressLabel: { fontSize: 13, color: brand.muted, marginBottom: 6, fontFamily: fonts.body },
  progressTrack: {
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e3eef0',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  progressFill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 13 },
  progressGoal: { textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#43616a', fontFamily: fonts.condensedBold },
  progressText: { fontSize: 13, color: brand.muted, marginTop: 10, lineHeight: 19, fontFamily: fonts.body },
  opinionTitle: { fontSize: 18, fontWeight: '700', color: brand.titleTeal, textAlign: 'center', fontFamily: fonts.condensedBold },
  opinionText: { fontSize: 14, color: brand.muted, textAlign: 'center', marginTop: 12, fontFamily: fonts.body },
  starsContainer: { alignItems: 'center', marginVertical: 18 },
  opinionScore: { textAlign: 'center', fontSize: 15, fontWeight: '700', color: brand.ink, fontFamily: fonts.bodyBold },
  nextBtn: {
    marginTop: 20,
    backgroundColor: brand.teal,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 6,
  },
  nextBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', textTransform: 'uppercase', fontFamily: fonts.condensedBold },
});
