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

// Abre um reader espanhol (rico em falsos amigos / notas culturais)
await fetch(`${BASE}/api/reader/50001/positions/0/read`, { method: 'PUT' });
await page.goto(`${BASE}/reading/50001`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.screenshot({ path: 'shots/notes-off.png' });

// Quantos tokens viram "notáveis" quando ligamos o realce
const before = await page.evaluate(
  () => document.querySelectorAll('[class*="hasNote"]').length
);
console.log('hasNote spans (off):', before);

// Clica no toggle "Notas" do header
await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((b) => b.textContent.trim() === 'Notas')
    ?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: 'shots/notes-on.png' });

const after = await page.evaluate(
  () => document.querySelectorAll('[class*="hasNote"]').length
);
console.log('hasNote spans (on):', after);

await browser.close();
