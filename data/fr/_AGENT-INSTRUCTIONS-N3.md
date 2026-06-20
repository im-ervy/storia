# Instruções para anotar uma seção (francês Nível 3 → glosa PT-BR)

Você anota UMA seção de um graded reader francês. O resultado é um array JSON
de tokens salvo em disco. Trabalhe com cuidado cirúrgico — o lossless é
verificado por máquina.

## Formato do token (schema EXATO)

```json
{
  "text": "<trecho literal do francês>",
  "newLine": false,
  "translation": {
    "text": "<tradução PT-BR contextual do trecho inteiro>",
    "tips": [
      { "text": "<sub-trecho>", "translatedText": "<glosa PT-BR>", "explanation": null }
    ]
  }
}
```

- Tokens de **conteúdo**: chunks de 2–4 palavras francesas, com `translation`
  preenchida e `tips` (array, NUNCA null).
- Tokens de **pontuação e espaço**: cada sinal de pontuação (`. , ! ? : ; « » " ( ) … -`)
  e cada espaço entre chunks são tokens SEPARADOS com `"translation": null`.
  Ex.: `{"text": " ", "newLine": false, "translation": null}` e
  `{"text": ". ", "newLine": false, "translation": null}` (pode juntar o ponto
  com o espaço seguinte num só token de pontuação, como no arquivo de referência).
- `newLine`: `true` APENAS no PRIMEIRO token de cada parágrafo; `false` em todos
  os outros. NÃO existe token para a linha em branco entre parágrafos.

## Invariante LOSSLESS (obrigatória — valide com node antes de salvar)

Concatenar todos os `text` na ordem TEM que reproduzir o texto da seção, onde:
- parágrafos são unidos por '' (string vazia, SEM `\n`);
- **qualquer quebra de linha simples DENTRO de um parágrafo vira UM espaço**
  (ex.: versos de um poema viram uma linha só, separados por espaço);
- nenhum token contém `\n`.

Snippet de validação (rode e só salve se imprimir OK):
```js
const fs=require('fs');
const SEC='data/fr/_<ID>-section-<N>';
const src=fs.readFileSync(SEC+'.txt','utf8').trim();
const expected=src.split(/\r?\n\r?\n+/).map(p=>p.trim().replace(/\r?\n/g,' ')).filter(Boolean).join('');
const toks=JSON.parse(fs.readFileSync(SEC+'.json','utf8'));
const got=toks.map(t=>t.text).join('');
if(got!==expected){let d=0;while(got[d]===expected[d])d++;console.log('FALHOU char',d,JSON.stringify(expected.slice(d-30,d+30)),'!=',JSON.stringify(got.slice(d-30,d+30)));}
else console.log('OK lossless', toks.length,'tokens');
// confere newLine == nº de parágrafos
console.log('newLines', toks.filter(t=>t.newLine).length, 'paras', src.split(/\r?\n\r?\n+/).filter(Boolean).length);
```

## Granularidade / referência

Espelhe a granularidade de `data/fr/_10075-section-1.json` (livro Le Sosie).
Abra-o para ver o padrão de chunking e de tips.

## Tradução e TIPS (glosa PT-BR) — SEM TETO

- `translation.text` = tradução natural PT-BR do chunk inteiro (não literal).
- `tips`: glose praticamente TODO chunk de conteúdo — quanto mais denso melhor
  (livros do nível têm 300–800 tips). NÃO modere artificialmente. Cada tip é
  um sub-trecho com sua glosa. `explanation: null` na grande maioria.
- Nomes falantes: NÃO traduzir no corpo (`text`/`translation.text`); explicar
  o significado na tip da PRIMEIRA menção.

## EXPLANATIONS (nota pedagógica longa) — TETO RÍGIDO: **5 por seção**

No MÁXIMO 5 tips desta seção podem ter `explanation` preenchida (string). É um
teto OBRIGATÓRIO — não ultrapasse. Escolha os 5 pontos mais ricos do SEU trecho.
Se um ponto sugerido não aparecer no seu texto, troque por outro ponto real que
exista na seção.

Explanations são para falantes de PT-BR. Priorize:
- **Notas culturais / idiomáticas** (o usuário ADORA — inclua 2–3 por seção
  quando houver): expressões como « ne pas être dans son assiette », « en un
  clin d'œil », « faire bonne mesure », « histoire ancienne », « prendre
  rendez-vous », « joyeux anniversaire », « jouer à/de », vocabulário de
  registro, etc.
- **Falsos amigos PT↔FR**: `assister à` (=comparecer, não "ajudar"), `rester`
  (=ficar, não "restar"), `rentrer` (=voltar p/ casa), `journée` vs `jour`,
  `large` (=largo), `tirer` (=puxar/atirar), `censé` (=suposto), `quitter`
  (=deixar/sair de) — sempre que um aparecer.
- **Gramática N3**: passé composé × imparfait; `venir de + inf` (=acabar de);
  `être censé + inf`; conditionnel (`je l'appellerais`, politesse/hipótese);
  subjonctif (`qu'il soit`, `bien que`, `pour que`, `avant que`); pronomes
  (`en`, `y`, COD/COI, relativos `dont`/`où`); `ne… que` (=só); gerúndio
  `en + -ant`; negação; concordância do particípio.

## Saída

1. Salve o array JSON em `data/fr/_<ID>-section-<N>.json` (use a ferramenta Write).
2. Rode o snippet de validação acima e confirme "OK lossless".
3. Confira que NÃO há mais de 5 explanations: 
   `node -e "const t=require('./data/fr/_<ID>-section-<N>.json');console.log('expl',t.flatMap(x=>x.translation?x.translation.tips:[]).filter(x=>x.explanation).length)"`
4. Retorne só uma linha: contagem de tokens, tips, explanations, e "lossless OK".
