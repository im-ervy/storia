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

// Biblioteca (inglês é o idioma padrão) — clicar na aba "Real Books"
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Real Books')?.click();
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/realbooks-library.png' });
console.log('biblioteca real books ok');

// Abrir o reader do Percy Jackson
await page.goto(`${BASE}/reading/90001`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/realbooks-reader.png' });
console.log('reader real books ok');

// Tooltip no primeiro chunk traduzível
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[class*="sentence"]')];
  spans.find((s) => s.className.includes('translation'))?.click();
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: 'shots/realbooks-tooltip.png' });
console.log('tooltip ok');

await browser.close();
