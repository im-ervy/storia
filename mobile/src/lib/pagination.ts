// Paginação por medição para o modo leitura (porta do paginate() do ReaderView
// web). No RN medimos a quebra de linhas via onTextLayout (texto base, sem
// ruby) e empacotamos as linhas em páginas pela altura disponível — o mesmo
// princípio do medidor oculto + busca binária do desktop.
import type { Token } from './types';

export interface ITok {
  token: Token;
  idx: number;
}

export interface Page {
  // Cada parágrafo da página: suas linhas (grupos de tokens) e os tokens
  // achatados (para renderização justificada quando não há ruby).
  paragraphs: { lines: ITok[][]; tokens: ITok[] }[];
  startIndex: number;
  nextIndex: number;
  isLast: boolean;
}

// Divide os tokens em parágrafos (token.newLine abre um parágrafo novo).
export function splitParagraphs(tokens: Token[]): ITok[][] {
  const out: ITok[][] = [];
  let cur: ITok[] = [];
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

// Texto base de um parágrafo (concatenação dos tokens) — o que medimos.
export function paragraphText(para: ITok[]): string {
  return para.map((it) => it.token.text).join('');
}

// A partir dos textos de cada linha medida (onTextLayout), agrupa os tokens do
// parágrafo por linha. Cada token entra na linha onde começa seu 1º caractere.
export function buildLineGroups(para: ITok[], lineTexts: string[]): ITok[][] {
  if (!lineTexts.length) return [para];
  const bounds: number[] = [];
  let acc = 0;
  for (const lt of lineTexts) {
    acc += lt.length;
    bounds.push(acc);
  }
  const groups: ITok[][] = lineTexts.map(() => []);
  let charPos = 0;
  let line = 0;
  for (const it of para) {
    while (line < bounds.length - 1 && charPos >= bounds[line]) line++;
    groups[line].push(it);
    charPos += it.token.text.length;
  }
  return groups.filter((g) => g.length);
}

// Fallback quando a medição nativa (onTextLayout) não completa: estima as
// quebras de linha por contagem de caracteres (~charsPerLine por linha),
// fatiando o texto do parágrafo. Evita o reader ficar em branco.
export function estimateLineTexts(text: string, charsPerLine: number): string[] {
  const per = Math.max(1, charsPerLine);
  const n = Math.max(1, Math.ceil(text.length / per));
  if (n <= 1) return [text];
  const size = Math.ceil(text.length / n);
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

export interface PaginateOpts {
  firstHeight: number;
  otherHeight: number;
  lineHeight: number;
  paragraphMargin: number;
  finishReserve: number;
  lastTokenIdx: number;
  minLines: number; // fragmentos menores que isto vão para a página seguinte
}

// Empacota as linhas dos parágrafos em páginas pela altura disponível.
export function paginate(paraLines: ITok[][][], opts: PaginateOpts): Page[] {
  const { lineHeight, paragraphMargin, finishReserve, lastTokenIdx, minLines } = opts;
  const pages: Page[] = [];
  let pageParas: { lines: ITok[][]; tokens: ITok[] }[] = [];
  let pageHeight = 0;

  const pushFragment = (lines: ITok[][]) => {
    pageParas.push({ lines, tokens: lines.flat() });
  };
  const closePage = () => {
    if (!pageParas.length) return;
    pages.push({ paragraphs: pageParas, startIndex: 0, nextIndex: 0, isLast: false });
    pageParas = [];
    pageHeight = 0;
  };
  const avail = () => (pages.length === 0 ? opts.firstHeight : opts.otherHeight);

  for (const lines of paraLines) {
    let rest = lines;
    while (rest.length) {
      const endsWithLast = rest[rest.length - 1].some((it) => it.idx === lastTokenIdx);
      const reserve = endsWithLast ? finishReserve : 0;
      const availH = avail() - pageHeight - reserve;
      const fullH = rest.length * lineHeight;
      if (fullH <= availH) {
        pushFragment(rest);
        pageHeight += fullH + paragraphMargin;
        rest = [];
        break;
      }
      let fit = Math.floor(availH / lineHeight);
      if (fit < minLines && pageParas.length) {
        closePage();
        continue;
      }
      if (fit <= 0) fit = pageParas.length ? 0 : 1; // página vazia força 1 linha
      if (fit <= 0) {
        closePage();
        continue;
      }
      pushFragment(rest.slice(0, fit));
      pageHeight += fit * lineHeight + paragraphMargin;
      closePage();
      rest = rest.slice(fit);
    }
  }
  closePage();
  if (!pages.length) {
    pages.push({ paragraphs: [], startIndex: 0, nextIndex: lastTokenIdx + 1, isLast: true });
  }

  // Índices de início/fim de cada página (start = 1º token; next = start da
  // página seguinte) e marcação da última.
  for (let i = 0; i < pages.length; i++) {
    const first = pages[i].paragraphs[0]?.tokens[0]?.idx ?? 0;
    pages[i].startIndex = first;
  }
  for (let i = 0; i < pages.length; i++) {
    pages[i].nextIndex = pages[i + 1]?.startIndex ?? lastTokenIdx + 1;
    pages[i].isLast = i === pages.length - 1;
  }
  return pages;
}
