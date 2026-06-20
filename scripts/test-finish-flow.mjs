import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';
const ID = 121; // A Christmas Tradition (nível 5)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
await page.setViewport({ width: 1366, height: 850 });

// Abre direto a congratulation (o livro será marcado como lido pelo fluxo real:
// simula o finish primeiro)
await fetch(`${BASE}/api/user/readTextsInfo/${ID}`, { method: 'PUT' });
await fetch(`${BASE}/api/reader/${ID}/finish`, { method: 'PUT' });

await page.goto(`${BASE}/reading/${ID}/congratulation`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 2600));
await page.screenshot({ path: 'shots/congrat-1.png' });
console.log('stage 1 ok');

const next = async () => {
  await page.evaluate(() => {
    [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Próximo')?.click();
  });
  await new Promise((r) => setTimeout(r, 2300));
};
await next();
await page.screenshot({ path: 'shots/congrat-2.png' });
console.log('stage 2 ok');
await next();
await page.screenshot({ path: 'shots/congrat-3.png' });
console.log('stage 3 ok');
await next();
// Avalia com 4 estrelas
await page.evaluate(() => {
  const stars = [...document.querySelectorAll('img[src*="Star"]')];
  stars[3]?.click();
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: 'shots/congrat-4.png' });
console.log('stage 4 ok');
await page.evaluate(() => {
  [...document.querySelectorAll('button')]
    .find((b) => /CONFIRMAR|ENVIAR/i.test(b.textContent))
    ?.click();
});
await new Promise((r) => setTimeout(r, 1500));
console.log('url final:', page.url());

const score = await (await fetch(`${BASE}/api/reader/${ID}/score`)).json();
console.log('score salvo:', JSON.stringify(score));
const words = await (await fetch(`${BASE}/api/user/readTextsInfo`)).json();
console.log('readTextsInfo:', JSON.stringify(words));
console.log('erros de página:', errs.length ? errs.join(' | ') : 'nenhum');
await browser.close();
