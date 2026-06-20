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

// 1) Dropdown com o seletor de idioma
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await page.click('[class*="userPanel"]');
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: 'shots/fr-dropdown.png', clip: { x: 1000, y: 0, width: 536, height: 480 } });
console.log('dropdown ok');

// 2) Troca para francês
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Francês'))?.click();
});
await page.waitForNavigation({ waitUntil: 'networkidle0' }).catch(() => {});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/fr-library.png' });
console.log('biblioteca fr ok');

// 3) Abre o reader francês
await fetch(`${BASE}/api/reader/10001/positions/0/read`, { method: 'PUT' });
await page.goto(`${BASE}/reading/10001`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/fr-reader.png' });
console.log('reader fr ok');

// 4) Tooltip no primeiro chunk ("Il était une fois")
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[class*="sentence"]')];
  spans.find((s) => s.className.includes('translation'))?.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/fr-tooltip.png' });
const tip = await page.evaluate(
  () => document.querySelector('[class*="translationTooltip"]')?.innerText?.slice(0, 300)
);
console.log('tooltip:', JSON.stringify(tip));
await browser.close();
