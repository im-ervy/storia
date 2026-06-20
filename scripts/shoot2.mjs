import puppeteer from 'puppeteer-core';
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--force-device-scale-factor=1'] });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 760 });
await page.goto('http://localhost:3939/reading/14', { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 800));
// cycle theme to Dark (Light->Sepia->Dark = 2 clicks)
await page.evaluate(() => {
  const t = [...document.querySelectorAll('button[title]')].find((b) => b.title === 'Theme');
  t.click(); t.click();
});
await new Promise((r) => setTimeout(r, 500));
await page.screenshot({ path: 'shots/reading-dark.png' });
console.log('dark done');
await browser.close();
