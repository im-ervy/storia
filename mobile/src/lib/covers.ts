// Resolve a capa de um reader (coverUrl "/covers/<arquivo>") para o módulo de
// imagem empacotado (coverMap gerado por gen-assets.mjs).
import { coverMap } from '../generated/coverMap';

export function coverSource(coverUrl: string | null): number | null {
  if (!coverUrl) return null;
  const file = coverUrl.split('/').pop() ?? '';
  return coverMap[file] ?? null;
}
