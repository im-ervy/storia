# Contrato de anotação — graded readers de JAPONÊS (N1)

Você anota UMA seção de um livro. Sua saída é UM arquivo JSON: um array de
tokens. Leia também `data/ja/_glossary.md` (romanizações/traduções base do
livro 1, reutilize quando aparecerem) e o exemplo `data/ja/_40001-section-1.json`
(formato de referência da granularidade).

## Formato do token (schema)
Cada token é `{ "text": string, "newLine": boolean, "translation": {...} | null }`.
- `text` = o pedaço EXATO do texto-fonte (japonês).
- `newLine` = `true` SÓ no primeiro token de cada parágrafo; senão `false`.
- Pontuação de largura total (。、！？「」『』…・ etc.) e qualquer espaço são
  tokens SEPARADOS com `"translation": null`. (O japonês NÃO usa espaços entre
  palavras — normalmente só há pontuação como token nulo.)
- Tokens de conteúdo (palavras/bunsetsu) têm `translation`:
  ```
  "translation": {
    "text": "rōmaji — tradução PT-BR",
    "tips": [ { "text": "<sub-pedaço>", "translatedText": "rōmaji = glosa literal", "explanation": string|null, "priority": "high"|"low" } ]
  }
  ```
- `tips` é SEMPRE um array (nunca null). Em tips que são só glosa (sem nota),
  use `"explanation": null` e NÃO ponha `priority`.

## Granularidade (igual ao livro 40001)
- Chunks = palavra de conteúdo + suas partículas (bunsetsu), de 1 a ~5 caracteres.
  Ex.: `男の子が`, `住んでいました`, `小さな`, `町には`. NÃO faça chunks de frase
  inteira.
- `translation.text` SEMPRE começa com o **rōmaji (Hepburn)** do chunk, depois
  " — ", depois a tradução PT-BR contextual. Convenção de rōmaji: ver glossário
  (vogais longas ō/ū; し shi, ち chi, つ tsu, じ ji; geminada っ dobra a
  consoante; partículas pela PRONÚNCIA は=wa, へ=e, を=o).
- Dentro de cada chunk, decomponha em `tips` as sub-palavras/partículas úteis,
  cada uma com `translatedText` = "rōmaji = glosa literal".

## tips (glosa) — SEM TETO
Glose todo pedaço que um leitor PT-BR iniciante ganhe em ver traduzido — na
prática, quase tudo. NÃO modere a densidade. O número de tips nunca é cortado.

## explanations (nota pedagógica) — por PRIORIDADE
- `priority: "high"` = o ponto ESSENCIAL do trecho (partícula は/が/を/に/で,
  いる×ある, 〜ないといけない, condicional たら/なら, 〜てしまう, 〜ことにする,
  passiva/causativo, contadores, e as NOTAS CULTURAIS de uso real). **Máximo ~5
  "high" nesta seção** — escolha as imperdíveis.
- `priority: "low"` = nota útil porém secundária (etimologia, gramática menor,
  registro). SEM limite. NÃO promova "low" a "high" para furar a cota.
- Toda `explanation` (≠null) DEVE ter `priority`. Escreva as explanations em
  PT-BR, voltadas a falantes de português.

## Lossless — OBRIGATÓRIO
Concatenar todos os `text` na ordem === o texto-fonte da seção com os parágrafos
unidos por '' (sem `\n`). Valide com node ANTES de retornar:
```
node -e "const s=require('fs').readFileSync('data/ja/_<ID>-section-<N>.txt','utf8'); const paras=s.split(/\r?\n\r?\n+/).map(p=>p.trim().replace(/\r?\n/g,' ')).filter(Boolean); const expected=paras.join(''); const toks=require('./data/ja/_<ID>-section-<N>.json'); const got=toks.map(t=>t.text).join(''); if(got!==expected){let d=0;while(d<Math.min(got.length,expected.length)&&got[d]===expected[d])d++;console.error('FALHOU char',d);console.error('esp:',JSON.stringify(expected.slice(d-30,d+30)));console.error('got:',JSON.stringify(got.slice(d-30,d+30)));process.exit(1);}else{const nl=toks.filter(t=>t.newLine).length;console.log('LOSSLESS OK | tokens',toks.length,'| newLine',nl,'(paras',paras.length,') | high',toks.flatMap(t=>t.translation?.tips||[]).filter(x=>x.priority==='high').length);}"
```
`newLine` count DEVE igualar o nº de parágrafos da seção. NÃO retorne enquanto
não imprimir "LOSSLESS OK".

## Nomes falantes
NÃO traduza o nome no corpo (texto fica em japonês). Explique o significado na
`tip` da PRIMEIRA menção (priority high). Reutilize a romanização do nome de
forma consistente.

## Saída
Escreva SÓ o arquivo `data/ja/_<ID>-section-<N>.json` (array de tokens, JSON
válido). No retorno, informe: tokens, tips totais, explanations high, e que o
lossless passou.
