// Gera furigana (leitura em hiragana acima APENAS dos kanji) para tokens de
// japonês, usando o kuromoji (dicionário IPADIC) + um "fitting" de okurigana
// que distribui a leitura sobre os trechos de kanji, deixando o kana intacto.
//
// Saída por token: `furigana` = array de segmentos { t, r? }. `t` é o trecho
// do texto; `r` (hiragana) só existe nos trechos de kanji. A concatenação dos
// `t` reproduz token.text exatamente (invariante lossless validado no assemble).
import kuromoji from 'kuromoji';
import { join } from 'node:path';

const KATA_RE = /[ァ-ヶ]/g;
const toHira = (s) =>
  s.replace(KATA_RE, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));

const isKanji = (ch) => /[一-鿿々]/.test(ch); // 一-鿿 + 々
const isKana = (ch) => /[ぁ-ゖァ-ヺーヽヾ]/.test(ch); // hiragana/katakana/ー

// Overrides para casos em que o IPADIC erra ou para nomes próprios/leituras
// especiais deste corpus. Chave = superfície exata do TOKEN inteiro. O valor
// pode ser uma string (leitura em hiragana, distribuída por fit) ou um array
// de segmentos já prontos { t, r? } para compostos que o kuromoji fatia errado.
const OVERRIDES = {
  大口: 'おおぐち', // apelido "Boca Grande" (おおぐち = falar grande)
  大きな: 'おおきな',
  小さな: 'ちいさな',
  お日さま: 'おひさま',
  王さま: 'おうさま',
  一週間: 'いっしゅうかん',
  反対がわ: 'はんたいがわ',
  数分: 'すうふん',
  間: 'あいだ', // 長い間 = "por muito tempo" (kuromoji lê 間 como ま fora de contexto)
  // Compostos de "dia" que o kuromoji separa em 七+日 etc. (leitura especial):
  七日後: [{ t: '七日', r: 'なのか' }, { t: '後', r: 'ご' }],
  七日: [{ t: '七日', r: 'なのか' }],
  一日中: [{ t: '一日中', r: 'いちにちじゅう' }],
  何日か: [{ t: '何日', r: 'なんにち' }, { t: 'か' }],
};

// Divide a superfície em runs alternados de kanji e de kana/outros.
function runs(s) {
  const out = [];
  for (const ch of s) {
    const kanji = isKanji(ch);
    const last = out[out.length - 1];
    if (last && last.kanji === kanji) last.text += ch;
    else out.push({ kanji, text: ch });
  }
  return out;
}

// Distribui a leitura `read` (hiragana) sobre a superfície `surf`, devolvendo
// segmentos { t, r? } — `r` só nos runs de kanji. Devolve null se não encaixar.
function fit(surf, read) {
  const rs = runs(surf);
  if (rs.length === 1 && rs[0].kanji) return [{ t: surf, r: read }];
  const segs = [];
  let ri = 0;
  for (let k = 0; k < rs.length; k++) {
    const run = rs[k];
    if (!run.kanji) {
      // Run de kana: tem de bater com a leitura na posição atual.
      const piece = read.slice(ri, ri + run.text.length);
      if (toHira(piece) !== toHira(run.text)) return null;
      ri += run.text.length;
      segs.push({ t: run.text });
    } else {
      // Run de kanji: a leitura vai até o início do próximo run de kana.
      const next = rs[k + 1];
      let end;
      if (next) {
        const idx = read.indexOf(next.text[0], ri + 1);
        if (idx < 0) return null;
        end = idx;
      } else {
        end = read.length;
      }
      const r = read.slice(ri, end);
      if (!r) return null;
      ri = end;
      segs.push({ t: run.text, r });
    }
  }
  if (ri !== read.length) return null;
  return segs;
}

// Constrói os segmentos de furigana para um texto (um chunk/bunsetsu).
// Devolve null se o texto não tiver kanji (não precisa de furigana).
function furiganaFor(text, tokenizer, warn) {
  if (![...text].some(isKanji)) return null;
  const whole = OVERRIDES[text];
  if (Array.isArray(whole)) {
    if (whole.map((s) => s.t).join('') === text) return whole.map((s) => ({ ...s }));
    warn?.(`override de segmentos não bate com "${text}"`);
  } else if (whole) {
    const segs = fit(text, whole);
    if (segs) return segs;
  }
  const morphemes = tokenizer.tokenize(text);
  const segs = [];
  for (const m of morphemes) {
    const surf = m.surface_form;
    if (![...surf].some(isKanji)) {
      segs.push({ t: surf });
      continue;
    }
    const reading =
      OVERRIDES[surf] ?? (m.reading && m.reading !== '*' ? toHira(m.reading) : null);
    if (!reading) {
      warn?.(`sem leitura: "${surf}" em "${text}"`);
      segs.push({ t: surf });
      continue;
    }
    const fitted = fit(surf, reading);
    if (fitted) segs.push(...fitted);
    else if ([...surf].every((c) => isKanji(c) || c === 'ー')) segs.push({ t: surf, r: reading });
    else {
      warn?.(`fit falhou: "${surf}" (${reading}) em "${text}"`);
      segs.push({ t: surf });
    }
  }
  // Junta segmentos de kana adjacentes (sem leitura) para um DOM mais enxuto.
  const merged = [];
  for (const s of segs) {
    const last = merged[merged.length - 1];
    if (last && !last.r && !s.r) last.t += s.t;
    else merged.push({ ...s });
  }
  // Sanidade: a concatenação tem de reproduzir o texto.
  if (merged.map((s) => s.t).join('') !== text) {
    warn?.(`LOSSLESS interno falhou em "${text}" — furigana ignorada`);
    return null;
  }
  // Sem nenhum kanji anotado? Não vale a pena.
  return merged.some((s) => s.r) ? merged : null;
}

let _tokenizer = null;
function buildTokenizer() {
  if (_tokenizer) return Promise.resolve(_tokenizer);
  const dicPath = join(process.cwd(), 'node_modules', 'kuromoji', 'dict');
  return new Promise((resolve, reject) => {
    kuromoji.builder({ dicPath }).build((err, tok) => {
      if (err) return reject(err);
      _tokenizer = tok;
      resolve(tok);
    });
  });
}

// Enriquece um array de tokens (do content) com `furigana`. Mutável.
export async function addFurigana(tokens) {
  const tokenizer = await buildTokenizer();
  const warnings = [];
  let count = 0;
  for (const t of tokens) {
    if (!t.text) continue;
    const segs = furiganaFor(t.text, tokenizer, (m) => warnings.push(m));
    if (segs) {
      t.furigana = segs;
      count++;
    }
  }
  return { count, warnings };
}

export { furiganaFor, buildTokenizer, fit };
