// Gera os ícones de app (mobile + desktop) a partir do logo do Graded Readers
// recriado em VETOR (fiel ao public/icons/apple-touch-icon.png: anel escuro,
// céu coral, mar ciano em ondas). Saída nítida em qualquer tamanho via sharp.
//
//   node scripts/gen-app-icons.mjs
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOBILE_ASSETS = join(ROOT, 'mobile', 'assets');
const DESKTOP_BUILD = join(ROOT, 'desktop', 'build');
mkdirSync(DESKTOP_BUILD, { recursive: true });

// Paleta amostrada do apple-touch-icon.png original.
const RING = '#1a1a1a';
const SKY = '#f5424c';
const SEA = '#31b7d0';
const SEA_LIGHT = '#4ec7da';
const SEA_DARK = '#278ea2';
const ANDROID_BG = '#E6F4FE'; // backgroundColor do adaptiveIcon (app.json)

// Logo em viewBox 512. Conteúdo recortado ao disco interno (r=206); o anel
// (stroke 34, borda externa em r=240 => margem ~6%) é desenhado por cima.
function logoSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <clipPath id="disk"><circle cx="256" cy="256" r="206"/></clipPath>
  </defs>
  <g clip-path="url(#disk)">
    <rect x="0" y="0" width="512" height="512" fill="${SEA}"/>
    <path d="M0,360 C 110,330 160,398 270,366 C 380,338 432,402 512,360 L512,512 L0,512 Z" fill="${SEA_DARK}"/>
    <path d="M0,250 C 110,292 162,224 270,256 C 380,286 432,224 512,250 L512,290 C 432,264 380,320 270,290 C 162,262 110,328 0,290 Z" fill="${SEA_LIGHT}"/>
    <path d="M0,0 L512,0 L512,186 C 420,150 380,222 270,196 C 168,172 110,226 0,196 Z" fill="${SKY}"/>
  </g>
  <circle cx="256" cy="256" r="223" fill="none" stroke="${RING}" stroke-width="34"/>
</svg>`;
}

// Disco sólido (silhueta) p/ o ícone monocromático adaptativo do Android.
function diskSvg(size, color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><circle cx="256" cy="256" r="240" fill="${color}"/></svg>`;
}

const png = (svg) => sharp(Buffer.from(svg)).png().toBuffer();

// Logo encolhido e centralizado em canvas transparente (zona segura do
// adaptiveIcon do Android: conteúdo dentro de ~66% p/ a máscara não cortar).
async function inset(size, frac, svgFn) {
  const inner = Math.round(size * frac);
  const logo = await png(svgFn(inner));
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: logo, gravity: 'center' }])
    .png()
    .toBuffer();
}

// ---- ICO (Windows): empacota PNGs (Vista+). ----
function buildIco(pngs) {
  // pngs: [{size, buf}]
  const count = pngs.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(count, 4);
  const dir = Buffer.alloc(16 * count);
  let offset = 6 + 16 * count;
  pngs.forEach((p, i) => {
    const b = i * 16;
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, b + 0);
    dir.writeUInt8(p.size >= 256 ? 0 : p.size, b + 1);
    dir.writeUInt8(0, b + 2); // palette
    dir.writeUInt8(0, b + 3); // reserved
    dir.writeUInt16LE(1, b + 4); // planes
    dir.writeUInt16LE(32, b + 6); // bpp
    dir.writeUInt32LE(p.buf.length, b + 8);
    dir.writeUInt32LE(offset, b + 12);
    offset += p.buf.length;
  });
  return Buffer.concat([header, dir, ...pngs.map((p) => p.buf)]);
}

(async () => {
  // ---- Mobile ----
  writeFileSync(join(MOBILE_ASSETS, 'icon.png'), await png(logoSvg(1024)));
  writeFileSync(join(MOBILE_ASSETS, 'splash-icon.png'), await png(logoSvg(1024)));
  writeFileSync(join(MOBILE_ASSETS, 'favicon.png'), await png(logoSvg(48)));
  // Adaptive (Android): foreground = logo a 66% centrado; background sólido;
  // monochrome = disco branco a 66% (o sistema aplica o tint).
  writeFileSync(join(MOBILE_ASSETS, 'android-icon-foreground.png'), await inset(1024, 0.66, logoSvg));
  writeFileSync(
    join(MOBILE_ASSETS, 'android-icon-background.png'),
    await sharp({ create: { width: 1024, height: 1024, channels: 4, background: ANDROID_BG } })
      .png()
      .toBuffer()
  );
  writeFileSync(
    join(MOBILE_ASSETS, 'android-icon-monochrome.png'),
    await inset(1024, 0.66, (s) => diskSvg(s, '#ffffff'))
  );

  // ---- Desktop (Windows .ico + png 256 p/ runtime/Linux) ----
  const icoSizes = [16, 24, 32, 48, 64, 128, 256];
  const entries = [];
  for (const s of icoSizes) entries.push({ size: s, buf: await png(logoSvg(s)) });
  writeFileSync(join(DESKTOP_BUILD, 'icon.ico'), buildIco(entries));
  writeFileSync(join(DESKTOP_BUILD, 'icon.png'), await png(logoSvg(256)));

  console.log('OK: ícones do mobile (6) + desktop (icon.ico, icon.png) gerados.');
})();
