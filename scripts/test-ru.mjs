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

// 1) Troca para russo via localStorage e abre a biblioteca
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.setItem('gr-lang', 'ru'));
await page.reload({ waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/ru-library.png' });
console.log('biblioteca ru ok');

// 2) Abre o reader russo
await fetch(`${BASE}/api/reader/30001/positions/0/read`, { method: 'PUT' });
await page.goto(`${BASE}/reading/30001`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/ru-reader.png' });
console.log('reader ru ok');

// 2b) Botão de transliteração (deve existir e estar ON por padrão)
const btn = await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'abc');
  return b ? { text: b.textContent.trim(), on: b.className.includes('pinyinOn') } : null;
});
console.log('botão translit:', JSON.stringify(btn));
await page.screenshot({ path: 'shots/ru-reader-translit-on.png' });

// 2c) Desliga a transliteração e tira outro screenshot
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'abc')?.click();
});
await new Promise((r) => setTimeout(r, 800));
await page.screenshot({ path: 'shots/ru-reader-translit-off.png' });
console.log('toggle translit ok');

// 3) Tooltip no primeiro chunk ("Жил-был мальчик")
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[class*="sentence"]')];
  spans.find((s) => s.className.includes('translation'))?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/ru-tooltip.png' });
const tip = await page.evaluate(
  () => document.querySelector('[class*="translationTooltip"]')?.innerText?.slice(0, 400)
);
console.log('tooltip:', JSON.stringify(tip));
await browser.close();
