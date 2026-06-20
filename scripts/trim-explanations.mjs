// Apara explanations excedentes nas seções, mantendo no máx. 5 por seção
// (as 5 mais substanciais = explanation mais longa). uso: node scripts/trim-explanations.mjs <id1> <id2> ...
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const CAP = 5;
const ids = process.argv.slice(2).map(Number);
for (const id of ids) {
  for (let n = 1; n <= 4; n++) {
    const f = `data/fr/_${id}-section-${n}.json`;
    if (!existsSync(f)) continue;
    const s = JSON.parse(readFileSync(f, 'utf8'));
    // coleta refs de todas as tips com explanation
    const expls = [];
    for (const t of s) for (const tip of t.translation?.tips || []) {
      if (tip.explanation) expls.push(tip);
    }
    if (expls.length <= CAP) {
      console.log(`${id} s${n}: ${expls.length} ok`);
      continue;
    }
    // mantém as CAP mais longas; anula as demais
    const keep = new Set(
      [...expls].sort((a, b) => b.explanation.length - a.explanation.length).slice(0, CAP)
    );
    let nulled = 0;
    for (const tip of expls) if (!keep.has(tip)) { tip.explanation = null; nulled++; }
    writeFileSync(f, JSON.stringify(s));
    console.log(`${id} s${n}: ${expls.length} -> ${CAP} (anuladas ${nulled})`);
  }
}
