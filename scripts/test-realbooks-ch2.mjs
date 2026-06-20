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

await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Real Books')?.click();
});
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/realbooks-ch2-library.png' });
console.log('biblioteca ok');

await page.goto(`${BASE}/reading/90002`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/realbooks-ch2-reader.png' });
console.log('reader ch2 ok');

await browser.close();
