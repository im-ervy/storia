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

// força o idioma francês no localStorage antes de carregar
await page.goto(`${BASE}/library`, { waitUntil: 'domcontentloaded' });
await page.evaluate(() => localStorage.setItem('gr-lang', 'fr'));

// abre cada novo livro e verifica que o conteúdo carrega
const NEW = [
  [10052, 'La Bibliothèque de la Patience'],
  [10053, 'La Nuit la Plus Effrayante de Ma Vie'],
  [10054, 'Le Secret'],
  [10055, "L'Histoire d'un Meurtre"],
  [10056, "L'Histoire de Star"],
];

for (const [id, title] of NEW) {
  await fetch(`${BASE}/api/reader/${id}/positions/0/read`, { method: 'PUT' }).catch(() => {});
  await page.goto(`${BASE}/reading/${id}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 900));
  const txt = await page.evaluate(
    () => document.querySelector('[class*="readerText"], [class*="page"], main')?.innerText?.slice(0, 80) || ''
  );
  console.log(`${id} ${title} -> "${txt.replace(/\n/g, ' ').trim().slice(0, 70)}"`);
}

// tooltip no Le Secret (10054)
await page.goto(`${BASE}/reading/10054`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1000));
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[class*="sentence"]')];
  spans.find((s) => s.className.includes('translation'))?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/fr-n2-secret-tooltip.png' });
const tip = await page.evaluate(
  () => document.querySelector('[class*="translationTooltip"]')?.innerText?.slice(0, 400)
);
console.log('tooltip 10054:', JSON.stringify(tip));
await browser.close();
