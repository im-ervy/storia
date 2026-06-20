import { LoggedInHeader } from '@/components/Header';
import { getLevels, getReadTextsInfo, getReadingStats } from '@/lib/data';
import { readUserName } from '@/lib/userName';
import styles from './account.module.css';

export const dynamic = 'force-dynamic';

export default async function AccountPage() {
  const info = getReadTextsInfo();
  const stats = getReadingStats();
  const level1 = stats.find((s) => s.level === 1);
  const levels = getLevels().filter((l) => l.available);
  const finished = level1?.totalReadersFinished ?? 0;
  const userName = await readUserName();

  return (
    <>
      <LoggedInHeader
        uniqueWordsNumber={info.uniqueWordsNumber}
        level={1}
        userProgress={level1?.userProgress ?? 0}
        publishedReadersCount={level1?.publishedReadersCount ?? 30}
        userName={userName}
      />
      <main className={styles.page}>
        <div className={styles.card}>
          <div className={styles.cardHead}>
            <img src="/icons/user-blank.svg" alt="" className={styles.avatar} />
            <div>
              <h1 className={styles.name}>{userName || 'Você'}</h1>
              <div className={styles.sub}>Conta da réplica — Graded Readers</div>
            </div>
          </div>
          <div className={styles.statsRow}>
            <div className={styles.stat}>
              <div className={styles.statNum}>{info.wordsNumber.toLocaleString('pt-BR')}</div>
              <div className={styles.statLabel}>Palavras lidas</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>
                {info.uniqueWordsNumber.toLocaleString('pt-BR')}
              </div>
              <div className={styles.statLabel}>Palavras únicas</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNum}>{finished}</div>
              <div className={styles.statLabel}>Readers concluídos</div>
            </div>
          </div>
          <h2 className={styles.sectionTitle}>Progresso por nível</h2>
          <div className={styles.levels}>
            {stats
              .filter((s) => levels.some((l) => l.id === s.level))
              .map((s) => (
                <div key={s.level} className={styles.levelRow}>
                  <span className={styles.levelName}>Nível {s.level}</span>
                  <div className={styles.levelTrack}>
                    <div
                      className={styles.levelFill}
                      style={{
                        width: `${(100 * s.userProgress) / s.publishedReadersCount}%`,
                      }}
                    />
                  </div>
                  <span className={styles.levelCount}>
                    {s.userProgress}/{s.publishedReadersCount}
                  </span>
                </div>
              ))}
          </div>
          <a className={styles.back} href="/library">
            ‹ Voltar para a biblioteca
          </a>
        </div>
      </main>
    </>
  );
}
