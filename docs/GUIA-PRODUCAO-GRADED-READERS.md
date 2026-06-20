# Guia de Produção de Graded Readers

> Engenharia reversa completa da coleção **Graded Readers by Mairo Vergara**
> (195 livros, níveis 1–7), combinando análise quantitativa de todo o corpus
> com leitura editorial de 14 livros (2 por nível). O objetivo é documentar
> **como esses livros são feitos, em que se baseiam, por que funcionam** — e
> tudo o que é preciso para produzir coleções equivalentes em outros idiomas.

---

## 1. O que é a coleção

| | |
|---|---|
| Livros | 195 (30 por nível nos níveis 1–6; 15 no nível 7) |
| Tamanho | ~1.200 a ~2.700 palavras por livro (8–16 min de áudio narrado) |
| Métrica oficial | **Palavras únicas** por livro (367 no N1 → 790 no N7), registrada nos metadados — não páginas |
| Formato | Texto integral + tradução alinhada por *chunk* (sintagma) + *tips* palavra a palavra + notas pedagógicas + narração em áudio |
| Idioma-fonte | Inglês americano contemporâneo, para falantes de português brasileiro |

Cada livro existe em três artefatos: o texto puro (`.txt`), a versão bilíngue
(`.bilingue.md`) e a estrutura de leitura assistida (`.sentences.json`) que
alimenta o app — além de `info.txt` (metadados) e capa ilustrada com o número
do nível.

---

## 2. Fundamentos pedagógicos (em que eles se baseiam)

A coleção é uma aplicação direta de princípios consagrados de aquisição de
segunda língua, com uma decisão de design distintiva:

1. **Input compreensível (Krashen, *i+1*)** — o aluno lê histórias reais um
   pouco acima do seu nível, e a compreensão é garantida por apoio
   (tradução por chunk + tips), não pela simplificação artificial do texto.

2. **Leitura extensiva (Extensive Reading)** — volume e prazer: histórias com
   arco, humor e emoção de verdade, curtas o bastante para terminar numa
   sessão (10–15 min), com mecânica de progresso (30 livros por nível,
   contadores de palavras) que cria hábito.

3. **A descoberta central da análise: a gramática é quase PLANA entre níveis.**
   Medimos 19 marcadores gramaticais por 1.000 palavras e a variação entre
   N1 e N7 é mínima — o N1 já usa `would` habitual (4,9/1000), `could`,
   passado perfeito (2,2/1000), voz passiva e orações relativas. **A
   progressão não é gramatical** (como nas coleções tradicionais tipo
   Oxford/Penguin, que "liberam" tempos verbais por nível). A linguagem é
   natural desde o nível 1.

4. **O que de fato é graduado são quatro variáveis:**
   - **Carga lexical** — palavras únicas por livro (367 → 790) e cobertura
     por vocabulário básico (no N1, as 1.000 palavras mais frequentes do
     corpus cobrem 94,4% do texto; no N7, 80,5%);
   - **Extensão** — 1.600 → 2.500 palavras;
   - **Densidade de apoio** — % de chunks com tips: 23% → 2%; notas
     pedagógicas por livro: 38 → 2; tamanho do chunk de tradução: 2,3
     palavras (quase palavra a palavra) → 11 palavras (frases inteiras);
   - **Maturidade editorial** — tema, tom, ironia, subtexto e estrutura
     narrativa (ver §4).

5. **Repetição engenheirada** — no N1 cada palavra única aparece em média
   **4,5×** no mesmo livro (só 44% aparecem uma vez); no N4–N7 cai para ~3×
   (60% *hapax*). A repetição no N1 é andaime deliberado: estruturas inteiras
   se repetem 3× com variação mínima ("The next morning, the King called for
   [X] and asked…").

6. **Glosa embutida como motor único de vocabulário** — toda palavra ou
   conceito novo é **reformulado dentro do próprio texto**, em todos os
   níveis, mudando apenas o alvo: apelidos e nomes (N1) → expressões
   culturais (N2–N3: *"a native New Yorker, which means she was born and
   raised in the city"*) → palavras de dicionário (N4, via palavras-cruzadas
   dentro da história!) → conceitos factuais (N7: Freud, peiote, história
   Comanche).

---

## 3. Especificações quantitativas por nível (tabela-mestre)

Medições sobre os 195 livros (mediana, salvo indicação):

| Métrica | N1 | N2 | N3 | N4 | N5 | N6 | N7 |
|---|---|---|---|---|---|---|---|
| Livros na coleção | 30 | 30 | 30 | 30 | 30 | 30 | 15 |
| Palavras por livro | 1.617 | 1.175 | 1.510 | 1.776 | 2.000 | 2.204 | 2.542 |
| Faixa (mín–máx) | 1.2k–2.7k | 0.8k–1.6k | 1.3k–1.7k | 1.7k–1.9k | 1.9k–2.1k | 2.0k–2.3k | 2.5k–2.7k |
| Palavras únicas | 367 | 411 | 501 | 584 | 616 | 693 | 790 |
| Razão tipo/ocorrência (TTR) | 0,23 | 0,36 | 0,33 | 0,33 | 0,31 | 0,32 | 0,31 |
| Ocorrências por palavra única | 4,5× | — | — | 3,0× | — | — | 3,2× |
| Palavras por frase (média / p90) | 17,9 / 37 | 14,3 / 28 | 15,1 / 31 | 12,7 / 26 | 15,3 / 32 | 15,6 / 31 | 16,5 / 33 |
| Tamanho do chunk de tradução | 2,3 | 2,2 | 2,6 | 2,7 | 3,8 | 10,0 | 10,9 |
| % de chunks com tips | 23% | 16% | 16% | 13% | 7% | 2% | 3% |
| Notas pedagógicas por livro | 38 | 16 | 14 | 4 | 2 | 2 | 2,5 |
| % de parágrafos com diálogo | 61% | 56% | 56% | 69% | 50% | 56% | 57% |
| Parágrafos por livro | 53 | 31 | 44 | 62 | 62 | 62 | 66 |
| Áudio (min) | 14,4 | 8,5 | 10,2 | 12,4 | 12,6 | 14,4 | 16,3 |
| Cobertura pelas top-1000 do corpus | 94,4% | 87,4% | 85,2% | 82,9% | 82,8% | 81,3% | 80,5% |

**Progressão do vocabulário da coleção** (acumulado entre níveis):

| Nível | Vocabulário do nível | Acumulado | % de palavras novas vs. níveis anteriores |
|---|---|---|---|
| 1 | 2.127 | 2.127 | 100% |
| 2 | 3.253 | 3.926 | 55% |
| 3 | 4.246 | 5.730 | 42% |
| 4 | 5.184 | 7.704 | 38% |
| 5 | 5.661 | 9.488 | 32% |
| 6 | 6.336 | 11.321 | 29% |
| 7 | 4.896 | 12.324 | 20% |

> Leitura da tabela: cada nível **recicla majoritariamente** o vocabulário dos
> anteriores e introduz uma fração decrescente de novidade. A coleção inteira
> constrói um vocabulário de ~12.300 palavras. As palavras exclusivas de cada
> nível mostram a natureza da novidade: N4 introduz cotidiano fino
> (*supermarket, spaghetti, puzzle, stroll*), N5 cultura mundial (*Advent,
> Iceland, decorate*), N6 abstrato/técnico (*neurodegenerative, dementia,
> density, proposition*), N7 registro adulto (*radioactive, credible,
> payroll*).

**Frases (importante):** o comprimento de frase é ~15 palavras em TODOS os
níveis — o N1 inclusive tem frases longas, porém coordenadas (`and/but/so`) e
divididas em chunks de 2 palavras com tradução. **Não encurte frases
artificialmente; aumente o apoio.**

---

## 4. Perfil editorial de cada nível (o que escrever)

### Nível 1 — A fábula moralizante
- **Gênero:** conto de fadas / fábula folclórica. Ambientação universal e
  atemporal (reino, aldeia genérica). Protagonistas arquetípicos (crianças,
  príncipes), não pessoas complexas.
- **Abertura obrigatória:** fórmula fixa — *"Once upon a time"* (no idioma
  alvo: o equivalente canônico de "Era uma vez").
- **Nomes falantes:** *Big Mouth, Good Eyes, Strong Mind, Fire Dog* — o nome
  É a descrição do personagem, e o texto explica o apelido na primeira
  menção: *"everyone called him Big Mouth, although his mouth was not
  particularly big; they called the boy Big Mouth because he always told
  stories"*.
- **Estrutura:** desenvolvimento por repetição de eventos (3 provas, 3
  enganos, 3 irmãos) com estruturas literais repetidas 3× como andaime.
- **Fecho:** moral explícita + pequeno twist humorístico (*"Well, maybe you
  can tell a little lie sometimes."*). Final feliz, justiça poética.
- **Tom:** infantil-caloroso com narrador levemente irônico.

### Nível 2 — O cotidiano realista
- **Gênero:** slice-of-life contemporâneo. Sai o reino mágico, entra a vida
  adulta urbana (Nova York, profissões, redes sociais, voos de trabalho).
- **Abertura:** descrição de personagem (*"Since he was a small child, John
  Brown has been known as Red…"*).
- **Novidades permitidas:** cultura americana específica, emoção interior
  (nostalgia, irritação), cartas/mensagens transcritas, e o **primeiro final
  aberto/ambíguo** da coleção. Nomes próprios "normais" convivem com
  transparentes (Red, Summer, Rain).
- **Assinatura estrutural:** a **moldura circular** nasce aqui — o parágrafo
  de abertura reaparece quase literal no fim.

### Nível 3 — Voz e formato experimental
- **Gênero:** amplia para epistolar (livro inteiro em forma de carta) e
  mistério/sci-fi leve (sósia, multiverso). Diversidade cultural explícita
  (família muçulmana que não celebra Natal).
- **Novidades permitidas:** formatos não-lineares, vocabulário
  abstrato/técnico **ensinado dentro da história** (*"astronomy is about
  everything beyond Earth's atmosphere…"*), subtexto emocional, ganchos de
  gênero não resolvidos.
- **Diálogo:** naturalista, com interjeições (*"C'mon, Drew, stop the
  nonsense!"*).

### Nível 4 — Ironia conceitual
- **Gênero:** comédia de costumes conceitual (a rotina obsessiva de um
  aposentado; um namorado-robô como sátira social).
- **Técnica notável:** vocabulário avançado entregue em **listas glosadas
  dentro da ficção** — palavras-cruzadas no enredo definem palavras
  (*"A door, gate, or passage used for entering a place, eight letters:
  entrance"*).
- **Novidades permitidas:** ironia sustentada, referências eruditas
  (Pigmalião, My Fair Lady) explicadas no texto, repetição como recurso
  TEMÁTICO (a rotina repetida 3× com micro-variações que mostram a mudança
  interior). Etiquetas de fala começam a variar (*argued, pressed, agreed*).

### Nível 5 — Primeira pessoa e gênero pleno
- **Gênero:** drama familiar e **terror psicológico que assusta de verdade**.
- **Novidades permitidas:** narrador em 1ª pessoa com voz própria, registro
  sensorial visceral (*"it was dark and damp and smelt of dust, mold, and cat
  piss"*), emoção real (medo, raiva adolescente), finais ambíguos de gênero.
- **Apoio:** os chunks de tradução crescem (3,8 palavras) e os tips quase
  somem (7%) — o leitor é tratado como autônomo.

### Nível 6 — Sátira e voz autoral
- **Gênero:** sátira social e ficção especulativa (alienígena na Casa Branca;
  distopia da indústria da beleza).
- **Novidades permitidas:** narrador metaficcional intrusivo (o tique *"but I
  digress"*, o aparte *"I apologize to you, dear reader"*), crítica social
  explícita, vocabulário técnico-jornalístico sem glosa, **finais sombrios e
  sem redenção** (a protagonista cai no golpe seguinte, idêntico).
- A tradução agora é por frase inteira (chunk de 10 palavras).

### Nível 7 — Quase literatura adulta
- **Gênero:** rom-com metaficcional e **não-ficção literária embutida**
  (reportagem sobre uma curandeira Comanche real dentro de uma ficção).
- **Novidades permitidas:** conteúdo factual denso (história, psicanálise,
  Woodstock) com glosas enciclopédicas naturais, histórias-dentro-de-histórias
  (mise en abyme), registro jornalístico, e **quebra da quarta parede como
  fecho** (*"And what about you? What is your story?"*).

---

## 5. O DNA transversal (técnicas presentes em todos os níveis)

1. **Elenco fixo de nomes transparentes reaproveitado entre livros** — May,
   Drew, Summer, Rain, Dawn, June, Forest, River, Rose, Hope, Bear, Sky,
   Autumn; animais como Green, Blue Dog, Sugar. São substantivos comuns:
   cada nome é vocabulário ensinado de graça, e a recorrência entre livros
   cria familiaridade (há até piadas internas entre níveis).
2. **Moldura circular** — abertura que reaparece no fim (andaime no N1–N2;
   recurso temático do N4 em diante). É a assinatura estilística da coleção.
3. **Glosa embutida** — nenhuma palavra nova fica sem reformulação no próprio
   texto (ver §2.6).
4. **Diálogo abundante** (50–69% dos parágrafos em todos os níveis) com
   etiquetas neutras (*said/asked*) nos níveis baixos, variadas nos altos.
5. **Universo compartilhado** — americano-urbano (NY recorrente),
   deliberadamente multicultural, com objetos de conforto recorrentes (café,
   pizza, cachorros, outono). Para outro idioma: criar o universo equivalente
   da cultura-alvo.
6. **Progressão de maturidade emocional junto com a linguística** — moral
   consoladora → calor humano → suspense → ironia → medo/emoção → cinismo →
   reflexão adulta. O leitor "cresce" junto com a língua.
7. **Frases naturais desde o N1** — a dificuldade nunca é resolvida mutilando
   a língua, e sim aumentando o apoio.

---

## 6. O sistema de apoio (especificação dos dados)

### 6.1 `*.sentences.json` — leitura assistida (formato do app)

Array de tokens em ordem de leitura. Schema:

```jsonc
[
  {
    "text": "Once upon a time",   // chunk EXIBIDO (sintagma, não frase)
    "newLine": true,              // true = abre parágrafo novo
    "translation": {              // null em tokens-separadores (", ", " ", ". ")
      "text": "Era uma vez",      // tradução do chunk
      "tips": [                   // detalhamento palavra a palavra (pode ser [])
        { "text": "Once", "translatedText": "Certa vez", "explanation": null },
        { "text": "upon a time", "translatedText": "em uma época",
          "explanation": "A tradução literal pode ser substituída pela expressão equivalente \"Era uma vez\", usada em introduções de contos de fadas." }
      ]
    }
  },
  { "text": ", ", "newLine": false, "translation": null }  // pontuação à parte
]
```

Regras observadas no corpus:
- **Chunk = sintagma com sentido próprio** (sujeito, locução verbal, adjunto),
  nunca quebra no meio de uma colocação. Tamanho-alvo por nível: ~2–3 palavras
  (N1–N4), ~4 (N5), frase inteira (N6–N7).
- **Pontuação e espaços são tokens separados com `translation: null`** — o
  app só torna clicável o que tem tradução.
- A tradução do chunk é **contextual** (não literal): *"It was a"* → "Ela era
  uma" (resolve o referente). Quando a tradução acrescenta/omite palavras, a
  nota explica (*"A palavra 'que' foi acrescentada na tradução para dar
  sentido à frase"*).
- **Tips** = subdivisão do chunk com tradução literal de cada parte; a tip
  carrega `explanation` quando há armadilha (tradução não-literal, gramática,
  cultura, idiom).

### 6.2 Tipologia das notas pedagógicas (`explanation`)

| Nível | Foco predominante | Exemplo real |
|---|---|---|
| N1 (≈38/livro) | Mecânica da tradução (palavras acrescentadas/alteradas), expressões equivalentes | "Acrescentamos 'uma boa' para dar sentido à frase…" |
| N2–N3 (≈15/livro) | Pontos de gramática (genitivo `'s`, phrasal verbs) + referências culturais | "O 'apóstrofo + s' indica posse em inglês." |
| N4–N5 (≈2–4/livro) | Idioms com tradução literal + sentido ("Literalmente X, essa expressão significa…") e cultura (bagel, Advent Calendar, AP) | "[head over heels → caidinha] Literalmente 'cabeça sobre calcanhares'…" |
| N6–N7 (≈2/livro) | Usos finos da língua (singular *they*), expressões raras, realia | "[as lost as a goose in a snowstorm] …" |

O padrão de redação é estável: **frase curta, direta, em registro de professor
amigável, sempre que possível com a tradução literal entre o original e o
sentido**.

### 6.3 `info.txt` — metadados por livro

```
Título: The Boy Who Could Not Tell The Truth
ID: 23
Nível: 1
Narrador: Natalie
Duração do áudio (min): 15.9
Palavras únicas: 377
```

### 6.4 `*.bilingue.md` — versão de estudo

Cabeçalho (`# Título` + linha `**Nível:** … · **Narrador:** … · **Palavras
únicas:** …` + `---`), e o corpo intercalado **por parágrafo**: blockquote com
o parágrafo inteiro em inglês, linha em branco, e o mesmo parágrafo em
português em itálico — sendo o português a **concatenação dos chunks** (com
parênteses marcando palavras implícitas: `(que)`, `(não)`), para alinhamento
visual, não fluência.

---

## 7. Pipeline de produção para um novo idioma

### Etapa 0 — Fundações da coleção (uma vez por idioma)
1. **Lista de frequência do idioma-alvo** (2.000–3.000 palavras mais
   frequentes; ex.: subtlex ou corpus jornalístico+ficção). Será o critério
   de "palavra básica" vs. "palavra que precisa de glosa/tip".
2. **Elenco de nomes falantes** no idioma-alvo (substantivos comuns usáveis
   como nome: equivalentes de May/Summer/Bear) — 20–30 nomes para reutilizar.
3. **Universo cultural** — escolher a ambientação-âncora (a "Nova York" da
   coleção) e os objetos de conforto recorrentes.
4. **Fórmula de abertura do N1** (o "Once upon a time" canônico do idioma).
5. **Guia de chunking** — definir como segmentar sintagmas no par
   idioma-alvo ↔ idioma do aluno (chunks de 2–3 palavras que se traduzem com
   naturalidade).

### Etapa 1 — Escrever a história (por livro)
Checklist de escrita, na ordem:
1. Escolha o **gênero permitido pelo nível** (§4) e um tema do universo.
2. Defina o arco com **moldura circular** e o fecho típico do nível
   (moral+twist no N1 … quarta parede no N7).
3. Escreva em **linguagem natural** — frases de ~15 palavras, sem mutilar a
   língua; no N1, coordene com e/mas/então em vez de subordinar.
4. **Orce o vocabulário**: alvo de palavras únicas do nível (tabela §3).
   Toda palavra fora da lista básica deve (a) ser glosada no texto, (b)
   repetir-se ≥2× no livro, ou (c) virar tip com nota.
5. **Recicle**: ≥60–80% do vocabulário deve já existir nos níveis anteriores
   da coleção (tabela de novidade, §3).
6. No N1: repita as estruturas-chave **3× literalmente**; garanta média de
   ≥4 ocorrências por palavra única (TTR ≤ 0,25).
7. Diálogo em ≥50% dos parágrafos; etiquetas neutras até o N3.
8. Valide com o **script de métricas** (ver Etapa 4).

### Etapa 2 — Produzir o apoio
1. **Segmentar em chunks** conforme o guia (tamanho-alvo do nível).
2. **Traduzir cada chunk contextualmente** (resolver referentes, marcar
   implícitos com parênteses).
3. **Gerar tips** (subdivisão literal) na densidade-alvo do nível (23% dos
   chunks no N1 → 2–3% no N6–7).
4. **Escrever as notas** seguindo a tipologia §6.2 e a cota do nível.
5. Montar `sentences.json` (pontuação como tokens separados, `newLine` por
   parágrafo), `bilingue.md` e `info.txt`.

### Etapa 3 — Áudio e capa
- Narração integral por uma voz consistente por coleção (1 narrador
  predominante; velocidade tranquila ≈ 110–130 wpm — os livros de ~1.600
  palavras duram ~14 min).
- Capa ilustrada flat com o **número do nível integrado à arte**.

### Etapa 4 — Controle de qualidade (métricas de aceitação)
Validar cada livro contra a tabela §3 (scripts deste repositório:
`scripts/analyze-readers.mjs`, `analyze-grammar.mjs`, `analyze-vocab.mjs`):

| Checagem | Critério |
|---|---|
| Palavras totais | dentro da faixa do nível |
| Palavras únicas | ±10% do alvo do nível |
| TTR | ≤0,25 no N1; 0,30–0,36 nos demais |
| Cobertura básica | ≥94% no N1 … ≥80% no N7 (pela lista de frequência) |
| Densidade de tips | conforme tabela §3 |
| Notas pedagógicas | conforme cota do nível |
| % diálogo | ≥50% dos parágrafos |
| Glosa embutida | toda palavra nova reformulada no texto (revisão humana) |
| Leitura-prova | um falante do nível-alvo termina sem dicionário externo |

---

## 8. Adaptação a outros idiomas — decisões específicas

1. **Cognatos**: o par EN→PT-BR se apoia em cognatos latinos abundantes
   (*important, decided, family*). Para pares com poucos cognatos
   (japonês→PT, por ex.), compense com: mais repetição no N1, chunks menores
   por mais níveis, e mais tips de pronúncia/escrita.
2. **Chunking depende da sintaxe do par**: em idiomas SOV ou aglutinantes, o
   chunk natural pode ser o "bunsetsu"/sintagma posposicional; a regra
   invariante é **chunk = unidade que se traduz com naturalidade isolada**.
3. **Nomes falantes precisam funcionar no idioma-alvo** — traduzir o
   mecanismo, não os nomes (em espanhol: *Bocagrande*; em francês:
   *Grande-Bouche*).
4. **A âncora cultural deve ser a cultura do idioma-alvo** (para um graded de
   espanhol: México/Espanha como a "NY" da coleção), com a mesma estratégia
   de diversidade e de glosa cultural para realia.
5. **A fórmula do N1** muda de superfície, não de função: "Era uma vez",
   "Érase una vez", "Il était une fois", "昔々" — sempre o sinal de "história
   segura, mundo conhecido".
6. **O que NÃO muda**: gramática natural desde o N1; progressão por carga
   lexical + apoio + maturidade; glosa embutida; moldura circular; diálogo
   abundante; repetição engenheirada no N1; métrica em palavras únicas.

---

## 9. Resumo executivo (uma página)

- A qualidade da coleção vem de **histórias genuinamente boas** (com twist,
  humor e emoção calibrados por nível) escritas em **língua natural não
  mutilada**, onde a dificuldade é administrada por **vocabulário orçado,
  repetição engenheirada e apoio decrescente** — não por gramática liberada
  aos poucos.
- O leitor é sustentado por três camadas que **desaparecem gradualmente**:
  tradução por chunk (2 palavras → frase inteira), tips palavra a palavra
  (23% → 2%) e notas pedagógicas (38 → 2 por livro).
- O texto se auto-explica: **glosa embutida** para tudo que é novo, nomes
  falantes, e estruturas repetidas como andaime.
- A coleção forma um **curso de ~12.300 palavras em 195 histórias**, com
  ~30 livros por nível para garantir o volume da leitura extensiva.
- Para replicar em outro idioma: montar as fundações da Etapa 0, escrever
  pelo checklist da Etapa 1, produzir o apoio no formato §6 e aceitar cada
  livro pelas métricas da Etapa 4.

---

*Fontes: corpus completo em `/graded-readers` e `/data/content`; scripts de
análise em `/scripts/analyze-*.mjs`; análise editorial de 14 livros (2 por
nível). Números = medianas/médias do corpus real.*
