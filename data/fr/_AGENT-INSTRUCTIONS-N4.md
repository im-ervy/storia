# Instruções para anotar uma seção de graded reader FRANCÊS (Nível 4)

Você recebe UMA seção de um livro francês N4. Produza um arquivo JSON de tokens
anotados (tradução por chunk + tips PT-BR + explanations pedagógicas).

## Schema do token (array JSON na raiz)

Cada token:
```
{ "text": <trecho literal>, "newLine": <bool>, "translation": <obj|null> }
```
- `translation` é `null` para PONTUAÇÃO e ESPAÇOS (cada espaço " " é um token
  próprio com translation:null; cada sinal de pontuação `« » ! ? . , : ; … —`
  também é token próprio com translation:null).
- Para um chunk de conteúdo (2–4 palavras):
```
"translation": {
  "text": "<tradução PT-BR contextual do chunk>",
  "tips": [ { "text": "<sub-trecho>", "translatedText": "<glosa PT-BR>",
              "explanation": <string|null> } ]
}
```
- `tips` é SEMPRE um array (nunca null). Quase todo chunk de conteúdo deve ter
  1+ tip. NÃO modere a densidade de tips — glose tudo que um leitor PT-BR ganhe
  em ver traduzido (livros chegam a 300+ tips). Só `explanation` tem teto.
- `newLine: true` apenas no PRIMEIRO token de cada parágrafo; todos os outros
  `false`.

## LOSSLESS (obrigatório — validar com node antes de retornar)

Concatenar todos os `text` na ordem === os parágrafos da seção unidos por ''
(string vazia, SEM "\n"), caractere a caractere. Os parágrafos são as linhas
separadas por linha em branco no arquivo .txt da seção. Cada parágrafo começa
com um token `newLine:true` e NÃO há "\n" em nenhum `text`.

Exemplo de validação (ajuste os caminhos):
```js
const fs=require('fs');
const paras=fs.readFileSync('SECTION.txt','utf8').split(/\r?\n\r?\n+/).map(p=>p.trim().replace(/\r?\n/g,' ')).filter(Boolean);
const expected=paras.join('');
const tokens=JSON.parse(fs.readFileSync('OUT.json','utf8'));
const concat=tokens.map(t=>t.text).join('');
if(concat!==expected){let d=0;while(concat[d]===expected[d])d++;console.log('FALHOU char',d,JSON.stringify(expected.slice(d-30,d+30)),'VS',JSON.stringify(concat.slice(d-30,d+30)));process.exit(1);}
if(tokens.filter(t=>t.newLine).length!==paras.length){console.log('PARAGRAFOS ERRADOS',tokens.filter(t=>t.newLine).length,paras.length);process.exit(1);}
console.log('OK',tokens.length,'tokens');
```
NÃO retorne enquanto o validador não imprimir OK.

## Granularidade (referência real do livro 10095)

```
[{"text":"«","newLine":true,"translation":null},
 {"text":" ","newLine":false,"translation":null},
 {"text":"Je déteste tellement","newLine":false,"translation":{"text":"Eu detesto tanto","tips":[{"text":"Je déteste","translatedText":"eu detesto / odeio","explanation":null},{"text":"tellement","translatedText":"tanto / a tal ponto","explanation":null}]}},
 {"text":" ","newLine":false,"translation":null},
 {"text":"ce cours","newLine":false,"translation":{"text":"esta aula","tips":[{"text":"ce cours","translatedText":"este curso / esta aula","explanation":null}]}},
 {"text":" ! »","newLine":false,"translation":null}, ...]
```
Repare: chunks de 2–4 palavras; `« `, ` ! »`, espaços = tokens translation:null.
ATENÇÃO ao espaçamento francês: `«` é seguido de espaço, e ` !` ` ?` ` :` ` ;`
` »` são precedidos de espaço — preserve EXATAMENTE como está no .txt (o
lossless quebra se você comer ou inventar um espaço).

## Tradução

- PT-BR contextual e natural (não literal palavra-a-palavra no campo `text` da
  translation; a literalidade fica nas tips).
- Nomes falantes: NÃO traduzir no corpo; explicar o significado na tip da 1ª
  menção (ex.: `Rivière` → tip "Rivière (nome próprio; lit. 'Rio')").

## EXPLANATIONS (nota pedagógica longa) — TETO RÍGIDO: ~5 por seção (máx. 6)

Use `explanation` (string) só nos ~5 pontos gramaticais/culturais mais ricos da
SUA seção; nos demais tips, `explanation: null`. Explanations são para falantes
de PT-BR aprendendo francês. PRIORIZE 2–3 NOTAS CULTURAIS / DE USO REAL por
seção (o usuário ama isso): falsos amigos, idiomatismos, registro, diferenças
PT↔FR. Cada explanation: 1–3 frases, didática.

Os pontos gramaticais sugeridos virão no seu prompt. Se algum não existir no
texto da sua seção, SUBSTITUA por um equivalente real que apareça no seu trecho.
NÃO ultrapasse ~5 explanations — se gerar mais, é erro.

## Saída

Escreva SOMENTE o arquivo JSON no caminho indicado (array de tokens, sem
markdown, sem comentários). Depois rode o validador e confirme "OK". Retorne uma
linha curta com o total de tokens e o total de explanations.
