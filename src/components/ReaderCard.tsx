'use client';

// Linha da biblioteca — réplica do .reader-item original: capa 128px com
// badges verdes, título Barlow Condensed, "READER NÍVEL X" + estrelas,
// prévia do texto e botão Iniciar leitura / Continuar / Ler novamente com o
// contador de palavras novas.
import { useRouter } from 'next/navigation';
import type { Reader } from '@/lib/types';
import { Stars } from './Stars';
import styles from './ReaderCard.module.css';

// Mesma regra do getReaderOpenButtonText original.
function openButtonText(r: Reader): string {
  if (r.position > 1) return 'Continuar';
  if (r.times > 0) return 'Ler novamente';
  return 'Iniciar leitura';
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function ReaderCard({ reader }: { reader: Reader }) {
  const router = useRouter();
  const open = () => router.push(`/reading/${reader.id}`);

  return (
    <div className={styles.readerItem}>
      <div className={styles.coverContainer} onClick={open}>
        <img src={reader.coverUrl ?? ''} alt="image" className={styles.cover} />
        <div className={styles.readerTag}>
          {reader.times > 0 && (
            <img src="/icons/read-completed.svg" alt="leitura já realizada" className={styles.check} />
          )}
          {reader.position > 1 && (
            <img src="/icons/read-upcoming.svg" alt="leitura em andamento" className={styles.check} />
          )}
        </div>
      </div>

      <div className={styles.textContainer} onClick={open}>
        <h2 className={styles.title}>{reader.title}</h2>
        <section className={styles.levelAndRating}>
          <div className={styles.level}>
            {reader.level === 9 ? (
              <><span>Reader</span> Real Books</>
            ) : (
              <><span>Reader</span> Nível {reader.level}</>
            )}
          </div>
          <div className={styles.stars}>
            <Stars score={reader.score} />
          </div>
        </section>
        <div className={styles.preview}>{truncate(reader.sampleText ?? '', 166)}</div>
        {/* No mobile o original esconde o botão e mostra o contador aqui */}
        <p className={styles.mobileUniqueWords}>
          <span className={styles.quantity}>{reader.uniqueWordsNumber}</span> palavras novas
        </p>
      </div>

      <div className={styles.btnBox}>
        <button className={styles.btnReader} onClick={open}>
          {openButtonText(reader)}
        </button>
        <p className={styles.uniqueWords}>
          <span className={styles.quantity}>{reader.uniqueWordsNumber}</span> palavras novas
        </p>
      </div>
    </div>
  );
}
