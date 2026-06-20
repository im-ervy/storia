'use client';

// Réplica da tela de congratulation do gradedreaders.com (app-congratulation):
// 4 estágios — palavras do reader (count-up), total do usuário, progresso do
// nível (barra animada) e avaliação com estrelas.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Stars } from './Stars';
import styles from './Congratulation.module.css';

const COUNT_UP_MS = 2000;

// Count-up com easing (espelha o ngx-countUp de 2s do original).
function useCountUp(target: number, active: boolean, onComplete?: () => void) {
  const [value, setValue] = useState(0);
  const doneRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!active || doneRef.current) return;
    doneRef.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / COUNT_UP_MS);
      const eased = 1 - Math.pow(2, -10 * t); // easeOutExpo
      setValue(Math.round(target * (t === 1 ? 1 : eased)));
      if (t < 1) raf = requestAnimationFrame(tick);
      else onCompleteRef.current?.();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);
  return value;
}

interface ReaderInfo {
  wordsNumber: number;
  uniqueWordsNumber: number;
  level: number;
}
interface WordsInfo {
  wordsNumber: number;
  uniqueWordsNumber: number;
}
interface Stat {
  publishedReadersCount: number;
  userProgress: number;
  level: number;
  totalReadersFinished: number;
}

export function Congratulation({ readerId }: { readerId: number }) {
  const router = useRouter();
  const [stage, setStage] = useState(1);
  const [readerInfo, setReaderInfo] = useState<ReaderInfo | null>(null);
  const [userWords, setUserWords] = useState<WordsInfo | null>(null);
  const [stat, setStat] = useState<Stat | null>(null);
  const [scoreValue, setScoreValue] = useState(0);
  const [hadScore, setHadScore] = useState(false);
  const [showUnique, setShowUnique] = useState(false);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const info = await fetch(`/api/reader/${readerId}/info`).then((r) => r.json());
        const lang = info.lang ?? 'en';
        // Total do usuário e estatísticas POR IDIOMA (o idioma do reader concluído).
        const [stats, score, words] = await Promise.all([
          fetch(`/api/reader/reading/stats?lang=${lang}`).then((r) => r.json()),
          fetch(`/api/reader/${readerId}/score`).then((r) => r.json()),
          fetch(`/api/user/readTextsInfo?lang=${lang}`).then((r) => r.json()),
        ]);
        setReaderInfo(info);
        setUserWords(words);
        setStat(
          (stats as Stat[]).find((s) => s.level === info.level) ?? (stats as Stat[])[0]
        );
        setScoreValue(score.scoreValue ?? 0);
        setHadScore(!!score.creationDate);
      } catch {
        router.push('/library');
      }
    })();
  }, [readerId, router]);

  const totalWords = useCountUp(
    readerInfo?.wordsNumber ?? 0,
    stage === 1 && !!readerInfo,
    useCallback(() => setShowUnique(true), [])
  );
  const uniqueWords = useCountUp(readerInfo?.uniqueWordsNumber ?? 0, showUnique);
  const userTotal = useCountUp(userWords?.wordsNumber ?? 0, stage === 2 && !!userWords);
  const userUnique = useCountUp(
    userWords?.uniqueWordsNumber ?? 0,
    stage === 2 && !!userWords
  );

  // Barra de progresso anima até a porcentagem após 200ms (como o original)
  useEffect(() => {
    if (stage !== 3 || !stat) return;
    const pct =
      stat.userProgress >= stat.publishedReadersCount
        ? 100
        : (100 * stat.userProgress) / stat.publishedReadersCount;
    const t = setTimeout(() => setBarWidth(pct), 200);
    return () => clearTimeout(t);
  }, [stage, stat]);

  const submitScore = async () => {
    if (scoreValue >= 1) {
      await fetch(`/api/reader/${readerId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreValue }),
      }).catch(() => {});
    }
    router.push('/library');
  };

  if (!readerInfo || !stat) return <div className={styles.background} />;

  const complete = stat.userProgress >= stat.publishedReadersCount;
  const remaining = stat.publishedReadersCount - stat.userProgress;

  return (
    <div className={styles.background}>
      <div className={styles.container}>
        <div className={styles.title}>Congratulations!</div>
        <div className={styles.subTitle}>
          Você concluiu o seu <span className={styles.highlight}>reader </span>
          <span className={styles.number}>#{stat.totalReadersFinished}</span>
        </div>

        {stage === 1 && (
          <>
            <div className={styles.card}>
              <div className={styles.cardTitle}>Neste reader você...</div>
              <div className={styles.wordsDiv}>
                <div className={styles.totalWordsBg}>
                  <div className={styles.wordsAction}>Leu</div>
                  <span className={styles.countUpWords}>{totalWords}</span>
                  <div className={styles.wordsLabel}>palavras</div>
                </div>
                <div className={styles.uniqueWordsBg}>
                  <div className={styles.wordsAction}>Aprendeu</div>
                  <span className={styles.countUpUnique}>{showUnique ? uniqueWords : 0}</span>
                  <div className={styles.wordsLabel}>palavras únicas</div>
                </div>
              </div>
            </div>
            <div className={styles.nextStageFooter}>
              <button className={styles.btnNextStage} onClick={() => setStage(2)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {stage === 2 && (
          <>
            <div className={styles.card}>
              <div className={styles.userCardRow}>
                <div className={styles.userBackground}>
                  <div className={styles.userPhotoContainer}>
                    <div className={styles.userWordsBook}>
                      <img src="/icons/blue-book.svg" alt="" />
                    </div>
                    <div className={styles.userWordsPhoto}>
                      <img src="/icons/user-blank.svg" alt="" />
                    </div>
                  </div>
                </div>
                <div className={styles.userWordsBackground}>
                  <div className={styles.userCardTitle}>
                    <span className={styles.strong800}>Seu total</span>
                    <span>de palavras é...</span>
                  </div>
                  <div className={styles.userCounters}>
                    <div className={styles.userCounter}>
                      <p className={styles.countBlue}>{userTotal}</p>
                      <div className={styles.counterDescription}>
                        <p>Palavras</p>
                        <p className={styles.blue}>lidas</p>
                      </div>
                    </div>
                    <div className={styles.userCounter}>
                      <p className={styles.countGreen}>{userUnique}</p>
                      <div className={styles.counterDescription}>
                        <p>Palavras únicas</p>
                        <p className={styles.green}>aprendidas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.nextStageFooter}>
              <button className={styles.btnNextStage} onClick={() => setStage(3)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {stage === 3 && (
          <>
            <div className={styles.card}>
              <div className={styles.levelRow}>
                <div className={styles.yourLevelBackground}>
                  <div className={styles.yourLevel}>nível</div>
                  <div className={styles.yourLevelNumber}>{stat.level}</div>
                  <div className={styles.yourLevelIcon} />
                </div>
                <div className={styles.levelProgressContainer}>
                  <div className={styles.levelProgressText}>Seu progresso</div>
                  <div className={styles.progressBarContainer}>
                    <div
                      className={`${styles.progressGoalCounter} ${
                        complete ? styles.complete : ''
                      }`}
                    >
                      {stat.userProgress}/{stat.publishedReadersCount}
                    </div>
                    {Array.from({ length: 9 }, (_, i) => (
                      <span
                        key={i}
                        className={styles.progressBarSeparator}
                        style={{ left: `${25 * i + 25}px` }}
                      />
                    ))}
                    <div
                      className={`${styles.positiveBar} ${complete ? styles.complete : ''}`}
                      style={{ width: `${barWidth}%` }}
                    >
                      <span className={styles.blankSpace} />
                      {complete ? 'PARABÉNS!' : `Nível ${stat.level}`}
                    </div>
                    <div className={styles.negativeBar}>
                      <span className={styles.blankSpace} />
                      {complete ? 'PARABÉNS!' : `Nível ${stat.level}`}
                    </div>
                  </div>
                  <div className={styles.levelProgressReadingText}>
                    {complete ? (
                      <>
                        <span className={styles.strong}>
                          Você concluiu todos os readers do nível!
                        </span>{' '}
                        Acesse os readers do{' '}
                        <span className={styles.readingHighlight}>
                          nível {stat.level + 1}
                        </span>{' '}
                        para desbloquear a sua próxima etapa de aprendizado de inglês!
                      </>
                    ) : (
                      <>
                        Você leu {stat.userProgress}{' '}
                        {stat.userProgress > 1 ? 'readers' : 'reader'} do nível {stat.level}.
                        <br />
                        Leia mais {remaining}&nbsp;{remaining > 1 ? 'readers' : 'reader'} para
                        finalizar este nível.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.nextStageFooter}>
              <button className={styles.btnNextStage} onClick={() => setStage(4)}>
                Próximo
              </button>
            </div>
          </>
        )}

        {stage === 4 && (
          <>
            <div className={styles.card}>
              <div className={styles.opinionTitle}>
                {hadScore
                  ? 'Gostaria de mudar sua opinião sobre o reader?'
                  : 'Gostaríamos da sua opinião sobre o reader.'}
              </div>
              <div className={styles.underlineOpinionTitle} />
              <div className={styles.opinionText}>
                De 1 a 5, que nota você daria para a história do reader que você acabou de
                ler?
              </div>
              <div className={styles.starsContainer}>
                <Stars score={scoreValue} size={25} onSelect={setScoreValue} />
              </div>
              <div className={styles.opinionScore}>
                {hadScore ? 'Nova' : 'Minha'} nota: {scoreValue}
              </div>
            </div>
            <div className={styles.nextStageFooter}>
              <button
                className={`${styles.btnNextStage} ${styles.setScore}`}
                onClick={submitScore}
              >
                {scoreValue < 1
                  ? 'Manter minha opinião'
                  : hadScore
                    ? 'Enviar nova opinião'
                    : 'Confirmar minha nota'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
