'use client';

// Réplica fiel do modo leitura do gradedreaders.com (app-root-reading-template +
// app-reading do bundle original): header de 35px, badge de nível, texto
// justificado paginado por medição, setas laterais, tooltip de tradução e os
// três temas (branco / preto / sépia).
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import type { Token } from '@/lib/types';
import { brandingAuthor } from '@/lib/branding';
import styles from './ReaderView.module.css';

type ThemeValue = 'white' | 'blackAndWhite' | 'sepia';

const THEMES: { value: ThemeValue; name: string; color: string; bodyBg: string }[] = [
  { value: 'white', name: 'BRANCO', color: '#ffffff', bodyBg: '#f3fafb' },
  { value: 'blackAndWhite', name: 'PRETO', color: '#000000', bodyBg: '#1c1c1c' },
  { value: 'sepia', name: 'SÉPIA', color: '#d2c4b5', bodyBg: '#f9f4e8' },
];
const THEME_CLASS: Record<ThemeValue, string> = {
  white: styles.white,
  blackAndWhite: styles.blackAndWhite,
  sepia: styles.sepia,
};
const THEME_KEY = 'gr-color-theme';
const PINYIN_KEY = 'gr-pinyin';
const NOTES_KEY = 'gr-notes-highlight';

interface Props {
  readerId: number;
  title: string;
  level: number;
  /** Idioma do texto ('en' | 'fr') — define a voz da narração */
  lang?: string;
}

interface IndexedToken {
  token: Token;
  idx: number;
}

interface Page {
  paragraphs: IndexedToken[][];
  startIndex: number; // primeiro token da página (previousIndex no original)
  nextIndex: number; // primeiro token da página seguinte
  isLast: boolean;
}

interface TooltipState {
  idx: number;
  left: number;
  top: number;
  anchorTop: number;
  ready: boolean;
}

// Token "especial" (pontuação solta) que não deve abrir uma página — espelha o
// specialChars do paginador original.
function isSpecialToken(t: Token) {
  if (t.translation !== null) return false; // tokens de conteúdo nunca são especiais
  const s = t.text.replace(/\s/g, '');
  return s.length <= 2;
}

// Nos readers de mandarim, translation.text é "pinyin — tradução"; o pinyin
// vem antes do travessão e pode ser exibido acima dos hanzi (modo ruby).
const PINYIN_SEP = ' — ';
function pinyinOf(t: Token): string | null {
  const tr = t.translation?.text;
  if (!tr) return null;
  const i = tr.indexOf(PINYIN_SEP);
  return i > 0 ? tr.slice(0, i) : null;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Modos de leitura assistida exibida acima do texto (ruby):
// - 'translit' = pinyin (zh) / transliteração (ru) sobre o chunk inteiro;
// - 'romaji'   = rōmaji (ja) sobre o chunk inteiro;
// - 'furigana' = hiragana (ja) APENAS sobre os kanji (token.furigana);
// - 'off'      = sem ruby.
type RubyMode = 'furigana' | 'romaji' | 'translit' | 'off';

// HTML do token para o medidor (mesma estrutura ruby da renderização real, p/
// a medição de altura bater com a página).
function rubyUnitsHtml(token: Token, mode: RubyMode): string {
  if (mode === 'furigana') {
    if (!token.furigana) return escapeHtml(token.text);
    return token.furigana
      .map((s) =>
        s.r
          ? `<ruby>${escapeHtml(s.t)}<rt>${escapeHtml(s.r)}</rt></ruby>`
          : escapeHtml(s.t)
      )
      .join('');
  }
  const py = pinyinOf(token);
  return py
    ? `<ruby>${escapeHtml(token.text)}<rt>${escapeHtml(py)}</rt></ruby>`
    : escapeHtml(token.text);
}

// Renderiza um token com o ruby do modo ativo: furigana (kana só sobre os
// kanji) ou pinyin/rōmaji/translit (sobre o chunk inteiro).
function renderRubyNode(token: Token, mode: RubyMode): ReactNode {
  if (mode === 'furigana') {
    if (!token.furigana) return token.text;
    return token.furigana.map((s, i) =>
      s.r ? (
        <ruby key={i}>
          {s.t}
          <rt className={styles.pinyin}>{s.r}</rt>
        </ruby>
      ) : (
        <Fragment key={i}>{s.t}</Fragment>
      )
    );
  }
  if (mode === 'off') return token.text;
  const py = pinyinOf(token);
  return py ? (
    <ruby>
      {token.text}
      <rt className={styles.pinyin}>{py}</rt>
    </ruby>
  ) : (
    token.text
  );
}

// Parâmetros de medição idênticos ao TextMetricsGenerator do bundle original.
function getMetricsParams() {
  const w = document.body.clientWidth;
  const h = window.innerHeight;
  if (w < 992) {
    const isXs = w < 576;
    // Orçamento exato da viewport: header (35) + cabeçalho do reader na 1ª
    // página + padding-top da página (30/50) + barra fixa inferior (~50).
    // As fórmulas originais (0.77h-80 / 0.98h-100) estouravam a tela em
    // algumas alturas — e sem scroll o excesso ficava inacessível; melhor
    // empurrar para a página seguinte.
    return {
      // Largura real da coluna de texto (88vw / 83vw) — o 330px fixo do app
      // original subestima a altura em telas com menos de 375px de largura.
      textWidth: Math.floor(w * (isXs ? 0.88 : 0.83)),
      fontSize: isXs ? '17px' : '20px',
      lineHeight: isXs ? '27px' : '31.66px',
      twoLines: 54,
      firstMax: Math.max(160, Math.min(Math.floor(h * 0.77 - 80), h - (isXs ? 215 : 230))),
      otherMax: Math.max(160, h - 150),
      finishReserve: 60,
      paragraphMargin: isXs ? 10 : 28,
    };
  }
  if (w < 1200) {
    return {
      textWidth: 680,
      fontSize: '20px',
      lineHeight: '31.66px',
      twoLines: 64,
      firstMax: h - (35 + 40 + 161 + 50),
      otherMax: h - (35 + 40 + 40 + 4 + 50),
      finishReserve: 90,
      paragraphMargin: 28,
    };
  }
  return {
    textWidth: 750,
    fontSize: '24px',
    lineHeight: '37.992px',
    twoLines: 80,
    firstMax: h - (35 + 48 + 161 + 35),
    otherMax: h - (35 + 48 + 4 + 50),
    finishReserve: 90,
    paragraphMargin: 28,
  };
}

// Divide os tokens em parágrafos (token.newLine abre um parágrafo novo).
function splitParagraphs(tokens: Token[]): IndexedToken[][] {
  const out: IndexedToken[][] = [];
  let cur: IndexedToken[] = [];
  tokens.forEach((token, idx) => {
    if (token.newLine && cur.length) {
      out.push(cur);
      cur = [];
    }
    cur.push({ token, idx });
  });
  if (cur.length) out.push(cur);
  return out;
}

// Pagina o texto medindo a altura real de cada parágrafo num elemento oculto,
// como o ReaderPageRenderer original (parágrafos que não cabem são divididos
// por sentença; fragmentos com menos de duas linhas vão para a próxima página).
function paginate(tokens: Token[], measurer: HTMLDivElement, rubyMode: RubyMode = 'off'): Page[] {
  const params = getMetricsParams();
  const withRuby = rubyMode !== 'off';
  measurer.style.width = `${params.textWidth}px`;
  measurer.style.fontSize = params.fontSize;
  // Com ruby, cada linha ganha a faixa do <rt>: line-height 2.2 (a mesma
  // regra de .withPinyin .sentence no CSS) para a medição bater com a página.
  measurer.style.lineHeight = withRuby ? '2.2' : params.lineHeight;

  const measure = (items: IndexedToken[]) => {
    if (withRuby) {
      // Com ruby ativo, as linhas ganham a altura do <rt>: mede com a
      // MESMA estrutura ruby usada na renderização.
      measurer.innerHTML = items.map((i) => rubyUnitsHtml(i.token, rubyMode)).join('');
    } else {
      measurer.textContent = items.map((i) => i.token.text).join('');
    }
    return measurer.offsetHeight;
  };

  const paragraphs = splitParagraphs(tokens);
  const lastTokenIdx = tokens.length - 1;
  const pages: Page[] = [];
  let pageParas: IndexedToken[][] = [];
  let pageHeight = 0;
  let pageStart = 0;

  const closePage = (nextIndex: number) => {
    pages.push({
      paragraphs: pageParas,
      startIndex: pageStart,
      nextIndex,
      isLast: nextIndex > lastTokenIdx,
    });
    pageParas = [];
    pageHeight = 0;
    pageStart = nextIndex;
  };

  for (const paragraph of paragraphs) {
    let rest = paragraph;
    while (rest.length) {
      let maxH = pages.length === 0 ? params.firstMax : params.otherMax;
      // Reserva espaço para o botão "Finalizar Reader" na última página.
      if (rest[rest.length - 1].idx === lastTokenIdx) maxH -= params.finishReserve;
      const avail = maxH - pageHeight;
      const fullH = measure(rest);
      if (fullH <= avail) {
        pageParas.push(rest);
        pageHeight += fullH + params.paragraphMargin;
        rest = [];
        break;
      }
      // Não coube inteiro: busca binária pelo maior prefixo que cabe.
      let lo = 0;
      let hi = rest.length - 1;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (measure(rest.slice(0, mid)) <= avail) lo = mid;
        else hi = mid - 1;
      }
      // Pontuação solta não abre a página seguinte.
      while (lo > 0 && lo < rest.length && isSpecialToken(rest[lo].token)) lo++;
      if (lo >= rest.length) {
        // Só sobrou pontuação além do corte: o parágrafo fica inteiro nesta
        // página (estouro de no máximo um caractere de pontuação).
        pageParas.push(rest);
        closePage(rest[rest.length - 1].idx + 1);
        rest = [];
        break;
      }
      const prefixH = lo > 0 ? measure(rest.slice(0, lo)) : 0;
      if (lo === 0 || prefixH <= params.twoLines) {
        // Fragmento pequeno demais: manda o parágrafo para a próxima página.
        if (pageParas.length === 0) {
          // Página vazia e mesmo assim não coube: força o parágrafo inteiro.
          pageParas.push(rest);
          pageHeight += fullH + params.paragraphMargin;
          rest = [];
          break;
        }
        closePage(rest[0].idx);
        continue;
      }
      pageParas.push(rest.slice(0, lo));
      closePage(rest[lo].idx);
      rest = rest.slice(lo);
    }
  }
  if (pageParas.length || !pages.length) {
    closePage(lastTokenIdx + 1);
  } else {
    pages[pages.length - 1].isLast = true;
  }
  return pages;
}

export function ReaderView({ readerId, title, level, lang = 'en' }: Props) {
  // Nível 9 = "Real Books" (livros autênticos, não-graded): rótulo próprio.
  const isRealBooks = level === 9;
  const levelLabel = isRealBooks ? 'Real Books' : `Nível ${level}`;
  const speechLang =
    lang === 'fr'
      ? 'fr-FR'
      : lang === 'zh'
        ? 'zh-CN'
        : lang === 'ru'
          ? 'ru-RU'
          : lang === 'ja'
            ? 'ja-JP'
            : lang === 'es'
              ? 'es-ES'
              : lang === 'it'
                ? 'it-IT'
                : 'en-US';
  // Idiomas com transliteração exibível acima do texto (modo ruby), como o
  // pinyin do mandarim: a romanização vive antes do " — " em translation.text.
  const hasTranslit = lang === 'zh' || lang === 'ru' || lang === 'ja';
  const translitLabel = lang === 'zh' ? 'Pīnyīn' : 'abc';
  const translitName = lang === 'zh' ? 'pinyin' : 'transliteração';
  // Modos de ruby disponíveis por idioma. O japonês alterna furigana (kana
  // sobre os kanji) / rōmaji / nada; os demais só ligam/desligam a translit.
  const rubyModes: RubyMode[] = useMemo(
    () =>
      lang === 'ja' ? ['furigana', 'romaji', 'off'] : hasTranslit ? ['translit', 'off'] : ['off'],
    [lang, hasTranslit]
  );
  const rubyLabel: Record<RubyMode, string> = {
    furigana: 'ふりがな',
    romaji: 'Rōmaji',
    translit: translitLabel,
    off: 'off',
  };
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [theme, setTheme] = useState<ThemeValue>('white');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [showButtons, setShowButtons] = useState(false);
  const [showToaster, setShowToaster] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [ellipsis, setEllipsis] = useState('...');
  const [showRestartOverlay, setShowRestartOverlay] = useState(false);
  const [speechAnimated, setSpeechAnimated] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // Transliteração acima do texto (mandarim/russo; persistido).
  const [rubyMode, setRubyMode] = useState<RubyMode>(rubyModes[0]);
  // Realce dos tokens com nota pedagógica (explanation): underline pontilhado
  // para o leitor achar falsos amigos/notas culturais sem passar o mouse em
  // tudo. Opt-in, persistido; vale para todos os idiomas. (default desligado)
  const [highlightNotes, setHighlightNotes] = useState(false);

  const measurerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const resumeIndexRef = useRef(0);
  const lastMouseRef = useRef(0);
  const currentStartRef = useRef(0);

  const page = pages?.[pageNum] ?? null;
  const isFirstPage = page?.startIndex === 0;
  const isLastPage = !!page?.isLast;
  const readingProgress = page && total ? (isFirstPage ? 0 : (page.nextIndex / total) * 100) : 0;
  const truncatedProgress = Math.trunc(readingProgress);

  // ---- Tema (persistido como no themeService original) ----
  useEffect(() => {
    const saved = localStorage.getItem(THEME_KEY) as ThemeValue | null;
    if (saved && THEMES.some((t) => t.value === saved)) setTheme(saved);
    if (hasTranslit) {
      const saved = localStorage.getItem(PINYIN_KEY);
      // Migra os valores antigos ('on'/'off') e aceita os modos nomeados.
      if (saved === 'on') setRubyMode(rubyModes[0]);
      else if (saved === 'off') setRubyMode('off');
      else if (saved && (rubyModes as string[]).includes(saved)) setRubyMode(saved as RubyMode);
    }
    if (localStorage.getItem(NOTES_KEY) === 'on') setHighlightNotes(true);
  }, [lang, hasTranslit, rubyModes]);
  const toggleNotes = () =>
    setHighlightNotes((v) => {
      const next = !v;
      localStorage.setItem(NOTES_KEY, next ? 'on' : 'off');
      return next;
    });
  const applyRubyMode = (mode: RubyMode) => {
    setRubyMode(mode);
    localStorage.setItem(PINYIN_KEY, mode);
    setTooltip(null);
  };
  // Toggle de duas posições (zh/ru): liga/desliga a translit.
  const toggleTranslit = () => applyRubyMode(rubyMode === 'off' ? rubyModes[0] : 'off');
  const changeTheme = (value: ThemeValue) => {
    setTheme(value);
    localStorage.setItem(THEME_KEY, value);
  };
  useEffect(() => {
    document.body.style.backgroundColor = THEMES.find((t) => t.value === theme)!.bodyBg;
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [theme]);

  // ---- Trava o scroll do body enquanto o modo leitura está aberto ----
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // ---- Carrega todos os tokens (resume dá a posição salva e o total) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const SIZE = 200;
      const resume = await fetch(`/api/reader/${readerId}/resume?size=1`).then((r) => r.json());
      if (cancelled) return;
      resumeIndexRef.current = resume.index ?? 0;
      const totalTokens: number = resume.total;
      const all: Token[] = [];
      while (all.length < totalTokens) {
        const d = await fetch(
          `/api/reader/${readerId}/sentences?index=${all.length}&size=${SIZE}`
        ).then((r) => r.json());
        if (cancelled) return;
        if (!d.sentences.length) break;
        all.push(...d.sentences);
      }
      setTotal(totalTokens);
      setTokens(all);
    })();
    return () => {
      cancelled = true;
    };
  }, [readerId]);

  // ---- Pagina após carregar (e re-pagina em resize) ----
  const withRuby = hasTranslit && rubyMode !== 'off';
  const repaginate = useCallback(
    (keepIndex: number) => {
      if (!tokens || !measurerRef.current) return;
      const built = paginate(tokens, measurerRef.current, withRuby ? rubyMode : 'off');
      setPages(built);
      const target = Math.max(
        0,
        built.findIndex((p) => keepIndex >= p.startIndex && keepIndex < p.nextIndex)
      );
      setPageNum(target);
      currentStartRef.current = built[target]?.startIndex ?? 0;
    },
    [tokens, withRuby, rubyMode]
  );

  const initializedRef = useRef(false);
  useEffect(() => {
    if (!tokens) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (cancelled) return;
      // 1ª paginação parte da posição salva; re-paginações (ex.: toggle de
      // pinyin) preservam a página atual.
      const keep = initializedRef.current ? currentStartRef.current : resumeIndexRef.current;
      repaginate(keep);
      if (!initializedRef.current && resumeIndexRef.current > 0) {
        setShowToaster(true);
        setTimeout(() => setShowToaster(false), 2500);
      }
      initializedRef.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [tokens, repaginate]);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 992);
      setTooltip(null);
      repaginate(currentStartRef.current);
    };
    setIsMobile(window.innerWidth < 992);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [repaginate]);

  // ---- Navegação ----
  const markPosition = useCallback(
    (position: number) => {
      fetch(`/api/reader/${readerId}/positions/${position}/read`, { method: 'PUT' }).catch(
        () => {}
      );
    },
    [readerId]
  );

  const goToPage = useCallback(
    (n: number) => {
      if (!pages || n < 0 || n >= pages.length) return;
      setTooltip(null);
      setPageNum(n);
      currentStartRef.current = pages[n].startIndex;
      markPosition(pages[n].startIndex);
    },
    [pages, markPosition]
  );

  const nextPage = useCallback(() => {
    if (pages && !pages[pageNum]?.isLast) goToPage(pageNum + 1);
  }, [pages, pageNum, goToPage]);

  const previousPage = useCallback(() => {
    if (pageNum > 0) goToPage(pageNum - 1);
  }, [pageNum, goToPage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      activateButtons();
      if (e.key === 'ArrowLeft') previousPage();
      else if (e.key === 'ArrowRight') nextPage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previousPage, nextPage]);

  // ---- Botões de paginação aparecem com o mouse e somem após 2s ----
  const activateButtons = () => {
    lastMouseRef.current = Date.now();
    setShowButtons(true);
  };
  useEffect(() => {
    const onMove = () => activateButtons();
    document.addEventListener('mousemove', onMove);
    const interval = setInterval(() => {
      if (Date.now() - lastMouseRef.current > 2000) setShowButtons(false);
    }, 1000);
    return () => {
      document.removeEventListener('mousemove', onMove);
      clearInterval(interval);
    };
  }, []);

  // ---- Swipe (mobile) ----
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    swipeRef.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!swipeRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - swipeRef.current.x;
    const dy = t.clientY - swipeRef.current.y;
    if (
      Date.now() - swipeRef.current.t < 1000 &&
      Math.abs(dx) > 30 &&
      Math.abs(dx) > Math.abs(dy * 3)
    ) {
      if (dx > 0) previousPage();
      else nextPage();
    }
  };

  // ---- Tooltip de tradução ----
  const showTranslation = (item: IndexedToken, e: React.MouseEvent) => {
    if (!item.token.translation) return;
    if (isMobile && tooltip) {
      setTooltip(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTooltip({
      idx: item.idx,
      left: isMobile ? 0 : rect.x,
      top: rect.bottom,
      anchorTop: rect.top,
      ready: false,
    });
  };

  useLayoutEffect(() => {
    if (!tooltip || tooltip.ready || !tooltipRef.current || !tokens) return;
    const box = tooltipRef.current.getBoundingClientRect();
    let top = tooltip.top;
    const overflowsBottom = box.bottom > window.innerHeight;
    if (overflowsBottom && box.top < box.height) top = 0;
    else if (overflowsBottom) top = Math.max(0, tooltip.anchorTop - box.height);
    setTooltip({ ...tooltip, top, ready: true });
  }, [tooltip, tokens]);

  const hideTranslation = () => setTooltip(null);

  // ---- Narração da frase (Web Speech API no lugar do endpoint de TTS) ----
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  useEffect(() => {
    if (!window.speechSynthesis) return;
    const base = speechLang.slice(0, 2);
    const exact = new RegExp(speechLang.replace('-', '[-_]'), 'i');
    const prefix = new RegExp(`^${base}`, 'i');
    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => exact.test(v.lang)) ||
        voices.find((v) => prefix.test(v.lang)) ||
        null;
    };
    pick();
    window.speechSynthesis.onvoiceschanged = pick;
    return () => window.speechSynthesis.cancel();
  }, [speechLang]);

  const speakCurrent = () => {
    if (!tooltip || !tokens || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(tokens[tooltip.idx].text);
    u.lang = speechLang;
    u.rate = 0.95;
    if (voiceRef.current) u.voice = voiceRef.current;
    const anim = setInterval(() => setSpeechAnimated((v) => !v), 300);
    u.onend = () => {
      clearInterval(anim);
      setSpeechAnimated(false);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  };

  // ---- Recomeçar / Finalizar ----
  const restartReading = () => {
    setShowRestartOverlay(false);
    markPosition(0);
    setTooltip(null);
    setPageNum(0);
    currentStartRef.current = 0;
  };
  const handleClickRestart = () => {
    if (isMobile) setShowRestartOverlay(true);
    else restartReading();
  };

  useEffect(() => {
    if (!isFinishing) return;
    const i = setInterval(() => {
      setEllipsis((e) => (e.length >= 3 ? '' : e + '.'));
    }, 500);
    return () => clearInterval(i);
  }, [isFinishing]);

  const finishBook = async () => {
    if (isFinishing || !tokens) return;
    setIsFinishing(true);
    try {
      // Mesmo fluxo do original: aplica as palavras lidas, finaliza e vai
      // para a tela de congratulation.
      await fetch(`/api/user/readTextsInfo/${readerId}`, { method: 'PUT' });
      await fetch(`/api/reader/${readerId}/finish`, { method: 'PUT' });
    } catch {
      /* mantém a navegação mesmo se falhar */
    }
    router.push(`/reading/${readerId}/congratulation`);
  };

  const exit = () => router.push('/library');

  const tooltipToken = tooltip && tokens ? tokens[tooltip.idx] : null;
  // Token "notável": tem ao menos uma tip com nota pedagógica (explanation).
  // Maior prioridade de nota pedagógica no token: 'high' | 'low' | null.
  // Uma explanation sem `priority` conta como 'high' (compat c/ livros antigos).
  const tokenNotePriority = (t: Token): 'high' | 'low' | null => {
    let low = false;
    for (const tip of t.translation?.tips ?? []) {
      if (!tip.explanation) continue;
      if (tip.priority !== 'low') return 'high';
      low = true;
    }
    return low ? 'low' : null;
  };

  return (
    <div className={`${styles.readingBackground} ${THEME_CLASS[theme]}`}>
      <div className={styles.readingHeaderBackground} />
      <header className={styles.readingHeader}>
        <div className={styles.headerLeft}>
          {page && isFirstPage ? (
            <a href="/library" className={styles.linkToHome}>
              <span className={styles.gradedText}>Graded</span>&nbsp;
              <span className={styles.readersText}>Readers</span>&nbsp;
              <span className={styles.byMvText}>by {brandingAuthor(lang, level)}</span>
            </a>
          ) : page ? (
            <button className={styles.goHomeBtn} onClick={exit}>
              <img src="/icons/play.svg" alt="" className={styles.arrowIcon} />
              <span className={styles.headerLevel}>
                {levelLabel}
                <span className={styles.headerSeparator}>•</span>
              </span>
              <span className={styles.headerTitle}>{title}</span>
            </button>
          ) : null}
        </div>
        <div className={styles.readerOptions}>
          <button
            className={`${styles.pinyinToggle} ${styles.notesToggle} ${
              highlightNotes ? styles.pinyinOn : ''
            }`}
            onClick={toggleNotes}
            title={`${highlightNotes ? 'Ocultar' : 'Realçar'} palavras com nota (falsos amigos, notas culturais, gramática)`}
          >
            Notas
          </button>
          {hasTranslit &&
            rubyModes
              .filter((m) => m !== 'off')
              .map((m) => {
                const name = m === 'translit' ? translitName : m === 'furigana' ? 'furigana' : 'rōmaji';
                const active = rubyMode === m;
                return (
                  <button
                    key={m}
                    className={`${styles.pinyinToggle} ${active ? styles.pinyinOn : ''}`}
                    onClick={() => applyRubyMode(active ? 'off' : m)}
                    title={`${active ? 'Ocultar' : 'Mostrar'} ${name}`}
                  >
                    {rubyLabel[m]}
                  </button>
                );
              })}
          <div className={styles.themeButtonContainer}>
            <img src="/icons/theme.svg" alt="" className={styles.themeIcon} />
            {THEMES.map((t) => (
              <button
                key={t.value}
                className={`${styles.themeButton} ${theme === t.value ? styles.selected : ''}`}
                style={{ backgroundColor: t.color }}
                onClick={() => changeTheme(t.value)}
              >
                <span className={styles.themeButtonTooltip}>{t.name}</span>
              </button>
            ))}
          </div>
          <div className={styles.exitReading} onClick={exit}>
            Sair do modo leitura
          </div>
        </div>
        <button
          className={styles.displayMenuButton}
          onClick={() => setIsMenuOpen((v) => !v)}
          aria-label="Opções"
        >
          <img src="/icons/three-dots.svg" alt="" className={styles.openMenuIcon} />
        </button>
      </header>

      {/* Menu de opções mobile (substitui os controles do header em < 720px) */}
      {isMenuOpen && (
        <>
          <div className={styles.menuBackdrop} onClick={() => setIsMenuOpen(false)} />
          <div className={styles.mobileOptionsMenu}>
            <div className={styles.menuUpperSection}>
              <div className={styles.menuReaderInfos}>
                <span className={styles.menuReader}>Reader&nbsp;</span>
                <span className={styles.menuLevel}>{levelLabel}</span>
                <br />
                <span className={styles.menuTitle}>{title}</span>
              </div>
              <div className={styles.menuHome} onClick={exit}>
                Home
              </div>
            </div>
            <div className={styles.menuThemeContainer}>
              <span className={styles.menuThemeLabel}>Tema</span>
              <div className={styles.menuThemeButtons}>
                {THEMES.map((t) => (
                  <button
                    key={t.value}
                    className={`${styles.menuThemeButton} ${
                      theme === t.value ? styles.selected : ''
                    }`}
                    style={{ backgroundColor: t.color }}
                    onClick={() => changeTheme(t.value)}
                  >
                    <span className={styles.menuThemeName}>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.menuThemeContainer}>
              <span className={styles.menuThemeLabel}>Notas</span>
              <div className={styles.menuThemeButtons}>
                <button
                  className={`${styles.menuPinyinButton} ${highlightNotes ? styles.selected : ''}`}
                  onClick={toggleNotes}
                >
                  {highlightNotes ? 'Ativado' : 'Desativado'}
                </button>
              </div>
            </div>
            {hasTranslit && (
              <div className={styles.menuThemeContainer}>
                <span className={styles.menuThemeLabel}>
                  {lang === 'zh' ? 'Pinyin' : lang === 'ja' ? 'Leitura' : 'Transliteração'}
                </span>
                <div className={styles.menuThemeButtons}>
                  {lang === 'ja' ? (
                    rubyModes.map((m) => (
                      <button
                        key={m}
                        className={`${styles.menuPinyinButton} ${rubyMode === m ? styles.selected : ''}`}
                        onClick={() => applyRubyMode(m)}
                      >
                        {m === 'off' ? 'Off' : rubyLabel[m]}
                      </button>
                    ))
                  ) : (
                    <button
                      className={`${styles.menuPinyinButton} ${rubyMode !== 'off' ? styles.selected : ''}`}
                      onClick={toggleTranslit}
                    >
                      {rubyMode !== 'off' ? 'Ativado' : 'Desativado'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className={styles.wrapper}>
        {page && tokens && (
          <div className={styles.readingContainer}>
            {showRestartOverlay && (
              <div className={styles.restartOverlay} onClick={() => setShowRestartOverlay(false)}>
                <p>Deseja recomeçar a leitura?</p>
                <button className={styles.overlayConfirm} onClick={restartReading}>
                  Sim, recomeçar
                </button>
                <button
                  className={styles.overlayCancel}
                  onClick={() => setShowRestartOverlay(false)}
                >
                  Não, continuar onde estou
                </button>
              </div>
            )}

            {isFirstPage && (
              <div className={styles.readerHeader}>
                <div className={styles.levelLabel}>
                  <div className={styles.levelLabelText}>{isRealBooks ? 'Real' : 'Nível'}</div>
                  <div className={styles.levelLabelNumber}>{isRealBooks ? 'Books' : level}</div>
                </div>
                <div className={styles.readerTitle}>
                  <div className={styles.readerTitleContent}>{title}</div>
                </div>
              </div>
            )}

            {showToaster && (
              <div className={styles.resumeToaster}>Continuando Reader de onde parou</div>
            )}

            <div
              className={`${styles.readingPage} ${isFirstPage ? styles.firstPage : ''} ${
                isLastPage ? styles.lastPage : ''
              } ${withRuby ? styles.withPinyin : ''}`}
              onClick={activateButtons}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {page.paragraphs.map((para, pi) => (
                <p key={pi} className={styles.paragraph}>
                  {para.map((item) => {
                    const notePr = highlightNotes ? tokenNotePriority(item.token) : null;
                    return (
                      <span
                        key={item.idx}
                        className={`${styles.sentence} ${
                          item.token.translation ? styles.translation : ''
                        } ${tooltip?.idx === item.idx ? styles.displayingTranslation : ''} ${
                          notePr === 'high'
                            ? styles.hasNoteHigh
                            : notePr === 'low'
                              ? styles.hasNoteLow
                              : ''
                        }`}
                        onClick={(e) => showTranslation(item, e)}
                      >
                        {renderRubyNode(item.token, withRuby ? rubyMode : 'off')}
                      </span>
                    );
                  })}
                </p>
              ))}

              {isLastPage && (
                <div className={styles.finishFooter}>
                  <button className={styles.btnFinishReader} onClick={finishBook}>
                    {isFinishing ? `Finalizando${ellipsis}` : 'Finalizar Reader'}
                  </button>
                </div>
              )}
            </div>

            <div className={styles.leftButtonBox} onClick={previousPage}>
              {!tooltip && showButtons && !isFirstPage && (
                <div className={styles.previousPageButtonBox}>
                  <img src="/icons/play.svg" alt="" className={styles.previousPageButton} />
                </div>
              )}
            </div>
            <div className={styles.rightButtonBox} onClick={nextPage}>
              {!tooltip && showButtons && !isLastPage && (
                <div className={styles.nextPageButtonBox}>
                  <img src="/icons/play.svg" alt="" className={styles.nextPageButton} />
                </div>
              )}
            </div>

            {tooltipToken?.translation && (
              <div
                ref={tooltipRef}
                className={`${styles.translationTooltip} ${
                  tooltip!.ready ? '' : styles.tooltipLoading
                }`}
                style={{ left: tooltip!.left, top: tooltip!.top }}
              >
                <button className={styles.speechButton} onClick={speakCurrent}>
                  <img
                    src={speechAnimated ? '/icons/volume-30.svg' : '/icons/volume-60.svg'}
                    alt="speaker icon"
                  />
                </button>
                <span className={styles.portugueseText}>{tooltipToken.translation.text}</span>
                <button className={styles.tooltipCloseButton} onClick={hideTranslation}>
                  <img src="/icons/close.svg" alt="" />
                </button>
                {tooltipToken.translation.tips.map((tip, i) => (
                  <div key={i} className={styles.tip}>
                    <span className={styles.tipEnglish}>
                      <span className={styles.tipArrow}>&nbsp;</span>
                      {tip.text}
                    </span>
                    <span className={styles.tipSeparator}>|</span>
                    <span className={styles.tipPortuguese}>{tip.translatedText}</span>
                    {tip.explanation && <p className={styles.tipExplanation}>{tip.explanation}</p>}
                  </div>
                ))}
              </div>
            )}

            <div className={styles.readingProgress}>
              <div style={{ width: `${readingProgress}%` }}>&nbsp;</div>
            </div>

            <div className={`${styles.pageInfo} ${isLastPage ? styles.lastPageInfo : ''}`}>
              <span className={isLastPage ? styles.lastPageNumber : ''}>
                {truncatedProgress}%{' '}
              </span>
              {!isFirstPage && (
                <>
                  <i className={styles.dot} />
                  <button className={styles.restart} onClick={handleClickRestart}>
                    Recomeçar leitura
                  </button>
                </>
              )}
            </div>

            {/* Setas fixas da barra inferior (somente mobile) */}
            {!isFirstPage && (
              <div className={styles.mobilePrevButtonBox} onClick={previousPage}>
                <img src="/icons/play.svg" alt="" className={styles.mobilePrevButton} />
              </div>
            )}
            {!isLastPage && (
              <div className={styles.mobileNextButtonBox} onClick={nextPage}>
                <img src="/icons/play.svg" alt="" className={styles.mobileNextButton} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Medidor oculto usado pela paginação */}
      <div ref={measurerRef} className={styles.measurer} aria-hidden />
    </div>
  );
}
