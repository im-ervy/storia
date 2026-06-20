// Modo leitura — porta do ReaderView web. Paginação por medição (onTextLayout),
// tap-to-translate com tooltip + tips, ruby/furigana acima do texto, narração
// (expo-speech), swipe, três temas e o fluxo de finalização.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type TextLayoutEventData,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { Token } from '@/lib/types';
import { getContent } from '@/lib/content';
import { getReader, markRead, finishReader } from '@/lib/data';
import { getProgress } from '@/lib/store';
import {
  splitParagraphs,
  paragraphText,
  buildLineGroups,
  paginate,
  estimateLineTexts,
  type ITok,
  type Page,
} from '@/lib/pagination';
import { hasTranslitFor, rubyModesFor, readingOf, RUBY_LABEL, type RubyMode } from '@/lib/ruby';
import { speak, stopSpeaking } from '@/lib/tts';
import { speechLangOf, THEME_KEY, PINYIN_KEY, NOTES_KEY, getPref, setPref } from '@/lib/prefs';
import { READING_THEMES, READING_THEME_LIST, type ThemeValue, type ReadingTheme } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

const H_PAD = 22; // padding horizontal da coluna de texto
const PAGE_PAD_V = 18;
const READER_HEADER_H = 132;
const FOOTER_H = 96;
const FINISH_RESERVE = 96;

export default function ReaderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const readerId = Number(id);
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const reader = useMemo(() => getReader(readerId), [readerId]);
  const lang = reader?.lang ?? 'en';
  const level = reader?.level ?? 1;
  const isRealBooks = level === 9;
  const title = reader?.title ?? '';
  const speechLang = speechLangOf(lang);
  const hasTranslit = hasTranslitFor(lang);
  const rubyModes = useMemo(() => rubyModesFor(lang), [lang]);

  const fontSize = width < 360 ? 17 : 19;
  const lineHeightOff = Math.round(fontSize * 1.58);
  const lineHeightRuby = Math.round(fontSize * 2.05);

  const [tokens, setTokens] = useState<Token[] | null>(null);
  const [total, setTotal] = useState(0);
  const [theme, setTheme] = useState<ThemeValue>('white');
  const [rubyMode, setRubyMode] = useState<RubyMode>('off');
  // Realce dos tokens com nota pedagógica (explanation): underline para achar
  // falsos amigos/notas culturais sem tocar em tudo. Opt-in, persistido.
  const [highlightNotes, setHighlightNotes] = useState(false);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [pageNum, setPageNum] = useState(0);
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null);
  const [bodyH, setBodyH] = useState(0);
  // Y (relativo ao topo do corpo) do token tocado — usado para fazer o tooltip
  // flutuar sob/sobre o token. null = ainda sem âncora (cai p/ rodapé).
  const [tooltipY, setTooltipY] = useState<number | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const resumeIndexRef = useRef(0);
  const currentStartRef = useRef(0);
  const swipeRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // View do corpo + seu topo absoluto (pageY) — para converter a coordenada do
  // toque (pageY) em coordenada relativa ao corpo, onde o tooltip é ancorado.
  const bodyRef = useRef<View | null>(null);
  const bodyTopRef = useRef(0);
  // Último toque dentro do corpo (pageY), capturado em onTouchStart; serve de
  // fallback quando o onPress do token não traz o evento.
  const lastTouchYRef = useRef<number | null>(null);

  const th: ReadingTheme = READING_THEMES[theme];
  const withRuby = hasTranslit && rubyMode !== 'off';
  const lineHeight = withRuby ? lineHeightRuby : lineHeightOff;

  // ---- Preferências persistidas (tema + ruby) ----
  useEffect(() => {
    (async () => {
      const savedTheme = (await getPref(THEME_KEY)) as ThemeValue | null;
      if (savedTheme && READING_THEMES[savedTheme]) setTheme(savedTheme);
      if (hasTranslit) {
        const saved = await getPref(PINYIN_KEY);
        if (saved === 'on') setRubyMode(rubyModes[0]);
        else if (saved && (rubyModes as string[]).includes(saved)) setRubyMode(saved as RubyMode);
      }
      if ((await getPref(NOTES_KEY)) === 'on') setHighlightNotes(true);
    })();
  }, [hasTranslit, rubyModes]);

  // ---- Carrega tokens + posição salva ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const content = await getContent(readerId);
      if (cancelled) return;
      const p = getProgress(readerId);
      resumeIndexRef.current = p
        ? Math.min(p.position, Math.max(0, content.tokens.length - 1))
        : 0;
      setTotal(content.total);
      setTokens(content.tokens);
    })();
    return () => {
      cancelled = true;
      stopSpeaking();
    };
  }, [readerId]);

  // ---- Medição das quebras de linha (texto base, independente do ruby) ----
  const paragraphs = useMemo(() => (tokens ? splitParagraphs(tokens) : []), [tokens]);
  const columnWidth = Math.max(80, width - H_PAD * 2);
  // A chave inclui a contagem de parágrafos para reinicializar o coletor quando
  // o conteúdo carrega ou a largura muda.
  const measureKey = `${columnWidth}|${fontSize}|${paragraphs.length}`;
  const [lineTexts, setLineTexts] = useState<{ key: string; paras: string[][] } | null>(null);
  const [measureNonce, setMeasureNonce] = useState(0);
  const measureRef = useRef<{ key: string; lines: (string[] | null)[] }>({ key: '', lines: [] });

  // Inicializa o coletor DURANTE o render (antes de onTextLayout disparar). Isso
  // corrige a corrida em que o evento de medição chegava antes de um useEffect
  // setar o coletor — os eventos eram descartados e o reader ficava em branco.
  if (measureRef.current.key !== measureKey) {
    measureRef.current = { key: measureKey, lines: new Array(paragraphs.length).fill(null) };
  }
  const measured = lineTexts !== null && lineTexts.key === measureKey;
  const needMeasure = paragraphs.length > 0 && !measured;

  const onParaLayout = (i: number, e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const m = measureRef.current;
    if (m.key !== measureKey || m.lines[i] != null) return;
    m.lines[i] = e.nativeEvent.lines.map((l) => l.text);
    if (m.lines.every((x) => x != null)) {
      setLineTexts({ key: m.key, paras: m.lines as string[][] });
    }
  };

  // Watchdog: se algum onTextLayout não disparou, remonta a camada de medição
  // (novo measureNonce) para re-emitir os eventos pendentes; após algumas
  // tentativas, cai para uma estimativa por caracteres (nunca fica em branco).
  const MEASURE_RETRIES = 4;
  useEffect(() => {
    if (!needMeasure) return;
    if (measureNonce >= MEASURE_RETRIES) {
      const charsPerLine = Math.max(8, Math.floor(columnWidth / (fontSize * 0.52)));
      setLineTexts({
        key: measureKey,
        paras: paragraphs.map((p) => estimateLineTexts(paragraphText(p), charsPerLine)),
      });
      return;
    }
    const t = setTimeout(() => setMeasureNonce((n) => n + 1), 800);
    return () => clearTimeout(t);
  }, [needMeasure, measureNonce, measureKey, columnWidth, fontSize, paragraphs]);

  // ---- Paginação (quando medição + altura do corpo prontas) ----
  useEffect(() => {
    if (!tokens || !lineTexts || lineTexts.key !== measureKey || !bodyH) return;
    const paraLines = paragraphs.map((para, i) => buildLineGroups(para, lineTexts.paras[i]));
    const otherHeight = bodyH - PAGE_PAD_V * 2;
    const firstHeight = otherHeight - READER_HEADER_H;
    const built = paginate(paraLines, {
      firstHeight: Math.max(lineHeight * 3, firstHeight),
      otherHeight: Math.max(lineHeight * 4, otherHeight),
      lineHeight,
      paragraphMargin: Math.round(fontSize * 0.9),
      finishReserve: FINISH_RESERVE,
      lastTokenIdx: tokens.length - 1,
      minLines: 2,
    });
    setPages(built);
    const keep = currentStartRef.current || resumeIndexRef.current;
    const target = Math.max(
      0,
      built.findIndex((p) => keep >= p.startIndex && keep < p.nextIndex)
    );
    setPageNum(target);
    currentStartRef.current = built[target]?.startIndex ?? 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens, lineTexts, measureKey, bodyH, lineHeight, fontSize]);

  const page = pages?.[pageNum] ?? null;
  const isFirstPage = page?.startIndex === 0;
  const isLastPage = !!page?.isLast;
  const readingProgress =
    page && total ? (isFirstPage ? 0 : (page.nextIndex / total) * 100) : 0;

  // ---- Navegação ----
  const goToPage = useCallback(
    (n: number) => {
      if (!pages || n < 0 || n >= pages.length) return;
      setTooltipIdx(null);
      stopSpeaking();
      setPageNum(n);
      currentStartRef.current = pages[n].startIndex;
      void markRead(readerId, pages[n].startIndex);
    },
    [pages, readerId]
  );
  const nextPage = useCallback(() => {
    if (pages && !pages[pageNum]?.isLast) goToPage(pageNum + 1);
  }, [pages, pageNum, goToPage]);
  const prevPage = useCallback(() => {
    if (pageNum > 0) goToPage(pageNum - 1);
  }, [pageNum, goToPage]);

  // ---- Swipe ----
  const onTouchStart = (e: { nativeEvent: { pageX: number; pageY: number } }) => {
    swipeRef.current = {
      x: e.nativeEvent.pageX,
      y: e.nativeEvent.pageY,
      t: Date.now(),
    };
    lastTouchYRef.current = e.nativeEvent.pageY;
  };
  const onTouchEnd = (e: { nativeEvent: { pageX: number; pageY: number } }) => {
    const s = swipeRef.current;
    if (!s) return;
    const dx = e.nativeEvent.pageX - s.x;
    const dy = e.nativeEvent.pageY - s.y;
    if (Date.now() - s.t < 1000 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 2) {
      if (dx > 0) prevPage();
      else nextPage();
    }
  };

  // ---- Tooltip / narração ----
  const tooltipToken = tooltipIdx != null && tokens ? tokens[tooltipIdx] : null;
  const onTapToken = (it: ITok, e?: GestureResponderEvent) => {
    if (!it.token.translation) {
      setTooltipIdx(null);
      return;
    }
    // Âncora vertical: converte o pageY do toque em Y relativo ao topo do corpo.
    // Preferimos o pageY do próprio onPress; se ausente, o último onTouchStart.
    const pageY = e?.nativeEvent?.pageY ?? lastTouchYRef.current;
    if (pageY != null) setTooltipY(Math.max(0, pageY - bodyTopRef.current));
    setTooltipIdx((cur) => (cur === it.idx ? null : it.idx));
  };
  const speakTooltip = () => {
    if (!tooltipToken) return;
    setSpeaking(true);
    speak(tooltipToken.text, speechLang, () => setSpeaking(false));
  };

  const changeTheme = (value: ThemeValue) => {
    setTheme(value);
    void setPref(THEME_KEY, value);
  };
  const applyRuby = (mode: RubyMode) => {
    setRubyMode(mode);
    void setPref(PINYIN_KEY, mode);
    setTooltipIdx(null);
  };
  const toggleNotes = () => {
    setHighlightNotes((v) => {
      const next = !v;
      void setPref(NOTES_KEY, next ? 'on' : 'off');
      return next;
    });
  };
  // Token "notável": tem ao menos uma tip com nota pedagógica (explanation).
  const tokenHasNote = (t: Token) => !!t.translation?.tips.some((tip) => tip.explanation);

  const finishBook = async () => {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await finishReader(readerId);
    } catch {
      /* navega mesmo se falhar */
    }
    router.replace(`/reading/${readerId}/congratulation`);
  };

  const exit = () => router.replace('/library');

  // ---- Render de um token (com ou sem ruby) ----
  const renderInlineToken = (it: ITok) => {
    const selected = tooltipIdx === it.idx;
    const tappable = !!it.token.translation;
    const noted = highlightNotes && tokenHasNote(it.token);
    return (
      <Text
        key={it.idx}
        onPress={tappable ? (e) => onTapToken(it, e) : undefined}
        style={[
          { color: th.text, fontFamily: fonts.body },
          noted && {
            textDecorationLine: 'underline',
            textDecorationStyle: 'dotted',
            textDecorationColor: th.noteUnderline,
          },
          selected && { color: th.highlightText, backgroundColor: th.highlight },
        ]}
      >
        {it.token.text}
      </Text>
    );
  };

  const renderRubyCell = (it: ITok) => {
    const selected = tooltipIdx === it.idx;
    const reading = readingOf(it.token, rubyMode);
    const tappable = !!it.token.translation;
    const noted = highlightNotes && tokenHasNote(it.token);
    return (
      <Pressable key={it.idx} onPress={tappable ? (e) => onTapToken(it, e) : undefined}>
        <View style={[styles.rubyCell, selected && { backgroundColor: th.highlight }]}>
          <Text style={[styles.rubyReading, { color: th.rubyText, fontSize: fontSize * 0.5, fontFamily: fonts.body }]}>
            {reading ?? ' '}
          </Text>
          <Text
            style={[
              { fontSize, lineHeight: fontSize * 1.1, color: selected ? th.highlightText : th.text, fontFamily: fonts.body },
              noted && {
                textDecorationLine: 'underline',
                textDecorationStyle: 'dotted',
                textDecorationColor: th.noteUnderline,
              },
            ]}
          >
            {it.token.text}
          </Text>
        </View>
      </Pressable>
    );
  };

  // ---- Posição flutuante do tooltip (sob/sobre o token tocado) ----
  // Ancoramos na coordenada vertical do toque (não medimos cada token inline —
  // eles são <Text> aninhados e não dá measureInWindow individual com segurança).
  // Abaixo do token por padrão; se o toque cair na metade inferior do corpo
  // (> ~55%), invertemos para aparecer ACIMA, evitando sair da tela. O top é
  // limitado (clamp) entre uma margem mínima e bodyH menos a altura estimada.
  const TOOLTIP_EST_H = Math.min(280, bodyH ? bodyH * 0.6 : 280);
  const TOUCH_GAP = 18; // distância entre o token e a borda do tooltip
  const tooltipPos = (() => {
    // Sem âncora ou corpo ainda não medido: mantém o comportamento antigo (rodapé).
    if (tooltipY == null || !bodyH) return { bottom: 10 as number };
    const flipUp = tooltipY > bodyH * 0.55;
    let top = flipUp ? tooltipY - TOUCH_GAP - TOOLTIP_EST_H : tooltipY + TOUCH_GAP;
    const minTop = 8;
    const maxTop = Math.max(minTop, bodyH - TOOLTIP_EST_H - 8);
    top = Math.min(maxTop, Math.max(minTop, top));
    return { top, maxHeight: TOOLTIP_EST_H };
  })();

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: th.bodyBg }]} edges={['top', 'bottom']}>
      {/* ---- Barra superior ---- */}
      <View style={[styles.topBar, { backgroundColor: th.pageBg, borderBottomColor: th.bodyBg }]}>
        <Pressable onPress={exit} hitSlop={8} style={styles.topBack}>
          <Ionicons name="chevron-back" size={22} color={th.text} />
        </Pressable>
        <View style={styles.topCenter}>
          <Text style={[styles.topLevel, { color: th.pageInfo }]} numberOfLines={1}>
            {isRealBooks ? 'Real Books' : `Nível ${level}`} •{' '}
            <Text style={[styles.topTitle, { color: th.text }]}>{title}</Text>
          </Text>
        </View>
        <View style={styles.topRight}>
          <Pressable
            onPress={toggleNotes}
            style={[styles.rubyToggle, highlightNotes && styles.rubyToggleOn]}
          >
            <Text
              style={[
                styles.rubyToggleText,
                styles.notesToggleText,
                highlightNotes && styles.rubyToggleTextOn,
              ]}
            >
              Notas
            </Text>
          </Pressable>
          {hasTranslit &&
            rubyModes
              .filter((m) => m !== 'off')
              .map((m) => {
                const active = rubyMode === m;
                return (
                  <Pressable
                    key={m}
                    onPress={() => applyRuby(active ? 'off' : m)}
                    style={[styles.rubyToggle, active && styles.rubyToggleOn]}
                  >
                    <Text style={[styles.rubyToggleText, active && styles.rubyToggleTextOn]}>
                      {RUBY_LABEL[m]}
                    </Text>
                  </Pressable>
                );
              })}
          {READING_THEME_LIST.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => changeTheme(t.value)}
              style={[
                styles.swatch,
                { backgroundColor: t.swatch },
                theme === t.value && styles.swatchSelected,
              ]}
            />
          ))}
        </View>
      </View>

      {/* ---- Corpo (página) ---- */}
      <View
        ref={bodyRef}
        style={[styles.body, { backgroundColor: th.pageBg }]}
        onLayout={(e: LayoutChangeEvent) => {
          setBodyH(e.nativeEvent.layout.height);
          // Mede o topo absoluto do corpo (pageY) para converter o toque em
          // coordenada relativa ao ancorar o tooltip.
          bodyRef.current?.measureInWindow((_x, y) => {
            bodyTopRef.current = y;
          });
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {!page && <View style={styles.loading} />}

        {page && (
          <ScrollView
            style={styles.pageScroll}
            contentContainerStyle={{ paddingHorizontal: H_PAD, paddingVertical: PAGE_PAD_V }}
            scrollEnabled
          >
            {isFirstPage && (
              <View style={styles.readerHeader}>
                <View style={[styles.levelBadge, { backgroundColor: th.levelLabelBg }]}>
                  <Text style={[styles.levelBadgeText, { color: th.levelLabelText }]}>
                    {isRealBooks ? 'Real' : 'Nível'}
                  </Text>
                  <Text style={[styles.levelBadgeNum, { color: th.levelLabelText }]}>
                    {isRealBooks ? 'Books' : level}
                  </Text>
                </View>
                <Text style={[styles.readerTitle, { color: th.readerTitle }]}>{title}</Text>
              </View>
            )}

            {page.paragraphs.map((para, pi) =>
              withRuby ? (
                <View key={pi} style={{ marginBottom: Math.round(fontSize * 0.9) }}>
                  {para.lines.map((line, li) => (
                    <View key={li} style={styles.rubyLine}>
                      {line.map(renderRubyCell)}
                    </View>
                  ))}
                </View>
              ) : (
                <Text
                  key={pi}
                  style={[
                    styles.paragraph,
                    { fontSize, lineHeight: lineHeightOff, marginBottom: Math.round(fontSize * 0.9) },
                  ]}
                >
                  {para.tokens.map(renderInlineToken)}
                </Text>
              )
            )}

            {isLastPage && (
              <Pressable
                style={styles.finishBtn}
                onPress={finishBook}
                disabled={isFinishing}
              >
                <Text style={styles.finishBtnText}>
                  {isFinishing ? 'Finalizando...' : 'Finalizar Reader'}
                </Text>
              </Pressable>
            )}
          </ScrollView>
        )}

        {/* ---- Tooltip de tradução (flutua sob/sobre o token tocado) ---- */}
        {tooltipToken?.translation && (
          <View
            style={[
              styles.tooltip,
              { backgroundColor: th.tooltipBg, borderColor: th.tooltipBorder },
              tooltipPos,
            ]}
          >
            <View style={styles.tooltipHead}>
              <Pressable onPress={speakTooltip} hitSlop={8}>
                <Ionicons
                  name={speaking ? 'volume-high' : 'volume-medium'}
                  size={22}
                  color={th.tipEnglish}
                />
              </Pressable>
              <Text style={[styles.tooltipPt, { color: th.portText }]}>
                {tooltipToken.translation.text}
              </Text>
              <Pressable onPress={() => setTooltipIdx(null)} hitSlop={8}>
                <Ionicons name="close" size={20} color={th.pageInfo} />
              </Pressable>
            </View>
            <ScrollView style={styles.tooltipTips}>
              {tooltipToken.translation.tips.map((tip, i) => (
                <View key={i} style={styles.tip}>
                  <Text style={styles.tipLine}>
                    <Text style={[styles.tipEn, { color: th.tipEnglish }]}>{tip.text}</Text>
                    <Text style={[styles.tipSep, { color: th.tipSeparator }]}> | </Text>
                    <Text style={[styles.tipPt, { color: th.tipPortuguese }]}>
                      {tip.translatedText}
                    </Text>
                  </Text>
                  {tip.explanation && (
                    <Text style={[styles.tipExpl, { color: th.tipExplanation }]}>
                      {tip.explanation}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ---- Rodapé: progresso + navegação ---- */}
      <View style={[styles.footer, { backgroundColor: th.pageBg }]}>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${readingProgress}%`, backgroundColor: th.progress }]}
          />
        </View>
        <View style={styles.footerRow}>
          <Pressable onPress={prevPage} disabled={isFirstPage} hitSlop={8} style={styles.navBtn}>
            <Ionicons
              name="chevron-back"
              size={26}
              color={isFirstPage ? th.tooltipBorder : th.text}
            />
          </Pressable>
          <Text style={[styles.pageInfo, { color: th.pageInfo }]}>
            {Math.trunc(readingProgress)}%
          </Text>
          <Pressable onPress={nextPage} disabled={isLastPage} hitSlop={8} style={styles.navBtn}>
            <Ionicons
              name="chevron-forward"
              size={26}
              color={isLastPage ? th.tooltipBorder : th.text}
            />
          </Pressable>
        </View>
      </View>

      {/* ---- Camada oculta de medição (texto base) ---- */}
      {needMeasure && columnWidth > 0 && (
        <View style={styles.measureLayer} pointerEvents="none">
          {paragraphs.map((para, i) => (
            <Text
              key={`${measureNonce}-${i}`}
              // Mesma família do parágrafo renderizado (fonts.body) — a medição
              // de quebra de linha precisa casar com a fonte real, senão a
              // paginação fica imprecisa.
              style={{ width: columnWidth, fontSize, lineHeight: lineHeightOff, fontFamily: fonts.body }}
              onTextLayout={(e) => onParaLayout(i, e)}
            >
              {paragraphText(para)}
            </Text>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 4,
    gap: 8,
  },
  topBack: { padding: 2 },
  topCenter: { flex: 1 },
  topLevel: { fontSize: 11, fontWeight: '600', fontFamily: fonts.condensedSemibold },
  topTitle: { fontSize: 12, fontWeight: '700', fontFamily: fonts.condensedBold },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rubyToggle: {
    borderWidth: 1,
    borderColor: '#a9c0c7',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 1,
  },
  rubyToggleOn: { backgroundColor: '#36c2dc', borderColor: '#36c2dc' },
  rubyToggleText: { fontSize: 10, fontWeight: '700', color: '#a9c0c7', fontFamily: fonts.condensedBold },
  rubyToggleTextOn: { color: '#fff' },
  notesToggleText: { textDecorationLine: 'underline', textDecorationStyle: 'dotted' },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cfdee1',
  },
  swatchSelected: { borderWidth: 2, borderColor: '#36c2dc' },
  body: { flex: 1, position: 'relative' },
  loading: { flex: 1 },
  pageScroll: { flex: 1 },
  readerHeader: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 28, gap: 16 },
  levelBadge: {
    width: 56,
    height: 92,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 12,
  },
  levelBadgeText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', fontFamily: fonts.condensedBold },
  levelBadgeNum: { fontSize: 20, fontWeight: '700', fontFamily: fonts.condensedBold },
  readerTitle: { flex: 1, fontSize: 34, fontWeight: '700', lineHeight: 34, fontFamily: fonts.condensedBold },
  paragraph: { textAlign: 'justify', fontFamily: fonts.body },
  rubyLine: { flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'flex-end' },
  rubyCell: { alignItems: 'center', paddingHorizontal: 0.5 },
  rubyReading: { textAlign: 'center', opacity: 0.7 },
  finishBtn: {
    alignSelf: 'center',
    marginTop: 18,
    marginBottom: 8,
    width: 300,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#72b923',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: { color: '#fff', fontSize: 24, fontWeight: '700', textTransform: 'uppercase', fontFamily: fonts.condensedBold },
  tooltip: {
    position: 'absolute',
    // Centralizado horizontalmente, largura limitada (popover), com margens.
    alignSelf: 'center',
    left: 10,
    right: 10,
    maxWidth: 340,
    maxHeight: 280,
    borderWidth: 2,
    borderRadius: 4,
    padding: 16,
    shadowColor: '#277988',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    // Garante que o tooltip fique SOBRE a página.
    zIndex: 50,
    elevation: 10,
  },
  tooltipHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tooltipPt: { flex: 1, fontSize: 18, fontWeight: '700', fontFamily: fonts.bodyBold },
  tooltipTips: { marginTop: 8 },
  tip: { marginVertical: 6 },
  tipLine: { flexWrap: 'wrap' },
  tipEn: { fontSize: 16, fontWeight: '700', fontFamily: fonts.bodyBold },
  tipSep: { fontSize: 16, fontFamily: fonts.body },
  tipPt: { fontSize: 16, fontWeight: '700', fontFamily: fonts.bodyBold },
  tipExpl: { fontSize: 13, lineHeight: 19, marginTop: 3, marginLeft: 6, fontFamily: fonts.body },
  footer: { height: FOOTER_H, justifyContent: 'flex-start' },
  progressTrack: { height: 5, backgroundColor: 'transparent' },
  progressFill: { height: 5 },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingVertical: 16,
  },
  navBtn: { padding: 6 },
  pageInfo: { fontSize: 14, fontWeight: '600', fontFamily: fonts.condensedSemibold },
  measureLayer: { position: 'absolute', left: 0, top: 0, opacity: 0, zIndex: -1 },
});
