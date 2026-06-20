import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3939';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 1000 });

async function go(path) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
}

// 1) Reading with popover open on a phrase that has tips ("Black Eyes")
await go('/reading/14');
await page.evaluate(() => {
  const spans = [...document.querySelectorAll('[data-tok]')];
  const target = spans.find((s) => s.textContent.trim() === 'Black Eyes');
  (target || spans[0]).click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/reading-popover.png' });
console.log('popover shot done');

// 2) Interlinear mode + dark theme
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button[title]')];
  btns.find((b) => /inline translation/i.test(b.title))?.click();
  const theme = btns.find((b) => b.title === 'Theme');
  theme?.click();
  theme?.click(); // cycle to Dark
});
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: 'shots/reading-interlinear-dark.png' });
console.log('interlinear+dark shot done');

await browser.close();
