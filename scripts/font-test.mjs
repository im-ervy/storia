import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const html = `<!doctype html><style>
@font-face{font-family:'OS';font-weight:300 800;src:url('http://localhost:3000/fonts/opensans-400.woff2') format('woff2')}
@font-face{font-family:'BL';font-weight:400;src:url('http://localhost:3000/fonts/barlow-400.woff2') format('woff2')}
@font-face{font-family:'BL';font-weight:700;src:url('http://localhost:3000/fonts/barlow-700.woff2') format('woff2')}
div{font-size:40px}
</style>
<div style="font-family:OS;font-weight:400">Palavras 400</div>
<div style="font-family:OS;font-weight:700">Palavras 700</div>
<div style="font-family:OS;font-weight:800">Palavras 800</div>
<div style="font-family:BL;font-weight:700">Olá Renan BL700</div>`;

const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const pg = await b.newPage();
await pg.setContent(html);
await new Promise((r) => setTimeout(r, 800));
const widths = await pg.evaluate(() =>
  [...document.querySelectorAll('div')].map((d) => Math.round(d.getBoundingClientRect().width))
);
console.log('widths (400/700/800/BL700):', widths.join(', '));
await pg.screenshot({ path: 'shots/font-test.png', clip: { x: 0, y: 0, width: 500, height: 230 } });
await b.close();
