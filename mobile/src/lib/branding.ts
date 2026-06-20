// Assinatura da marca exibida no logo ("by ..."), conforme o contexto:
// - Real Books (nível 9): "ervy" (minúsculo);
// - inglês graded (níveis 1–7): "Mairo Vergara" (a coleção original);
// - demais idiomas: "Ervy" (E maiúsculo).
export function brandingAuthor(lang: string | undefined, level?: number): string {
  if (level === 9) return 'ervy';
  if ((lang ?? 'en') === 'en') return 'Mairo Vergara';
  return 'Ervy';
}
