# SPEC de anotação — graded readers ITALIANOS (it), N1 — para falantes de PT-BR

Você anota UMA seção de um livro italiano, produzindo um array JSON de tokens.
Leia também `data/it/_glossary.md` (decisões de consistência e os 5 eixos).

## Schema do token
Cada elemento do array é:
```json
{ "text": "<trecho EXATO do italiano>", "newLine": <bool>,
  "translation": { "text": "<tradução PT-BR contextual>",
                   "tips": [ { "text": "<sub-trecho>",
                               "translatedText": "<glosa PT-BR literal>",
                               "explanation": "<nota longa>" | null } ] }
                 | null }
```
- **Chunks de conteúdo** (2–4 palavras): `translation` preenchido, `tips` SEMPRE
  array (nunca null).
- **Pontuação e espaços** (`" "`, `", "`, `". "`, `«`, `»`, `: `, `! `, `?`,
  `…` etc.): token próprio com `"translation": null`. As guillemets « e » são
  cada uma um token próprio.
- `newLine: true` SÓ no primeiro token de cada parágrafo; `false` em todos os
  outros. (Sua seção pode ter vários parágrafos — marque cada início.)

## INVARIANTE LOSSLESS (obrigatório — valide antes de retornar)
Concatenar todos os `text` na ordem === o texto-fonte da seção com os
parágrafos unidos por '' (string vazia, SEM "\n"), caractere a caractere.
- Os espaços entre palavras viram tokens `" "`; a pontuação carrega o espaço
  seguinte quando houver (ex.: `", "`, `". "`).
- Entre o fim de um parágrafo e o início do próximo NÃO há espaço nem quebra:
  o último token do parágrafo termina a frase (ex.: `"."`) e o próximo token
  começa com `newLine:true`.
- **VALIDE com node**: leia o .txt da seção, monte `expected` =
  `paragraphs.join('')` (parágrafos separados por linha em branco no arquivo),
  e compare com `tokens.map(t=>t.text).join('')`. Se diferir, corrija. Só
  retorne quando bater 100%.

## Tradução
- PT-BR natural e contextual (resolva referentes; pode usar parênteses para
  implícitos). Nomes falantes NÃO se traduzem no corpo (`text`) nem em
  `translation.text` — o significado vai na TIP da 1ª menção (ver glossário).

## Tips (glosa literal) — SEM TETO
- Glose praticamente todo chunk de conteúdo que um leitor PT-BR ganhe em ver
  traduzido (na prática, a grande maioria). `translatedText` = glosa curta.
- A maioria das tips tem `"explanation": null`. Densidade alta é desejável
  (livros N1 chegam a centenas de tips).

## Explanations (nota pedagógica longa) — TETO RÍGIDO: ~5 POR SEÇÃO
- No MÁXIMO ~5 tips desta seção podem ter `explanation` preenchida (texto
  longo). Todas as outras tips têm `explanation: null`.
- Escolha as 5 priorizando os **5 eixos** (ver glossário): falsi amici,
  gênero/plural, preposizioni articolate, essere vs avere (passato prossimo),
  piacere/congiuntivo/estruturas-espelho — e o eixo bônus de ortografia
  (doppie, acentos). Toda explanation é voltada a um falante de PT-BR e
  explica a LÓGICA do italiano (não decora).
- NÃO ultrapasse ~5. (Se o trecho pedir, fique em 4–5; nunca 10+.)

## Saída
Escreva o array JSON (UTF-8, indentado) em `data/it/_<id>-section-<N>.json`.
NÃO inclua comentários no JSON. Retorne um resumo: nº de tokens, nº de tips,
nº de explanations, e confirmação "lossless OK".
