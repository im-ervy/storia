import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const VIEWPORTS = [
  { width: 360, height: 640 },
  { width: 390, height: 700 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 768, height: 900 },
];

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});

let failures = 0;
for (const vp of VIEWPORTS) {
  await fetch(`${BASE}/api/reader/23/positions/0/read`, { method: 'PUT' });
  const page = await browser.newPage();
  await page.setViewport({ ...vp, isMobile: true, hasTouch: true });
  await page.goto(`${BASE}/reading/23`, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1200));

  let pageCount = 0;
  let worst = -Infinity;
  for (;;) {
    pageCount++;
    const m = await page.evaluate(() => {
      const paras = document.querySelectorAll('[class*="readingPage"] p');
      const last = paras[paras.length - 1];
      const bar = document.querySelector('[class*="pageInfo"]');
      const finish = document.querySelector('[class*="btnFinishReader"]');
      const lastBottom = Math.max(
        last ? last.getBoundingClientRect().bottom : 0,
        finish ? finish.getBoundingClientRect().bottom : 0
      );
      const limit = bar ? bar.getBoundingClientRect().top : window.innerHeight;
      const next = document.querySelector('[class*="mobileNextButtonBox"]');
      return { overflow: lastBottom - limit, hasNext: !!next };
    });
    worst = Math.max(worst, m.overflow);
    if (m.overflow > 0) {
      failures++;
      console.log(`  FAIL ${vp.width}x${vp.height} pagina ${pageCount}: estouro ${m.overflow.toFixed(1)}px`);
    }
    if (!m.hasNext) break;
    await page.tap('[class*="mobileNextButtonBox"]');
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`${vp.width}x${vp.height}: ${pageCount} paginas, pior sobra ${(-worst).toFixed(1)}px ${worst > 0 ? '<<< ESTOURO' : 'OK'}`);
  await page.close();
}
console.log(failures ? `${failures} estouros` : 'sem estouros');
await browser.close();
