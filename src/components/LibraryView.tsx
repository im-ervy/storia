'use client';

// Réplica da biblioteca original: faixa de filtros sticky (título da seção,
// níveis e TODOS/LIDOS/NÃO LIDOS) + lista de readers com scroll infinito.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LevelMeta, Reader } from '@/lib/types';
import { ReaderCard } from './ReaderCard';
import styles from './LibraryView.module.css';

// Mesmos valores do array readingStatuses do bundle original.
const STATUSES = [
  { value: 'All', localizedValue: 'Todos' },
  { value: 'Read', localizedValue: 'Lidos' },
  { value: 'Unread', localizedValue: 'Não lidos' },
];
const PAGE_SIZE = 8;

export function LibraryView({ levels: initialLevels }: { levels: LevelMeta[] }) {
  const [lang, setLang] = useState('en');
  const [levels, setLevels] = useState<LevelMeta[]>(initialLevels);
  const [level, setLevel] = useState(1);
  const [status, setStatus] = useState('All');
  const [readers, setReaders] = useState<Reader[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(true);
  const skipRef = useRef(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Idioma selecionado (trocado pelo menu do perfil)
  useEffect(() => {
    const saved = localStorage.getItem('gr-lang');
    if (saved && saved !== 'en') {
      setLang(saved);
      fetch(`/api/level?lang=${saved}`)
        .then((r) => r.json())
        .then((l: LevelMeta[]) => {
          setLevels(l);
          const first = l.find((x) => x.available)?.id ?? 1;
          setLevel(first);
        });
    }
  }, []);

  const fetchPage = useCallback(
    async (lng: string, lvl: number, st: string, sk: number, append: boolean) => {
      loadingRef.current = true;
      setLoading(true);
      const params = new URLSearchParams({
        'filter.level': String(lvl),
        'filter.readingStatus': st,
        'filter.lang': lng,
        'paging.skip': String(sk),
        'paging.take': String(PAGE_SIZE),
        'paging.orderBy': ' tryout DESC, title ASC',
      });
      const res = await fetch(`/api/user/readers?${params}`);
      const data = await res.json();
      setReaders((prev) => (append ? [...prev, ...data.result] : data.result));
      setTotalRows(data.totalRows);
      setLoading(false);
      loadingRef.current = false;
    },
    []
  );

  useEffect(() => {
    skipRef.current = 0;
    fetchPage(lang, level, status, 0, false);
  }, [lang, level, status, fetchPage]);

  // Informa o Header (sibling) o idioma + nível em foco, para a marca "by ..."
  // refletir o contexto (Mairo Vergara / ervy no Real Books / Ervy nos demais).
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gr-context', { detail: { lang, level } }));
  }, [lang, level]);

  // Scroll infinito (o original usa ngx-infinite-scroll)
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || loadingRef.current) return;
      if (skipRef.current + PAGE_SIZE >= totalRows) return;
      skipRef.current += PAGE_SIZE;
      fetchPage(lang, level, status, skipRef.current, true);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [lang, level, status, totalRows, fetchPage]);

  return (
    <>
      <section className={styles.filters}>
        <div className={styles.content}>
          <h1 className={styles.sectionTitle}>Biblioteca</h1>
          <section className={styles.levels}>
            {levels.map((l) => {
              const selected = l.id === level;
              return (
                <button
                  key={l.id}
                  className={[
                    styles.level,
                    l.available ? styles.available : '',
                    selected ? styles.selected : '',
                  ].join(' ')}
                  onClick={() => l.available && setLevel(l.id)}
                >
                  {l.name ?? `Nível ${l.id}`}
                </button>
              );
            })}
          </section>
          <section className={styles.readingStatuses}>
            {STATUSES.map((s) => (
              <button
                key={s.value}
                className={`${styles.readingStatus} ${
                  status === s.value ? styles.statusSelected : ''
                }`}
                onClick={() => setStatus(s.value)}
              >
                {s.localizedValue}
              </button>
            ))}
          </section>
        </div>
      </section>

      <div className={styles.readersList}>
        <div className={styles.searchResults}>
          {readers.map((r) => (
            <ReaderCard key={r.id} reader={r} />
          ))}
          {!loading && readers.length === 0 && (
            <div className={styles.empty}>Nenhum reader encontrado para este filtro.</div>
          )}
        </div>
        <div ref={sentinelRef} className={styles.sentinel} />
      </div>
    </>
  );
}
