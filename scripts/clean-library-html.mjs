// Limpa atributos do Angular do snapshot capturado da biblioteca para estudo.
import { readFileSync, writeFileSync } from 'node:fs';

let h = readFileSync('raw/library.html', 'utf8');
h = h
  .replace(/_ngcontent-[a-z0-9-]+=""/gi, '')
  .replace(/_nghost-[a-z0-9-]+=""/gi, '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\s+ng-reflect-[a-z-]+="[^"]*"/gi, '')
  .replace(/\s{2,}/g, ' ');
writeFileSync('assets_raw/js/_library_clean.html', h);
console.log('len', h.length);
