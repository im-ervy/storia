import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1536, height: 830 });

// 1) Troca para japonês via localStorage e abre a biblioteca
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('gr-lang', 'ja'));
await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/ja-library.png' });
console.log('biblioteca ja ok');

// 2) Abre o reader japonês
await fetch(`${BASE}/api/reader/40001/positions/0/read`, { method: 'PUT' });
await page.goto(`${BASE}/reading/40001`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/ja-reader.png' });
console.log('reader ja ok');

// 2b) Botões de leitura: ふりがな (default ON) e Rōmaji
const buttons = await page.evaluate(() =>
  [...document.querySelectorAll('button')]
    .filter((b) => ['ふりがな', 'Rōmaji'].includes(b.textContent.trim()))
    .map((b) => ({ text: b.textContent.trim(), on: b.className.includes('pinyinOn') }))
);
console.log('botões de leitura:', JSON.stringify(buttons));

// 2c) Modo FURIGANA (padrão): a leitura ruby deve cair SÓ sobre kanji.
const furi = await page.evaluate(() => {
  const isKanji = (s) => /[一-鿿]/.test(s);
  const rubies = [...document.querySelectorAll('ruby')];
  const bases = rubies.map((r) => ({
    base: [...r.childNodes].filter((n) => n.nodeName !== 'RT').map((n) => n.textContent).join(''),
    rt: r.querySelector('rt')?.textContent,
  }));
  return {
    count: rubies.length,
    allKanji: bases.every((b) => [...b.base].every(isKanji)),
    sample: bases.slice(0, 6),
  };
});
console.log('FURIGANA — rubies:', furi.count, '| base só-kanji:', furi.allKanji);
console.log('  amostra:', JSON.stringify(furi.sample));
await page.screenshot({ path: 'shots/ja-reader-furigana.png' });

// 2d) Troca para RŌMAJI: ruby passa a cobrir o chunk inteiro.
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Rōmaji')?.click();
});
await new Promise((r) => setTimeout(r, 800));
const romaji = await page.evaluate(() => {
  const r = document.querySelector('ruby');
  return {
    count: document.querySelectorAll('ruby rt').length,
    first: r ? { base: r.firstChild?.textContent, rt: r.querySelector('rt')?.textContent } : null,
  };
});
console.log('RŌMAJI — rt:', romaji.count, '| primeiro:', JSON.stringify(romaji.first));
await page.screenshot({ path: 'shots/ja-reader-romaji.png' });

// 2e) Desliga (clica no Rōmaji ativo): sem ruby.
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Rōmaji')?.click();
});
await new Promise((r) => setTimeout(r, 800));
const off = await page.evaluate(() => document.querySelectorAll('ruby rt').length);
await page.screenshot({ path: 'shots/ja-reader-off.png' });
console.log('OFF — rt:', off);
// Volta para furigana p/ o screenshot do tooltip
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'ふりがな')?.click();
});
await new Promise((r) => setTimeout(r, 600));

// 3) Tooltip no primeiro chunk
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[class*="sentence"]')];
  spans.find((s) => s.className.includes('translation'))?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/ja-tooltip.png' });
const tip = await page.evaluate(
  () => document.querySelector('[class*="translationTooltip"]')?.innerText?.slice(0, 400)
);
console.log('tooltip:', JSON.stringify(tip));
await browser.close();
