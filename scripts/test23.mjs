import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

// Zera o progresso para abrir na primeira página
await fetch(`${BASE}/api/reader/23/positions/0/read`, { method: 'PUT' });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 950 });

await page.goto(`${BASE}/reading/23`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/new-white-p1.png' });
console.log('white p1 done');

// Tema sépia (como o screenshot original)
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const sepia = btns.find((b) => b.textContent.trim() === 'SÉPIA');
  sepia?.click();
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: 'shots/new-sepia-p1.png' });
console.log('sepia p1 done');

// Tooltip em "blue house"
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('span')];
  const t = spans.find((s) => s.textContent === 'blue house');
  t?.click();
});
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: 'shots/new-sepia-tooltip.png' });
console.log('tooltip done');

// Fecha tooltip e vai para a página 2
await page.evaluate(() => {
  document.querySelector('[class*="tooltipCloseButton"]')?.click();
});
await page.keyboard.press('ArrowRight');
await new Promise((r) => setTimeout(r, 800));
await page.mouse.move(1800, 500);
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: 'shots/new-sepia-p2.png' });
console.log('p2 done');

const state = await page.evaluate(() => ({
  pageInfo: document.querySelector('[class*="pageInfo"]')?.textContent?.trim(),
  paragraphs: document.querySelectorAll('[class*="paragraph"]').length,
}));
console.log(JSON.stringify(state));
await browser.close();
