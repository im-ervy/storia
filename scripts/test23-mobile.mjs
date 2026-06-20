import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

await fetch(`${BASE}/api/reader/23/positions/0/read`, { method: 'PUT' });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

// Tema sépia direto no localStorage para abrir igual ao screenshot original
await page.evaluateOnNewDocument(() => localStorage.setItem('gr-color-theme', 'sepia'));
await page.goto(`${BASE}/reading/23`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/mob-sepia-p1.png' });
console.log('mobile p1 done');

// Abre o menu de opções
await page.tap('[class*="displayMenuButton"]');
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/mob-menu.png' });
console.log('menu done');
await page.tap('[class*="menuBackdrop"]');
await new Promise((r) => setTimeout(r, 300));

// Avança de página pela seta da barra inferior
await page.tap('[class*="mobileNextButtonBox"]');
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: 'shots/mob-sepia-p2.png' });
console.log('p2 done');

const state = await page.evaluate(() => ({
  pageInfo: document.querySelector('[class*="pageInfo"]')?.textContent?.trim(),
  header: document.querySelector('header')?.textContent?.trim(),
}));
console.log(JSON.stringify(state));
await browser.close();
