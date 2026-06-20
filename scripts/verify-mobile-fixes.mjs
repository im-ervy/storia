// Valida os 2 fixes na visão mobile: (1) seletor de idioma no header mobile,
// (2) menu de opções do reader (Tema/Notas) sem vazar o painel.
import puppeteer from 'puppeteer-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://localhost:3000';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
// Passa a porta de senha (cookie do gate).
await page.setCookie({ name: 'gr_gate', value: process.env.SITE_PASSWORD || '', domain: 'localhost' });

// 1) Biblioteca mobile + botão de idioma
await page.goto(`${BASE}/library`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1200));
const hasLangBtn = (await page.$('[class*="mobileLangBtn"]')) !== null;
await page.screenshot({ path: 'shots/verify-lib-mobile.png' });
console.log('lang button presente:', hasLangBtn);

// abre o menu de idioma
if (hasLangBtn) {
  await page.tap('[class*="mobileLangBtn"]');
  await new Promise((r) => setTimeout(r, 400));
  const langs = await page.$$eval('[class*="mobileLangMenu"] [class*="langOption"]', (els) =>
    els.map((e) => e.textContent.trim())
  );
  console.log('idiomas no menu:', langs.join(' | '));
  await page.screenshot({ path: 'shots/verify-lang-menu.png' });
}

// 2) Reader: menu de opções (Tema/Notas) — checar que o painel contém tudo
await page.goto(`${BASE}/reading/1`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 1500));
await page.tap('[class*="displayMenuButton"]');
await new Promise((r) => setTimeout(r, 500));
const menuBox = await page.$eval('[class*="mobileOptionsMenu"]', (el) => {
  const r = el.getBoundingClientRect();
  // a última seção (Notas) deve estar DENTRO do painel
  const sections = el.querySelectorAll('[class*="menuThemeContainer"]');
  const last = sections[sections.length - 1].getBoundingClientRect();
  return { menuBottom: Math.round(r.bottom), lastBottom: Math.round(last.bottom), contained: last.bottom <= r.bottom + 1 };
});
console.log('menu bottom:', menuBox.menuBottom, '| ultima secao bottom:', menuBox.lastBottom, '| contido:', menuBox.contained);
await page.screenshot({ path: 'shots/verify-reader-menu.png' });

await browser.close();
console.log('OK');
