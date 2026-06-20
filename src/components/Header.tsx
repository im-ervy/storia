'use client';

// Réplica do header logado do gradedreaders.com (app-root-loggedin-template):
// logo GRADED READERS + by Mairo Vergara, abas BIBLIOTECA | ÁUDIO, contador de
// palavras únicas lidas, painel do usuário com progresso do nível e a imagem
// decorativa (Estátua da Liberdade) à direita.
import { useEffect, useRef, useState } from 'react';
import { brandingAuthor } from '@/lib/branding';
import styles from './Header.module.css';

// 1294 -> "1.294" (mesma formatação getThousandSeparated do original)
function thousandSeparated(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Idiomas dos Readers (código + rótulo PT-BR). Usado no dropdown do perfil
// (desktop) e no seletor mobile.
const READER_LANGS: [string, string][] = [
  ['en', 'Inglês'],
  ['fr', 'Francês'],
  ['es', 'Espanhol'],
  ['it', 'Italiano'],
  ['zh', 'Mandarim'],
  ['ru', 'Russo'],
  ['ja', 'Japonês'],
];

interface Props {
  uniqueWordsNumber: number;
  level: number;
  userProgress: number;
  publishedReadersCount: number;
  userName?: string;
}

// Pergunta o nome no primeiro acesso (quando ainda não há nome salvo). Espelha
// o onboarding do site original; persiste em PUT /api/user/name e recarrega.
function NamePrompt() {
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = value.trim();
    if (!name || saving) return;
    setSaving(true);
    try {
      await fetch('/api/user/name', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
    } catch {
      /* segue mesmo se falhar */
    }
    window.location.href = '/library';
  };

  return (
    <div className={styles.namePromptOverlay}>
      <form className={styles.namePromptBox} onSubmit={submit}>
        <div className={styles.namePromptTitle}>Bem-vindo aos Graded Readers!</div>
        <div className={styles.namePromptText}>Como podemos te chamar?</div>
        <input
          className={styles.namePromptInput}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Seu nome"
          maxLength={40}
          autoFocus
        />
        <button type="submit" className={styles.namePromptButton} disabled={!value.trim() || saving}>
          {saving ? 'Salvando...' : 'Começar'}
        </button>
      </form>
    </div>
  );
}

// Overlay do vídeo "Como usar os Readers" (réplica do overlay-box-tutorial;
// URL real capturada: /api/parameter/How To Use Graded Readers Video Url).
const TUTORIAL_VIDEO_ID = 'MsqwgBNm8HI';

export function TutorialOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className={styles.tutorialOverlay} onClick={onClose}>
      <div className={styles.videoBoxBtnClose}>
        <button className={styles.closeOverlay} onClick={onClose} aria-label="Fechar">
          <img src="/icons/close.svg" alt="" />
        </button>
      </div>
      <div className={styles.videoBox} onClick={(e) => e.stopPropagation()}>
        <div className={styles.videoTitle}>Como usar os Readers</div>
        <iframe
          className={styles.videoTutorial}
          src={`https://www.youtube.com/embed/${TUTORIAL_VIDEO_ID}`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

export function LoggedInHeader({
  uniqueWordsNumber,
  level,
  userProgress,
  publishedReadersCount,
  userName = '',
}: Props) {
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lang, setLang] = useState('en');
  // Nível em foco na biblioteca (para a marca "by ..." virar "ervy" no Real
  // Books). A LibraryView emite o evento 'gr-context' ao trocar nível/idioma.
  const [ctxLevel, setCtxLevel] = useState(level);
  // Contagem de palavras únicas POR IDIOMA. O valor do servidor é do inglês; no
  // cliente refazemos a busca com o gr-lang ativo (que vive no localStorage).
  const [words, setWords] = useState(uniqueWordsNumber);
  const panelRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadWords = (active: string) =>
      fetch(`/api/user/readTextsInfo?lang=${active}`)
        .then((r) => r.json())
        .then((d: { uniqueWordsNumber: number }) => setWords(d.uniqueWordsNumber))
        .catch(() => {});
    const active = localStorage.getItem('gr-lang') ?? 'en';
    setLang(active);
    loadWords(active);
    const onCtx = (e: Event) => {
      const detail = (e as CustomEvent<{ lang?: string; level?: number }>).detail;
      if (detail?.lang) {
        setLang(detail.lang);
        loadWords(detail.lang);
      }
      if (typeof detail?.level === 'number') setCtxLevel(detail.level);
    };
    window.addEventListener('gr-context', onCtx);
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => {
      window.removeEventListener('gr-context', onCtx);
      document.removeEventListener('mousedown', onDoc);
    };
  }, []);

  const changeLang = (value: string) => {
    localStorage.setItem('gr-lang', value);
    window.location.href = '/library';
  };

  return (
    <header className={styles.loggedinHeader}>
      {!userName && <NamePrompt />}
      <div className={styles.whiteBackground} />
      <div className={styles.loggedinBackground} />
      <div className={styles.headerHeight}>
        <a href="/library" className={styles.gradedReadersTextWrapper}>
          <div className={styles.gradedReadersTextDiv}>
            <span className={styles.gradedText}>Graded</span>&nbsp;
            <span className={styles.readersText}>Readers</span>
          </div>
          <div className={styles.byMvText}>
            by&nbsp;
            <br />
            {brandingAuthor(lang, ctxLevel)}
          </div>
        </a>

        <div className={styles.profilePanelWrapper}>
          <div className={styles.userUniqueWordsCounter}>
            <div className={styles.verticalLine} />
            <div className={styles.counterIcon}>
              <img src="/icons/theme.svg" alt="" className={styles.wordCounterIcon} />
            </div>
            <div className={styles.count}>{thousandSeparated(words)}</div>
            <div className={styles.counterText}>
              <div>Palavras</div>
              <div>únicas lidas</div>
            </div>
          </div>

          <div className={styles.profilePanel} ref={panelRef}>
            <div
              className={`${styles.userPanel} ${open ? styles.open : ''}`}
              onClick={() => setOpen((v) => !v)}
            >
              <div className={styles.iconPanel}>
                <img src="/icons/play.svg" alt="" className={styles.arrowIcon} />
                <img src="/icons/user-blank.svg" alt="" className={styles.avatarIcon} />
              </div>
              <div className={styles.infoPanel}>
                <div className={styles.greetings}>
                  Olá, <span className={styles.userName}>{userName}</span>
                </div>
                <div className={styles.progressLevel}>
                  Progresso nível <span>{level}</span>
                </div>
                <div className={styles.readersRead}>
                  <span className={styles.number}>
                    {userProgress}/{publishedReadersCount}
                  </span>
                </div>
              </div>
              {open && (
                <div className={styles.floatingMenu}>
                  <a className={styles.floatingMenuOption} href="/account">
                    Meu cadastro
                  </a>
                  <div className={styles.floatingMenuSeparator} />
                  <a
                    className={styles.floatingMenuOption}
                    href="mailto:suporte@gradedreaders.com"
                  >
                    Entre em contato
                  </a>
                  <div className={styles.floatingMenuSeparator} />
                  <a
                    className={styles.floatingMenuOption}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      setShowTutorial(true);
                    }}
                  >
                    Como usar os Readers
                  </a>
                  <div className={styles.floatingMenuSeparator} />
                  <div className={styles.langSection}>
                    <span className={styles.langLabel}>Idioma dos Readers</span>
                    {READER_LANGS.map(([code, label]) => (
                      <button
                        key={code}
                        className={`${styles.langOption} ${lang === code ? styles.langActive : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          changeLang(code);
                        }}
                      >
                        {label} {lang === code && '✓'}
                      </button>
                    ))}
                  </div>
                  <div className={styles.floatingMenuSeparator} />
                  <a className={styles.floatingMenuOption} href="/">
                    Sair
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Seletor de idioma — só no mobile (o dropdown do perfil some em <=991px) */}
        <div className={styles.mobileLang} ref={langRef}>
          <button
            className={`${styles.mobileLangBtn} ${langOpen ? styles.mobileLangOpen : ''}`}
            onClick={() => setLangOpen((v) => !v)}
            aria-label="Idioma dos Readers"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" strokeWidth="1.6" />
            </svg>
            <span>{READER_LANGS.find(([c]) => c === lang)?.[1] ?? 'Idioma'}</span>
          </button>
          {langOpen && (
            <div className={styles.mobileLangMenu}>
              <span className={styles.langLabel}>Idioma dos Readers</span>
              {READER_LANGS.map(([code, label]) => (
                <button
                  key={code}
                  className={`${styles.langOption} ${lang === code ? styles.langActive : ''}`}
                  onClick={() => changeLang(code)}
                >
                  {label} {lang === code && '✓'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.menuBorderDetails} />
      <div className={styles.menu}>
        <span className={`${styles.menuItem} ${styles.itemSelected}`}>
          <img src="/icons/library.svg" alt="" className={`${styles.menuIcon} ${styles.iconSelected}`} />
          <span>Biblioteca</span>
        </span>
        <span className={styles.menuSeparator}>&nbsp;</span>
        <span className={styles.menuItem} title="Disponível apenas na réplica de leitura">
          <img src="/icons/audio.svg" alt="" className={styles.menuIcon} />
          <span>Áudio</span>
        </span>
      </div>

      {/* Bottom-nav mobile (réplica da section.bottom do original) */}
      <nav className={styles.bottomNav}>
        <a className={`${styles.bottomNavItem} ${styles.bottomNavActive}`} href="/library">
          <img src="/icons/library.svg" alt="" />
          <span>Biblioteca</span>
        </a>
        <span className={styles.bottomNavItem} title="Disponível apenas na réplica de leitura">
          <img src="/icons/audio.svg" alt="" />
          <span>Áudio</span>
        </span>
        <a className={styles.bottomNavItem} href="/account">
          <img src="/icons/my-account.svg" alt="" />
          <span>Minha conta</span>
        </a>
        <span
          className={styles.bottomNavItem}
          onClick={() => setShowTutorial(true)}
          role="button"
        >
          <img src="/icons/help.svg" alt="" />
          <span>Ajuda</span>
        </span>
      </nav>

      {showTutorial && <TutorialOverlay onClose={() => setShowTutorial(false)} />}
    </header>
  );
}
