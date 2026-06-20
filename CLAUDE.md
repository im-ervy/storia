# CLAUDE.md

Guia para o Claude Code trabalhar neste repositório.

## O que é

Réplica full-stack da plataforma **gradedreaders.com** (Graded Readers by
Mairo Vergara), reconstruída a partir de capturas HAR e de um dump completo
dos 195 livros originais (inglês, níveis 1–7). A UI replica pixel a pixel o
site original: biblioteca, modo leitura paginado com tradução por chunk +
tips + notas, tela de congratulation, avaliação, progresso persistido.

Além da réplica, o projeto **expande a coleção para novos idiomas** (francês
já tem 2 livros) recriando os gradeds originais com a mesma metodologia —
ver §"Produzir um novo graded" abaixo.

## Comandos

```bash
npm run dev      # dev server em http://localhost:3000
npm run build    # build de produção — NUNCA rodar com o dev server ativo
                 # (sobrescreve .next e derruba o dev com "Cannot find module")
npx tsc --noEmit # typecheck rápido

npm run seed     # regenera /data a partir das capturas HAR em /raw
npm run ingest   # ingere o dump completo /graded-readers -> data/ (195 livros EN)
node scripts/assemble-fr.mjs   # monta os livros franceses (seções -> content/ + catálogo)
node scripts/assemble-zh.mjs   # monta os livros de mandarim (lossless sem espaços, métricas por caractere Han)

# Análise/QA do corpus (métricas do guia)
node scripts/analyze-readers.mjs   # palavras/únicas/TTR/frases/chunks/tips por nível
node scripts/analyze-grammar.mjs   # marcadores gramaticais por 1000 palavras
node scripts/analyze-vocab.mjs     # cobertura lexical + amostras de notas

# Testes visuais (puppeteer-core + Chrome local; dev server precisa estar rodando)
node scripts/test23.mjs            # desktop: temas, tooltip, paginação
node scripts/test23-mobile.mjs     # mobile: menu, barra inferior
node scripts/test23-overflow.mjs   # folheia o livro inteiro em 5 viewports (sem estouro)
node scripts/test-fr.mjs           # fluxo do idioma francês
node scripts/test-finish-flow.mjs  # finalizar -> congratulation -> avaliar
```

Não há testes unitários; a validação é typecheck + scripts visuais acima +
checks de lossless nos scripts de montagem.

## Arquitetura

- **Next.js 15 App Router + TypeScript**, sem banco: dados em JSON (`/data`),
  carregados uma vez por processo em `src/lib/data.ts`. Progresso e notas do
  usuário persistem em `data/userState.json` (gitignored); o estado-base
  espelha a conta capturada no HAR (9 lidos, 1.275 palavras únicas).
- **APIs** em `src/app/api/...` espelham os endpoints originais (nomes de
  params idênticos: `filter.level`, `paging.skip`, `scoreValue`...). Fluxo de
  finalização real: `PUT user/readTextsInfo/{id}` → `PUT reader/{id}/finish` →
  tela `/reading/{id}/congratulation` → `POST reader/{id}/score`.
- **Conteúdo**: `data/content/{id}.json` = `{id, total, tokens[]}`. Token:
  `{text, newLine, translation: {text, tips: [{text, translatedText,
  explanation|null}]} | null}`. Pontuação/espaços são tokens separados com
  `translation: null`. Invariante: concatenar todos os `text` reproduz o
  texto integral (parágrafos unidos sem `\n`; `newLine: true` abre parágrafo).
- **Idiomas**: catálogo EN em `data/readers.json` (ingerido do dump);
  outros idiomas em `data/readers-<lang>.json` com campo `lang` (ids 10000+
  para não colidir). `data.ts` mescla tudo; `queryReaders`/`getLevels`
  filtram por `lang`; a API recebe `filter.lang` / `?lang=`. O idioma ativo
  fica em `localStorage['gr-lang']` (seletor no dropdown do perfil em
  `Header.tsx`); o ReaderView usa a voz TTS do idioma (`lang` do catálogo).
- **UI replicada do original** (estilos extraídos dos bundles Angular
  compilados — dumps de referência em `assets_raw/js/_*.css|txt`, gitignored):
  - `ReaderView.tsx` — modo leitura: paginação por MEDIÇÃO real do texto
    (div oculta com a métrica exata por viewport), temas branco/preto/sépia,
    tooltip de tradução, setas laterais, swipe, barra de progresso. Toggle
    **"Notas"** no header (todos os idiomas, opt-in, `localStorage['gr-notes-
    highlight']`): underline pontilhado nos tokens que têm `explanation`
    (falsos amigos, ser/estar, notas culturais, gramática) p/ o leitor achar
    os pontos pedagógicos sem passar o mouse em tudo — não afeta a métrica de
    paginação (`text-decoration`). Default desligado p/ preservar a réplica.
  - `Header.tsx` — header logado (logo, contador de palavras, painel do
    usuário com dropdown: cadastro/contato/tutorial/idioma/sair) + bottom-nav
    mobile + overlay do vídeo tutorial.
  - `LibraryView.tsx` / `ReaderCard.tsx` — faixa de filtros sticky + linhas.
  - `Congratulation.tsx` — 4 estágios com count-up e avaliação por estrelas.

## Documentos importantes

- `docs/GUIA-PRODUCAO-GRADED-READERS.md` — **a bíblia do projeto**:
  engenharia reversa da coleção (especificações por nível, DNA de escrita,
  formato dos dados, pipeline de produção). Consultar SEMPRE antes de
  escrever/anotar um livro novo.
- `docs/COMPARATIVO-MAIRO-VS-MULTILINGUE.md` — veredito vs. o sistema
  multi-idioma irmão (`C:\Users\{user}\projetos\meus\graded-readers`) e a
  prescrição híbrida.

## Produzir um novo graded (receita usada no francês)

O processo que criou os livros franceses 10001–10030 — **o Nível 1 francês
está COMPLETO** (30 livros, réplicas dos EN #1–#30; coleção: ~48 mil
palavras, 2.269 formas/~1.309 famílias, exposição média 22,4×, ~1.290
notas PT-BR, reciclagem estabilizada em 92–97%).

**O Nível 2 francês está COMPLETO** (30 livros, 10031–10060, réplicas dos
EN N2 em ordem alfabética #01–#30 da pasta `Nivel 2`). Métricas N2 estáveis:
~1.120–1.730 palavras, TTR 0,30–0,40, ~20 explanations/livro (5/seção),
~300–610 tips, reciclagem 81–93%. Muitos livros do N2 formam um **universo
interconectado** (o menino August/Auguste; nomes de meses Mai/Juin/Auguste;
Madame Blanche; Pierre; cães dourados de olhos azuis — Ocean/Océane,
Yellow/Jaune, Sun/Soleil — que ecoam Le Chien Bleu) e usam muitos **nomes
falantes** traduzidos pelo mecanismo (Espérance, Pluie, Soleil, Printemps,
Justice, Rivière, Capitaine, a ladainha Nuage/Étoile/…): preservar esses
ecos.

**O Nível 3 francês está COMPLETO** (30 livros, 10061–10090, réplicas dos EN
N3 em ordem alfabética #01–#30 da pasta `Nivel 3`). Métricas
N3 estáveis: ~1.370–1.730 palavras, **TTR 0,31–0,38** (mais alto que N1/N2 —
o N3 amplia vocabulário abstrato/técnico, formatos experimentais e listas
como manchetes de jornal/fortunas de biscoito, que puxam o TTR p/ cima;
contos muito list-heavy saem ~0,40 na 1ª versão — abaixar com 1 parágrafo de
narrativa reciclada, como em 10068), ~20 explanations/livro (5/seção),
~430–530 chunks traduzidos / ~600–800 tips, reciclagem 75–89%. Perfil N3
(ver guia §4): voz e formato experimental — epistolar, mistério/sci-fi leve,
1ª pessoa, narrador metaficcional que fala ao leitor, diversidade cultural
explícita; PASSÉ SIMPLE da narração literária aparece aqui. Nomes falantes
continuam (Rouge/Tache = joaninhas-poltergeist; Été/Hiver/Automne/Printemps;
Lune). Recursos N3 já usados: moldura circular (Le Club de Cuisine), blocos
descritivos repetidos quase literais como andaime estrutural (Le Savant Fou:
a invenção; La Galerie Sombre: a sala branca + o refrão "rien d'autre que de
la peinture blanche" + as listas da "revelação"), twist de identidade (Le
Voisin Grincheux), final aberto/gancho de gênero não resolvido (Le Sosie:
o multivers). Sobrenome recorrente da coleção: **Brown** (Drew M. Brown em
Le Sosie; Ethan Rodriguez Brown em Je Sais Que Je Ne Sais Rien; May Lily
Brown, a comandante-heroína de Le Correspondant sur Mars). #16–#20 já feitos:
Le Luddite (10076, sci-fi leve — IA Pepper/Blue May em crise existencial;
Février né en mars, Rivière, Madame Lune), Le Correspondant sur Mars (10077,
ensaio jornalístico em 1ª pessoa — list-heavy, saiu 0,40 e foi baixado a 0,37
com 2 parágrafos de rotina/reflexão reciclada, cf. aprendizado (d)), La Réunion
(10078, comédia + narrador metaficcional que se desculpa por ser prolixo;
Tempête é calmo apesar do nome; alucinações oníricas na reunião de Monsieur
Vert), Le Miroir (10079, fantástico em 1ª pessoa feminina — espelho que
teletransporta pelo pensamento; CUIDADO: o poema tem versos separados por
LINHA EM BRANCO DUPLA na fonte, então cada verso é um parágrafo próprio
[newLine] e juntam-se SEM espaço no lossless), L'Académie des Cauchemars
(10080, terror/humor — Docteur Blanche cura cauchemars; Joie/"sans joie").
#21–#25 já feitos: **La Carte Postale (1/2/3)** — TRILOGIA (10081/10082/10083,
réplicas dos EN #21–#23). Mesmo elenco nos 3: cidade Roche Grise; Juin
(rédac-chef), Forêt, Espérance (a jovem repórter), Auguste (postier); Laure
dita **Moineau** (= Birdie/"Pardal", termo de carinho) e James dito **Geai**
(= Jay/gaio — eco dos "geais bleus" no fim do #3); ecos de meses/nomes falantes
(Mai/filha, Rivière/filho, oncle Vert, tante Rose, Été, Ciel). A CARTA (texto
em 1ª pessoa) repete-se IDÊNTICA nos 3 livros — ótimo andaime de reciclagem
(p1=biografia de Moineau, p3=biografia de Geai/Vietnã, sem suavizar). CUIDADO:
listas de "bourdonnement" da redação (#21) puxam o TTR p/ cima — baixei com
1 parágrafo de narrativa reciclada (Espérance relendo a carta), cf. (d). **Le
Pouvoir de l'Amour** (10084, réplica do EN #24) — 1ª pessoa, narrador tímido
que treina FRASES DIFÍCEIS no espelho (vocabulário abstrato repetido em blocos
→ TTR baixo 0,33; repetição = reciclagem); Rose, Josh, citações de Roméo et
Juliette; nota cultural campeã: **« Merde ! » = "boa sorte" no teatro** (não
"bonne chance"). **La Rivière de la Vie** (10085, réplica do EN #25) — 1ª
pessoa, **Pierre** (advogado em NY, nome recorrente) + **Madame Brown** (eco do
sobrenome Brown) + o gato Prince + Ximena (diversidade); provérbio de Heráclito
no fecho; tisane/faire les courses/décéder como notas. Métricas #21–#25: ~1.530–
1.616 palavras, TTR 0,33–0,37, 20 expl/livro, reciclagem 83–92%. **#26–#30 já
feitos** (fecham o N3): **L'Attraction au Bord de la Route** (10086, réplica do
EN #26 — comédia Scooby-Doo + narrador metaficcional; trio Juin/Ciel/Drew na
estrada; arma/criminosos sem suavizar; "Nom d'un chien !", attractions au bord
de la route), **La Colocataire** (10087, EN #27 — Zoé + fantasma poltergeist
Peggy em NY; passa de vous→tu ao ficarem íntimas; assassinada pelo noivo
ciumento sem suavizar; gato **Poivre** = Pepper; "Merde !"/"Quel salaud !"),
**La Guerre de l'Orthographe** (10088, EN #28 — "spelling bee" recriado como
**concours d'orthographe** [a tradição da dictée]: aproveitei as armadilhas
ortográficas do francês — letras mudas em "tabac", "chrysanthème"/"psammophile"
— como notas; "avoir bon/faux", "tirs au but"; Mai/Art/Unique/Soleil, Madame
Brown grávida), **L'Histoire d'une Histoire** (10089, EN #29 — Dorée [= Golden]
no metrô ouvindo retalhos de conversas [list-heavy → TTR 0,38, baixei com 1
parágrafo repetitivo "écoutait, écoutait..."]; "la nouvelle" = conto, falso
amigo; clã Printemps/Rivière/Ciel/Été/Hiver/Soleil; Docteure Brown),
**Le Blagueur** (10090, EN #30 — vilão de horror que conta piadas com efeito
retardado; **Mardi Cœur** [= Tuesday Heart] resiste ao riso apresentando o
telejornal; REFRÃO "elle ne plaisante pas..." repetido ~6× = ótima reciclagem
que segura o TTR; le Croque-mitaine = bicho-papão, "le journal" = telejornal).
Métricas #26–#30: ~1.535–1.691 palavras, TTR 0,35–0,37, 20 expl/livro,
reciclagem 82–84%.

**O Nível 4 francês começou** (réplicas dos EN N4 em ordem alfabética da pasta
`Nivel 4`; ids 10091+, campo `level: 4`). Perfil N4 (guia §4): **ironia
conceitual** — comédia de costumes; vocabulário avançado entregue em **listas
glosadas dentro da ficção**; **repetição como recurso TEMÁTICO** (a rotina
repetida 3× com micro-variações). Métricas N4 alvo: ~1.700–1.900 palavras
(mais longos que N3), **TTR 0,33–0,39**, ~20 expl/livro (5/seção), ~530–630
chunks/tips, reciclagem 78–84% (cai um pouco — o N4 traz "cotidiano fino":
supermarché, bagel, deli, pastrami, puzzle…). **#01–#05 já feitos** e formam um
**universo interconectado** com nomes recorrentes da coleção que reaparecem com
referentes DIFERENTES entre os livros (preservar esses ecos): **Un Homme
d'Habitudes** (10091, EN #01 — Arthur Blanc dit « Art », prof. de espanhol
aposentado, rotina obsessiva; o aluno Drew Smith e o café; **mots croisés**
com definições de dicionário no enredo = a técnica N4 das listas glosadas, com
a contagem de letras virando nota ortográfica; `pain perdu` = French toast;
imperfeito de hábito vs passé simple; `librairie`≠biblioteca), **Un Cours de
Méditation** (10092, EN #02 — Bernard dit « Ours » [Bear], prof. de maths, fluxo
de consciência na meditação; **refrão** "Inspirer. Retenir. Expirer. Retenir."
~7× = reciclagem que segura o TTR; mito de Orphée et Eurydice/Hadès/les Enfers;
**blagues/trocadilhos** viram ótimas notas — "raconter des salades", T=thé,
"bien armée"; Rivière, Joie, Grâce; TTR 0,37 alto, aceito pela natureza
filosófica), **Une Nouvelle Vie Vous Attend** (10093, EN #03 — 1ª pessoa,
narradora Grâce + agência da Fleur; **moldura circular**: o anúncio repetido
quase idêntico no início e no fim = reciclagem; idioms-campeões "châteaux en
Espagne"=sonho impossível, "mettre la charrue avant les bœufs"; CV, numéro vert
0800, "cliente mystère", friperie; a lista enorme de empregos list-heavy),
**Invasion Extraterrestre** (10094, EN #04 — Florencia dite Fleur [marketing] +
o extraterrestre que ela rebatiza **Rivière**; a criatura é tratada no FEMININO
[la créature→elle]; "Le temps c'est de l'argent", deli/pastrami, Étoile de la
Mort, Le Roi Lion; passé simple narrativo), **Presque Poète** (10095, EN #05 —
lycéens Rivière [sonha ser médecin du sport] + Grâce [rat de bibliothèque];
**madame Colline** [= Ms. Hill]; o irmãozinho **Auguste Blanc** [= August White,
ECO de Arthur Blanc do 10091 e do universo August/Auguste do N2]; recriação do
**Dada/Tristan Tzara**: a receita real "Pour faire un poème dadaïste" + poemas-
colagem de não-sense [cada verso é parágrafo próprio, junta sem espaço no
lossless, como Le Miroir]; "lever les yeux au ciel", "Les roses sont rouges…"
[template inglês]; ironia conceitual N4 no fecho: tira a melhor nota mas
continua odiando poesia; TTR 0,39, alto por causa dos poemas Dada inerentemente
únicos — aceito sem forçar padding). **#06–#10 já feitos** (ids 10096–10100,
métricas N4 estáveis: ~1.863–1.885 palavras, TTR 0,34–0,36, 20 expl/livro,
reciclagem 84–88% — a mais alta do N4, a coleção já recicla muito): **Presque
Ingénieure** (10096, EN #06 — menina **Été** [6 anos] que quase vira engenheira;
pais **Olive** [prof. de inglês] + **Rivière** [engenheiro], cão **Étoile**,
tante **Rose**, gato **Tache**, patrão **Jonas**; Alice au Pays des Merveilles +
o poema "Scintille, scintille…" [cada verso é parágrafo próprio, junta sem espaço
no lossless, como Le Miroir]; **listas glosadas N4** das palavras de engenharia
[« béton », « licence »…] e dos "mots préférés"; nota campeã **faillir + inf** =
"quase fazer algo" [eco do título "Presque"]; "courriel"=e-mail, "le goûter",
"la fac", "tisane"), **Une Amitié Extraterrestre** (10097, EN #07 — universo-mãe:
o alien cientista **Will** [dim. de William] vira **Art** [dim. d'Arthur, ECO de
Arthur Blanc] + amigo imigrante sem papéis **Rivière** [dim. de Rivaldo] + **Lys**
[garçonete]; conteúdo político PESADO da notícia de jornal sem suavizar [bombes,
réfugiés, renversement, arrêter]; abertura repetida quase literal = andaime;
notas: **"supporter"=aguentar** e **"avocat"=advogado/abacate** [falsos amigos],
"manquer à qqn"=fazer falta [estrutura-espelho], "sens dessus dessous", "bonheur
douloureux"=tema), **Quelle Poisse !** (10098, EN #08 "Bummer" — **REFRÃO**
« Quelle poisse ! » repetido o livro inteiro ~9× [= "que azar/que saco", segura
o TTR de graça] gritado por **Rose** no fecho; adolescentes **Joie** + **Grâce**
presas na tempestade; **Auguste** na escola; jogos **« Action ou Vérité »** e a
lista **« Tu préfères… ou… ? »** [list-heavy, mas condensei a lista do original e
o refrão segurou o TTR em 0,34, cf. (d)/(e)]; divórcio/morte sem suavizar;
"réviser"=estudar [falso amigo], "mettre à la porte", "jouer à cache-cache"),
**L'Avenir et le Présent** (10099, EN #09 — 4 lycéens **Art**/**Olive**/**Joie**/
**Rivière** [referentes DIFERENTES dos outros livros — preservar o eco] discutem
o futuro profissional com **Mme Rodriguez**; **Josh** [primo no Canadá], **Auguste**
[primo, "soul-searching"]; **jeu de mots** Art/arts plastiques perdido em "monsieur
**Lejeune**" [= Young]; notas: "maîtresse de maternelle", "les arts plastiques",
"à la cantine", "lever les yeux au ciel"; narrador metaficcional no fecho),
**La Fièvre de l'Imagination** (10100, EN #10 — **Pierre** [= Clay; filho de um
poeta fracassado — ECO de Presque Poète; vira prof. de matemática racional] tem
sonhos surreais; **Docteur Sage** [= Dr. Wise] diagnostica a "fièvre de
l'imagination"; os sonhos são LISTADOS 2× [perguntas do médico + cena da praia]
= reciclagem embutida que segura o TTR apesar das imagens únicas, como os poemas
Dada; idiom campeão **"dormir comme un loir"**, "le Petit Chaperon Rouge"+pâté,
"joindre les deux bouts", "tisane de camomille" [refrão], vouvoiement com o
médico). **#11–#15 já feitos** (ids 10101–10105, métricas N4 estáveis:
~1.750–1.917 palavras, TTR 0,30–0,38, 20 expl/livro, ~550–585 tips, reciclagem
ALTÍSSIMA 85–90% — a coleção já recicla muitíssimo): **Lettres du Futur** (10101,
EN #11 — Jasmine dite « Jazz », estudante de terminale ansiosa com candidaturas;
recebe cartas do FUTURO assinadas por **Cash** [tímido bénévole da soupe
populaire que vira marido; apelido = anglicismo "cash/argent comptant"]; **Olive**
a melhor amiga; a CARTA repete-se quase idêntica início/meio/fim = reciclagem de
graça → TTR 0,30 o mais baixo do N4; notas: les Mets/Yankees, examen du barreau,
« Bien à toi » fecho de carta, lever les yeux au ciel), **Vider son Sac** (10102,
EN #12 "Off Your Chest" — TÍTULO = idiom "desabafar"; **Joie Coton** [= Joy
Cotton; a falsa psicóloga zomba do nome] confunde a avoada **Madame Brown**
[Esther, na sala de espera] com a psicóloga REAL **Madame Blanche** [= Ms. White;
ecos dos sobrenomes recorrentes Brown/Blanche]; chat **Monsieur Citrouille**;
list-heavy [a "expérience" de associação + a ladainha de perguntas] CONDENSADA p/
segurar o TTR, cf. (d); notas: tourner autour du pot, je suis tout ouïe, en avoir
gros sur le cœur, piquer une crise, tête en l'air, vouvoiement), **Univers
Parallèle** (10103, EN #13 — sci-fi: **William dit « Will »** preso num NY paralelo
absurdo [na verdade óculos de réalité virtuelle num salon de la technologie];
list-heavy [os panneaux numériques/anúncios absurdos] CONDENSADO de 11→6 + refrão
"Je suis en train de rêver, c'est sûr" → TTR 0,37; **Juin** [namorada na
boulangerie], **Rivière** [amigo que o acorda]; final aberto/gancho não resolvido
— a nave azul reaparece na vida real; notas: kiosque à journaux, feu piéton,
faire un bond, c'en était trop, n'en plus pouvoir), **Paréidolie** (10104, EN #14
— **Juniper dite « Juin »** vê rostos por toda parte; o irmão **Cassius dit « Cash »**
[ECO do Cash de 10101, referente DIFERENTE] explica paréidolie/ilusões de óptica;
**Rose** a amiga que se afasta; conteúdo técnico [grille de Hermann, escalier de
Penrose, Escher, canais de Marte] equilibrado com narrativa reciclada [sorvete,
parque, jantar] + REFRÃO final repetido por Juin; twist de horror no fecho com a
réplica dublada de **« Autant en emporte le vent »** [= Gone with the Wind]:
« Franchement, ma chère, c'est le cadet de mes soucis »; nota-estrela a
estrutura-espelho **« tu me manques »**=sinto sua falta), **Pygmalion** (10105,
EN #15 — **Été** [= Summer; engenheira-contadora tímida que vira confiante] fabrica
namorados ROBÔS; **Pierre dit « Le Roc »** [= Peter "The Rock"; TROCADILHO duplo:
pierre=pedra/rocha + alusão ao ator Dwayne "The Rock" Johnson — nota cultural
campeã] tem um "defeito" e dispara FRASES SOLTAS sem conexão [como os poemas Dada
de 10095; CONDENSEI de ~30→~10 frases p/ segurar o TTR, cf. (e)]; **Rose,
Espérance** [= Hope], **Auguste** [= August] os amigos; mito de Pygmalion/Aphrodite,
Geppetto/Pinocchio, Henry Higgins/« My Fair Lady »; acrescentei 1 parágrafo de
narrativa reciclada [o apê, os bichos, receber amigos] p/ baixar o TTR de 0,39→0,38,
cf. (d)). Próximo: N4 #16–#20 ou um novo idioma.

Aprendizados das rodadas: (a) listar no prompt de cada agente os pontos
gramaticais DO TRECHO dele — mas avisar que, se um ponto não existir no
texto da seção, ele deve substituí-lo por equivalente real (os cortes de
seção nem sempre batem com o resumo); (b) o teto de explanations por seção
é OBRIGATÓRIO no prompt (sem ele, os agentes geram 50+); mesmo com teto,
~1 agente em 8 estoura — conferir os totais ANTES do assemble e anular as
explanations excedentes via node (manter as prioritárias); (c) a métrica boa
de reciclagem cresce com a coleção (49% no livro 2 → ~75% do livro 5 em
diante). (d) Contos MODERNOS (#21, #25, #26, #28: metrô, jornal,
robô, viagem no tempo) saem curtos e com TTR alto na 1ª versão — expandir
com narrativa repetitiva reciclada (rotinas, listas com "Il y avait...",
pensamentos com vocabulário da coleção) até ≥1.350 palavras. O alvo de TTR
≤0,29 é do N1 (precedente: livros 4 e 7); **no N3 NÃO force até 0,29** — basta
trazer p/ dentro da faixa N3 (0,31–0,38). Em #29 (list-heavy) 1 parágrafo
repetitivo segurou 0,38; em #30 um REFRÃO repetido ~6× ("elle ne plaisante
pas, elle est totalement sérieuse...") já nasceu reciclando e ficou em 0,36 sem
padding extra — quando o original já tem um refrão, PRESERVE-O, é reciclagem de
graça. (e) Notas culturais que o usuário ama: priorizar SEMPRE 2-3 por seção
(maîtresse, métro-boulot-dodo, jouer à/de, quatre-vingts, bibliothèque vs
librairie, tisane, Croque-mitaine, "le journal"=telejornal...). (f) Quando o
enredo gira em torno de um mecanismo INTRADUZÍVEL (o "spelling bee" de #28
depende de soletrar inglês), recrie no equivalente cultural do idioma —
"concours d'orthographe"/dictée — e VIRE a dificuldade local em conteúdo:
as armadilhas ortográficas do francês (letras mudas, acentos, dobras) viraram
as melhores notas. Soletrar letra a letra ("C-H-R-Y-S-A-N-T-H-È-M-E.") é um
chunk de texto só; condensar a lista enorme do original em narração
repetitiva ("un point pour nous, un point pour eux...") evita o TTR alto.

### Espec por nível (alvo) + política de densidade

A receita abaixo vale para QUALQUER nível — só mudam os números. Os alvos por
nível estão na tabela-mestre do guia (§3), verificada contra os 195 originais
EN (medianas: palavras 1.6k/1.2k/1.5k/1.8k/2.0k/2.2k/2.6k do N1 ao N7; únicas
363→780; TTR 0,21/0,36/0,33/0,33/0,31/0,31/0,30; o N1 é o único com TTR baixo
porque é o mais reciclado — do N2 em diante o TTR fica ~0,30–0,36, NÃO force
≤0,26 fora do N1). O perfil editorial (o que escrever em cada nível) está no
guia §4. **CONSULTE o guia §3/§4 antes de começar um nível novo.** N8 não
existe no original (`levels.json`: nível 8 = 0 livros, indisponível) — não há
fonte para especificar.

**POLÍTICA DE DENSIDADE DO PROJETO (decisão consciente, diverge do original).**
No original EN a granularidade DESPENCA com o nível: o chunk de tradução vai de
~2,3 palavras (N1–N4) para **frase inteira (~10–11 palavras) em N6/N7**, o % de
chunks com tip cai de 21% → 2–3%, e as explanations caem de ~25/livro (N1) para
~1–4/livro (N4–N7). **As réplicas multi-idioma NÃO seguem esse decaimento**:
mantemos a granularidade fina (chunks de 2–4 palavras) e tips densos **SEM teto
em TODOS os níveis** (podem passar de 20/seção quanto mais difícil o vocabulário
— o nº de tips nunca é cortado). As **explanations** seguem por **prioridade**,
não por teto: ~5 de **alta** prioridade por seção (as imperdíveis) + quantas de
**baixa** prioridade fizerem sentido (mais em níveis altos), distinguidas por
COR no toggle "Notas" (ver "Notas com prioridade" abaixo). Motivo: o público é o
leitor PT-BR iniciante, que se beneficia do apoio denso mesmo em texto avançado.
Ou seja: do original copiamos comprimento, TTR, perfil editorial e tom (§3/§4 do
guia); a MECÂNICA de apoio é a do projeto (densa, em camadas de prioridade),
não a do original.

### 1. Escrever o texto (você mesmo, não delegar)
- Fonte: o original EN está em `graded-readers/Nivel N/<NN - Título>/<Título>.txt`.
- **FIDELIDADE DE TOM AO ORIGINAL — SEM CENSURA/SUAVIZAÇÃO.** É uma coleção
  para ADULTOS. Se o original tem conteúdo pesado (tiro/briga/prisão, doença,
  morte, álcool, etc.), o graded reproduz isso — NÃO ameniza nem corta para
  "deixar mais leve". Adaptar = recriar o texto nativamente no idioma
  (vocabulário reciclado, gramática do nível, nomes falantes), NÃO podar o
  enredo. Bônus: trechos assim viram ótimas notas (ex.: `tirer sur quelqu'un`
  = atirar/disparar, falso amigo de "tirar").
- Adaptar (não traduzir ao pé da letra) seguindo a espec do nível no guia §3/§4
  (palavras/TTR/parágrafos do nível na tabela §3; gênero/voz/estrutura no §4).
  **Comum a todos os níveis**: **nomes falantes traduzidos pelo mecanismo**
  (Big Mouth → Grande Bouche), estruturas repetidas preservadas como andaime,
  diálogo abundante, **reciclar ≥60–80% do vocabulário** dos livros anteriores.
  - N1: ~1.600–1.800 palavras, **TTR ≤ 0,26**, ~40–50 parágrafos, fórmula de
    abertura canônica ("Il était une fois"), 3 provas/3 irmãos, moral + twist
    no fecho.
  - N2: ~1.150–1.730 palavras, TTR ~0,30–0,40, slice-of-life adulto urbano,
    abertura por descrição de personagem, moldura circular, 1º final aberto.
  - N3: ~1.370–1.730 palavras, TTR 0,31–0,38, voz/formato experimental
    (epistolar, sci-fi leve, 1ª pessoa, metaficção), passé simple literário.
  - N4: ~1.700–1.900 palavras, TTR 0,33–0,39, ironia conceitual, listas
    glosadas dentro da ficção, repetição como recurso temático.
  - N5–N7 (ainda não iniciados nos multi-idioma): comprimento/TTR/perfil pela
    tabela §3 + §4 do guia (N5 ~2.0k 1ª pessoa+terror; N6 ~2.2k sátira+narrador
    metaficcional+finais sombrios; N7 ~2.6k quase-literatura adulta, não-ficção
    embutida, quebra da 4ª parede). **Apoio: granularidade densa do projeto**
    (chunks 2–4 palavras, ~5 explanations/seção), NÃO o chunk-por-frase do
    original — ver "política de densidade" acima.
- **Reciclar vocabulário dos livros anteriores do idioma** (≥60–80%).
- Salvar em `data/fr/<slug>.txt` (parágrafos separados por linha em branco).
- Validar métricas na hora:
  `node -e "...palavras/únicas/TTR/parágrafos..."` (ver exemplos no histórico
  ou usar o padrão do assemble).

### 2. Dividir em 4 seções e anotar com agentes paralelos
- Gerar `data/fr/_<id>-section-{1..4}.txt` (split por parágrafos, ~300–550
  palavras cada).
- Despachar **4 agentes em paralelo** (general-purpose, background), um por
  seção, com o prompt-padrão (ver os usados no histórico ou derivar):
  - formato do token (schema acima), referência de granularidade:
    `data/fr/_section-1.json` (livro 1);
  - **lossless obrigatório**: concat dos `text` === parágrafos unidos por ''
    (sem `\n`), caractere a caractere; o agente DEVE validar com node antes
    de retornar;
  - chunks de 2–4 palavras em **TODOS os níveis** (granularidade densa do
    projeto — NÃO copiar o chunk-por-frase de ~10 palavras do original EN em
    N6/N7); pontuação/espaço como tokens `translation: null`; `tips` SEMPRE
    array (nunca null);
  - tradução contextual PT-BR; nomes falantes sem traduzir no corpo, com
    significado na tip da 1ª menção;
  - **tips (glosa PT-BR) SEM teto NENHUM: quantas precisarem ter.** Glose todo
    chunk de conteúdo que um leitor PT-BR ganhe em ver traduzido — na prática,
    a grande maioria. NÃO limite/modere artificialmente a densidade (livros N1
    chegam a 200–380 tips; níveis mais altos ficam densos na mesma linha e
    **podem passar de 20/seção tranquilamente** — quanto mais vocabulário
    difícil, mais tips). O número de tips NUNCA é cortado.
  - **explanations (a nota pedagógica longa) por PRIORIDADE, não por teto
    rígido.** Em vez de cravar um número, marque cada explanation com
    prioridade. **Alta prioridade** = o ponto pedagógico essencial daquele
    trecho (falso amigo campeão, ser/estar, caso/aspecto, nota cultural que o
    usuário ama) — mire ~5 de alta por seção, são as imperdíveis. **Baixa
    prioridade** = nota útil porém secundária; em **níveis mais altos** (mais
    vocabulário difícil) ESTIMULE ter várias de baixa, sem limite. A UI
    distingue por COR do traçado do toggle "Notas" (alta = uma cor, baixa =
    outra), então o leitor escolhe o quão fundo quer ir. (Implementação da
    cor/prioridade: ver "Notas com prioridade" abaixo.) No prompt do agente,
    listar os pontos gramaticais do trecho e pedir que classifique cada
    explanation como alta/baixa.
- Saída de cada agente: `data/fr/_<id>-section-N.json`.

**Trecho de prompt pronto (colar no prompt de cada agente — bloco de notas):**

> **Notas pedagógicas (`explanation`) — densidade e prioridade.** Cada `tip`
> pode ter `explanation` (string) e `priority` ("high" ou "low"). Classifique
> TODA explanation:
> - `priority: "high"` — o ponto pedagógico ESSENCIAL do trecho: falso amigo
>   campeão, ser/estar (es)/auxiliar essere×avere (it)/caso ou aspecto
>   (ru)/partícula (ja)/classificador (zh), e as notas culturais de uso real.
>   **Máximo ~5 "high" nesta seção** — escolha as imperdíveis.
> - `priority: "low"` — nota útil porém secundária (gramática menor, etimologia,
>   variação de registro). **SEM limite**; quanto mais avançado o texto, mais
>   "low" pode haver. NÃO transforme conteúdo "low" em "high" para furar a cota.
>
> As `tips` que são só glosa PT-BR (sem `explanation`) continuam SEM teto e SEM
> `priority`. Liste abaixo os pontos do SEU trecho que merecem "high": [inserir
> os 4–6 pontos gramaticais/culturais da seção]. Se algum não existir no texto
> recortado, substitua por um equivalente real presente no trecho.

(Conferência pré-assemble: contar só as `explanation` com `priority:"high"` —
o teto ≈5/seção vale só p/ elas; "low" é livre. Ausência de `priority` =
tratada como "high" na UI, então não deixe explanation sem classificar nos
livros novos.)

### Notas com prioridade (camadas por cor — IMPLEMENTADO)

Como em níveis altos as explanations deixam de ter teto e passam a ser muitas,
elas têm **prioridade** para o leitor filtrar visualmente o quanto quer ver:
- **Schema** (`src/lib/types.ts`): `Tip` tem `priority?: 'high' | 'low'`.
  `high` = ponto pedagógico essencial; `low` = nota secundária. **Ausente conta
  como `high`** (compat: os ~150 livros já anotados ficam todos `high`, sem
  mudança visual). Lossless e demais campos inalterados; o assemble preserva o
  campo automaticamente (copia os tokens inteiros das seções).
- **Produção**: no prompt, os agentes classificam cada explanation; ~5 `high`
  por seção (as imperdíveis) + as `low` que fizerem sentido (mais em níveis
  altos). O check pré-assemble confere só o teto de `high` (≈5/seção); `low` é
  livre.
- **UI** (`ReaderView.tsx` + `.module.css`): `tokenNotePriority(token)` retorna
  a MAIOR prioridade entre as tips com explanation do token (`'high'|'low'|null`)
  e a render aplica `.hasNoteHigh` (cor forte: ciano `#36c2dc`, p&b `#8a8a8a`,
  sépia `#b08d57`) ou `.hasNoteLow` (tom suave/mais fino: `#a9c7d0` / `#c2c2c2`
  / `#d3c3a3`). O toggle "Notas" segue opt-in on/off. (Futuro possível: 3º
  estado alta-only → alta+baixa → off no mesmo botão, espelhando o `rubyMode`.)

### 3. Montar e registrar
- Adicionar o livro ao array `BOOKS` em `scripts/assemble-fr.mjs`
  (id sequencial 1000x, slug, título, prefixo das seções, capa — reutilizar a
  capa do original EN correspondente: `/covers/<id-en>-covers.png`; achar com
  `readers.json` pelo título EN).
- `node scripts/assemble-fr.mjs` — valida lossless, gera
  `data/content/<id>.json`, recalcula métricas e reescreve
  `data/readers-fr.json`.
- Acrescentar o id em `books` no `scripts/vocab-fr.mjs` e rodar para ver a
  reciclagem/acumulado da coleção.
- **Reiniciar o dev server** (catálogos são lidos no boot do processo).

### 4. Validar na UI
- Trocar para o idioma (localStorage `gr-lang` ou dropdown do perfil) e
  conferir: card na biblioteca, abertura do reader, tooltip com tips/notas,
  paginação. Screenshot via puppeteer (padrão `scripts/test-fr.mjs`).

### Novo IDIOMA (além do francês)
1. Acrescentar a sigla na lista de idiomas em `src/lib/data.ts`
   (`for (const lang of ['fr', 'zh', 'ru', 'ja', 'es'])` → adicionar) e criar
   `data/<lang>/`. Se o idioma usar escrita não-latina, incluir o range no
   `WORD_RE` de `data.ts` (Han `[一-鿿]`, cirílico `[а-яё]`, kana
   `[ぁ-ゖァ-ヺ々ー]`, …) p/ o contador de palavras.
2. Adicionar a opção no seletor do dropdown (`Header.tsx`, seção
   `langSection`) e o mapeamento de voz TTS no `ReaderView.tsx`
   (`speechLang`: 'es' → 'es-ES', etc.).
   - **Transliteração-ruby** (pinyin/translit acima do texto, com botão de
     toggle): se o idioma trouxer romanização antes do " — " em
     `translation.text`, basta incluí-lo em `hasTranslit` no `ReaderView.tsx`
     e definir `translitLabel`/`translitName`. A mecânica de ruby/medição já
     é genérica (vale p/ zh, ru e ja).
3. Definir as fundações do guia §7 Etapa 0: fórmula de abertura do N1 no
   idioma, elenco de nomes falantes, pontos gramaticais típicos para as notas
   (sempre voltadas a falantes de PT-BR).
4. Criar `scripts/assemble-<lang>.mjs` (copiar o fr) e seguir a receita acima.
5. Faixas de id por idioma: fr = 10001+, zh = 20001+, ru = 30001+,
   ja = 40001+, es = 50001+, it = 60001+, próximo = 70001+ (etc.), para
   nunca colidir com os ids EN (1–199).

### MANDARIM (zh) — fundações estabelecidas (livro 20001)
- Fórmula de abertura N1: 很久很久以前 ("era uma vez"); nomes falantes:
  小明 (o "Joãozinho" dos didáticos), 大嘴巴 (Boca Grande), 小绿 (Verdinho —
  nota cultural do 小 + nome para apelidos).
- **Formato do token**: `translation.text` = "pinyin com tons — tradução
  PT-BR" (pinyin OBRIGATÓRIO em todo chunk); tips de sub-palavra com
  `translatedText` = "pinyin = tradução literal"; explanations focam a
  lógica do chinês (classificadores 个/条/只/家, 的/了/吗/着, 不 vs 没,
  A比B, 一……就……, 您 vs 你, reduplicações, etimologias 马上/难看).
- Chunks = palavras naturais (词) de 1–5 caracteres; pontuação de largura
  total (。，！？：；、… e aspas) como tokens `translation: null`;
  lossless = parágrafos unidos por '' (chinês não tem espaços).
- Métricas N1 zh (livro 1): ~1.900 caracteres Han, ~260 únicos (faixa
  HSK1-2), exposição ~7×, ~50 parágrafos; `uniqueWordsNumber` do catálogo
  = caracteres únicos (o WORD_RE de `data.ts` conta cada Han como palavra).
- **Feitos: 20001–20003** (réplicas dos EN #1–#3). 20002 **快乐地** ("Lugar
  Feliz", EN #2 The Happy Place): nomes falantes pelo MECANISMO — 右手/左手
  (Mão Direita/Esquerda, os "Heróis Andarilhos" 会走路的英雄, eco do 会说话的
  do livro 1), 火眼 (Olhos de Fogo, o dragão), 蓝水 (Água Azul, o rio), 快乐地
  (a ilha onde os sonhos se realizam); 2.122 caracteres, 251 únicos, exposição
  8,5×, 43 parágrafos, 583 tips, 21 explanations (5/seção; a seção 1 nasceu com
  26 — anulei as excedentes via node, cf. aprendizado (b) do francês). Notas
  ricas do livro: classificadores 颗/条/封 (coração/dragão-rio-peixe/carta),
  为了 finalidade, 才 "só então", 一边……一边……, construção 把, 起来, 以为
  (≠想/觉得), 说话算数 ("ser homem de palavra"), 一……就……, 过 experiencial,
  对……来说, 让 causativo, 虽然……但是…… (a moral final do "conhecer a si
  mesmo"). Capa = original EN #2 (`/covers/25-covers.png`). 20003 **接生婆**
  ("A Parteira", EN #3 The Midwife): nomes falantes pelo MECANISMO — 小红
  (Xiǎo Hóng = Vermelha, a parteira; 小+cor, eco do 小绿/Verdinho), 小蓝
  (Azulzinho, o cão), 星星 (Estrela, a amiga dada por morta que vive sob o rio),
  强臂 (Qiáng Bì = Braço Forte, o marido dela — estilo 火眼/右手), 夏天 (Verão,
  o pretendente), 太阳 (Sol, o bebê), 水城 (Cidade da Água, a cidade secreta sob
  o leito do rio); 2.370 caracteres, 249 únicos, exposição 9,5×, 73 parágrafos
  (muito diálogo), 690 tips, 20 explanations (5/seção, todas dentro do teto —
  nenhuma anulação necessária). Conteúdo adulto preservado SEM suavizar (a
  quase-morte de Estrela no rio, a escolha de esquecer tudo via o pão mágico).
  Notas ricas do livro: complemento potencial NEGATIVO 站不住/出不来 (não
  conseguir...), direcionais 跳进/走出/想起, construção 把 (把…带到/把…告诉),
  以为 (≠想/觉得, recorrente), causativo 让, 为了 finalidade, classificadores
  块 (pão) e 口 (一口气=um suspiro), 这才 ("só então"), 一下 (ação breve),
  过 experiencial (见过), 从来没…过, 像…一样, 地 adverbial (小声地说),
  来到这个世界上 (=nascer). Capa = original EN #3 (`/covers/17-covers.png`).
  **Feitos: 20004–20005** (réplicas dos EN #4–#5; tryout=false a partir do #4).
  20004 **安娜的问题** ("As Perguntas da Anna", EN #4 Anna's Questions): conto
  MODERNO/realista, diálogo mãe-filha; nome próprio 安娜 (Anna), cão 蓝眼睛
  (Olhos Azuis, nome falante). Vocabulário ABSTRATO/cívico puxa os únicos p/
  cima (285, o mais alto do zh até aqui) e a reciclagem p/ baixo (71%) — é a
  natureza talky do original (igual à nota do ES #4): doença/ciência/economia/
  impostos/governo viram ótimas NOTAS, não se podam. 1.768 caracteres, 1.398
  tokens, 527 tips, 20 explanations (5/seção, todas no teto). Notas ricas:
  é...的 p/ perguntar profissão (你是做什么的), 到底 (afinal), complemento
  potencial 照顾得了/看得到, 由…做成 (ser feito de), 当老师 (当=exercer função),
  跑来跑去 / 大喊大叫 (reduplicação), 以为 (≠想/觉得), 一家 (classif. de
  empresa), 块 (classif. coloquial de dinheiro), 谁都能 (qualquer um); NOTAS
  CULTURAIS campeãs: 外公/外婆 (avós MATERNOS vs 爷爷/奶奶 paternos), 阿姨 (tia),
  教授 vs 老师, 交税/政府/公立学校, vocabulário cívico (国会/民主党/共和党/
  参议员/总统/选举/投票). Capa = original EN #4 (`/covers/26-covers.png`).
  20005 **冷心** ("Coração Frio", EN #5 Cold Heart): conto de fadas; nomes
  falantes pelo MECANISMO — 黑发 (Hēi Fà = Cabelo Preto, o rei), 冷心 (Lěng
  Xīn = Coração Frio, a fada má), 小蓝 (Azulzinho, o bebê→cão→príncipe, ECO do
  cão 小蓝 do 20003, referente DIFERENTE), e os irmãos **老大/老二** (= Um/Dois,
  recriando a "falta de imaginação para nomes" do original com a praxe chinesa
  REAL de chamar filhos pela ordem 老大/老二/老三 — nota cultural campeã). A
  ladainha de presentes das fadas (我给你… = "eu te dou…") é ótima reciclagem
  embutida. Conteúdo adulto preservado sem suavizar (a maldição, o roubo/a
  pancada no mercado). 2.107 caracteres, 1.496 tokens, 634 tips, 20 explanations
  (5/seção). Reciclagem alta (86%). Notas ricas: 又A又B又C, 极了 (intensificador),
  把…变成 (transformar X em Y — chave do conto), 把…送出去 (把 + direcional),
  一个一个地 (+地 adverbial), 排成 (V成), 给 objeto duplo, 本事 (dom/habilidade),
  安静下来 (下来 resultativo), 吓得 / 被打得很重 (得 grau, 被 passiva), 看起来
  (parecer), 才能 (só assim poder), 一…就… (assim que), V啊V (走啊走), 谁也不
  (negação universal), 嘛 (partícula), 追上/认出 (complemento de resultado 上/
  出), 用…来算, 为…高兴 (feliz POR alguém), classif. 颗 (coração) e 根 (棍子).
  Capa = original EN #5 (`/covers/11-covers.png`). Próximo: 20006 (réplica do
  EN #6) ou seguir o N1.

### RUSSO (ru) — fundações estabelecidas (livro 30001)
- Fórmula de abertura N1: Жил-был ("era uma vez", lit. "viveu-foi"); nomes
  falantes: Ваня (o "Joãozinho" russo), Большой Рот (Boca Grande), Зелёныш
  (Verdinho — зелёный + sufixo carinhoso -ыш). Fada = фея; loja-âncora do
  conto: «Большой магазин, где есть всё».
- **Formato do token**: igual ao mandarim, mas com TRANSLITERAÇÃO no lugar
  do pinyin. `translation.text` = "translit com acento tônico — tradução
  PT-BR" (translit OBRIGATÓRIA em todo chunk); tips de sub-palavra com
  `translatedText` = "translit = tradução literal". Convenção de translit:
  acento agudo na tônica; о átono→a; finais sonoros ensurdecem (друг→druk);
  г lido [v] em его/него/сегодня/ничего/всего; ж=j, ш=sh, щ=sch, ч=tch,
  ц=ts, х=kh, ы=y, ё=ió, ь='. Use um GLOSSÁRIO compartilhado das palavras
  frequentes em TODOS os prompts dos agentes (garante consistência entre as
  4 seções — foi o truque-chave). A transliteração aparece tanto no tooltip
  quanto como **ruby acima do cirílico**, com botão de toggle "abc" no header
  (mesma mecânica do pinyin; `hasTranslit` no `ReaderView.tsx`).
- Explanations focam a lógica do russo p/ falantes de PT-BR: ausência de
  artigos, ausência do "ser" no presente, "ter" = у+genitivo+есть, os 6
  casos (prepositivo в/на de lugar, genitivo após не/много/из, dativo
  "para alguém", instrumental "com"/под), aspecto perfectivo×imperfectivo
  (сказать/говорить), gênero do passado был/была/было, dupla negação
  (ничего не…), вы×ты, чтобы+passado, reduplicação enfática.
- Chunks = sintagmas de 2–4 palavras; russo TEM espaços → espaço entre
  chunks é token `" "` translation:null e cada pontuação («» „" — : … etc.)
  é token próprio; lossless = parágrafos unidos por '' (igual ao fr).
- Métricas N1 ru (livro 1): ~1.340 palavras, ~440 formas únicas, TTR ~0,33,
  exposição ~3×, 80% diálogo. **TTR é naturalmente mais alto que o alvo EN
  (≤0,26)**: o russo é flexivo, cada caso/gênero gera uma "forma" nova (por
  lema o TTR seria bem menor) — não force padding atrás do número.
- `WORD_RE` de `data.ts` inclui o range cirílico `[а-яё]` (necessário para
  o contador de palavras lidas e o endpoint `reader/{id}/info` funcionarem).
- Pipeline: `scripts/assemble-ru.mjs` (narrador `'Olga'`, tryout ≤30003);
  glossário de consistência em `data/ru/_glossary.md` (convenções de translit +
  pontos gramaticais + nomes falantes + vocabulário reciclado — usar em TODOS os
  prompts dos agentes, foi o truque-chave); `data/ru/_split.mjs` divide a fonte
  em 4 seções balanceadas POR PALAVRAS. Não há `vocab-ru.mjs` (a reciclagem do
  ru é por FORMA, medida inline com node — flexão infla os números: por lema
  seria bem maior).
- **Feitos: 30002–30005** (réplicas dos EN #2–#5; tryout só nos 3 primeiros,
  como no original). Métricas N1 ru estáveis: ~1.140–1.450 palavras, **TTR
  0,35–0,39** (alto por flexão — não force padding), 20 explanations high/livro
  (5/seção) + muitas low (a política de densidade do projeto: ~146–234 expl
  totais/livro), ~370–474 tips. Reciclagem POR FORMA cresce com a coleção:
  36%→50%→48%→61% (a queda no #4 cívico espelha zh/ja/es/it). **30002 Счастливое
  Место** (#2 The Happy Place — nomes falantes pelo MECANISMO: Странствующие
  Герои [Heróis Andarilhos], Правая Рука/Левая Рука [Mão Direita/Esquerda], a
  dragoa Огненные Глаза [Olhos de Fogo], o rio Синяя Вода [Água Azul], a ilha
  Счастливое Место; moral do autoconhecimento; ponto-chave: travessão — como
  cópula "é" no presente). **30003 Повитуха** (#3 The Midwife — повитуха =
  parteira [palavra antiga/popular, combina com "há muito tempo"; nota cultural
  vs moderno акушерка]; nomes falantes Рыжая [a "Ruiva", a parteira — рыжий =
  ruivo, como o russo nomeia cor de cabelo, nota campeã], Синий [o cão], Звезда
  [Estrela], Сильные Руки [Braços Fortes, o marido], Лето [Verão, o pretendente],
  Солнце [Sol, o bebê], Водный Город [Cidade da Água]; afogamento/quase-morte e
  o pão mágico que apaga a memória preservados sem suavizar; pontos: у+genitivo
  ="ter", полюбили друг друга [recíproco], сердце замерло). **30004 Вопросы
  Анны** (#4 Anna's Questions — conto MODERNO/realista, diálogo mãe-filha; Анна,
  cão Синие Глаза [Olhos Azuis], тётя Лора; o vocabulário cívico/científico NÃO
  é cognato em russo e vira ótimas NOTAS [рак=câncer, клетки=células, наука,
  микроскоп, экономика, налоги=impostos, правительство, Конгресс, демократы/
  республиканцы, сенатор, президент, выборы=eleição, голосовать=votar, профессор
  vs учитель, университет=escola de adultos, на пенсии, бабушка/дедушка]; o
  talky/cívico puxa únicos p/ cima e reciclagem p/ baixo, igual ao zh/ja/es/it
  #4; o mais curto: 1.141 palavras, TTR 0,39; ponto-chave: INSTRUMENTAL do
  predicativo — быть/стать врачом/учительницей). **30005 Холодное Сердце** (#5
  Cold Heart — nomes falantes Чёрные Волосы [Cabelos Pretos, o rei], Холодное
  Сердце [Coração Frio, a fada má], Синий [Azul, o bebê→cão→príncipe, ECO do cão];
  irmãos **Вторак/Первак** recriam a "falta de imaginação para nomes" do original
  com a praxe russa antiga REAL de nomear pela ORDEM de nascimento [Первуша/
  Вторак/Третьяк são nomes históricos; Третьяк sobrevive como sobrenome] — NOTA
  CULTURAL CAMPEÃ, paralela ao 一郎/二郎 [ja], 老大/老二 [zh], Dos/Uno [es];
  a ladainha das fadas «Я дарю тебе…» [16×] = ótima reciclagem embutida [дарю +
  dativo тебе + чтобы+passado finalidade]; o roubo/a pancada no mercado
  [украсть, вор, ударить палкой] preservados sem suavizar; pontos-chave:
  превратить в + ACUSATIVO [transformar em] vs стать + INSTRUMENTAL [virar]).
  Capas reaproveitadas dos EN: #2=25, #3=17, #4=26, #5=11. **Próximo: 30006**
  (réplica do EN #6) ou seguir até completar o N1.

### JAPONÊS (ja) — fundações estabelecidas (livro 40001)
- Fórmula de abertura N1: むかしむかし ("mukashi mukashi" = era uma vez);
  nomes falantes: たろう (Tarō, o "Joãozinho"), 大口くん (Ōguchi = "Boca
  Grande" — おおぐち também é a expressão "se gabar/falar grande", duplo
  sentido idêntico ao "Big Mouth"), ミドリ (Midori = "Verdinho", pelos olhos
  verdes); fada = ようせい; loja-âncora: 「なんでもある大きなお店」.
- **Formato do token**: igual ao mandarim, mas com RŌMAJI (Hepburn) no lugar
  do pinyin. `translation.text` = "rōmaji com vogais longas — tradução
  PT-BR" (rōmaji OBRIGATÓRIO em todo chunk); tips de sub-palavra com
  `translatedText` = "rōmaji = tradução literal". Convenção de rōmaji:
  vogais longas ō/ū; し=shi, ち=chi, つ=tsu, じ=ji; geminada っ dobra a
  consoante (gakkō, zutto); ー (katakana) = vogal longa (bōru). **Partículas
  pela PRONÚNCIA** (ponto-chave, sempre com nota na 1ª vez): は=wa, へ=e,
  を=o. Use um GLOSSÁRIO compartilhado (`data/ja/_glossary.md`) em TODOS os
  prompts dos agentes — garante consistência das romanizações entre as 4
  seções (mesmo truque do russo). O rōmaji aparece no tooltip e como **ruby
  acima do japonês**, com botão de toggle "Rōmaji" no header (mesma mecânica
  do pinyin; `hasTranslit` no `ReaderView.tsx`).
- **Furigana** (leitura em hiragana acima APENAS dos kanji): além do rōmaji,
  cada token ganha `furigana?: FuriSeg[]` (`{t, r?}`; `r` só nos trechos de
  kanji, concat dos `t` === token.text). Gerado no `assemble-ja.mjs` via
  `scripts/furigana.mjs` (kuromoji/IPADIC + "fitting" de okurigana + um mapa
  `OVERRIDES` para nomes e leituras especiais — ex.: 大口=おおぐち, 七日=なのか,
  長い間=ながい**あいだ**). O leitor tem um seletor de 3 modos por idioma
  (`rubyMode`): **ja = ふりがな / Rōmaji / Off** (furigana é o padrão); zh/ru
  seguem com translit on/off. A medição/paginação ruby é genérica para os
  dois tipos de ruby. Ao mexer no texto: rodar `node scripts/assemble-ja.mjs`
  (regenera furigana) e **reiniciar o dev** (content é cacheado no boot).
- Explanations focam a lógica do japonês p/ falantes de PT-BR: は (tópico)
  vs が (sujeito); partículas を/に/で/へ/の; いる (animado) vs ある
  (inanimado); citação com と; か de pergunta sem "?"; cópula/passado
  でした/〜ました; classificadores (人 nin, etc.); 〜ないといけない (ter que);
  〜たい (querer), 〜てほしい (querer que o outro faça); 〜てしまう;
  potencial 言えません; しか〜ない (só); 〜なくてもいい / 〜てもいい;
  〜ないで (sem/não faça); reduplicação enfática (小さな小さな); ausência de
  artigo e plural; ordem SOV.
- Chunks = bunsetsu (palavra de conteúdo + partículas); japonês NÃO tem
  espaços → cada pontuação de largura total (。、！？「」『』… e aspas) é
  token próprio com translation:null, SEM tokens de espaço; lossless =
  parágrafos unidos por '' (igual ao zh).
- Métricas N1 ja (livro 1): ~3.770 caracteres (kanji+kana), ~190 únicos
  (~110 kanji, faixa N5/JLPT), exposição ~20×, 45 parágrafos, 80% diálogo,
  40 explanations. `WORD_RE` de `data.ts` conta CADA caractere (kanji +
  hiragana + katakana, 々 e ー incluídos) como uma "palavra", igual ao zh —
  `uniqueWordsNumber` = caracteres únicos.
- **Feitos: 40002–40005** (réplicas dos EN #2–#5; tryout=false a partir do
  #4, como no original). Métricas N1 ja estáveis: ~3.082–3.544 caracteres,
  170–187 únicos, exposição 17–21×, 20 explanations high/livro (5/seção) +
  muitas low, ~790–960 tips. Reciclagem (cobertura de caracteres) cresce com
  a coleção: 74%→88%→84%→91% (o #4, moderno/cívico, cai um pouco como nos
  outros idiomas); 305 caracteres acumulados. As leituras de furigana dos
  nomes novos saíram corretas do kuromoji SEM precisar de OVERRIDES (右手
  みぎて, 左手 ひだりて, 産婆 さんば, 強い腕 つよいうで, 太陽 たいよう, 一郎
  いちろう, 二郎 じろう, 黒髪 くろかみ, 王子 おうじ, 教じゅ きょうじゅ, 大
  とうりょう だい…). **40002 幸せの場所** (#2 The Happy Place — nomes falantes
  pelo MECANISMO: 右手/左手 = Mão Direita/Esquerda, a dupla 歩くヒーロー [=
  "Heróis que Caminham", eco do 会走路的英雄 do zh], a dragoa 火の目 [Olhos de
  Fogo], o rio 青い水 [Água Azul], a ilha 幸せの場所; ドラゴン em katakana por
  estrangeirismo; moral do autoconhecimento). **40003 産婆さん** (#3 The
  Midwife — 産婆さん é a palavra ANTIGA de parteira [vs moderno 助産師], combina
  com "há muito tempo", nota cultural campeã; nomes falantes 赤 [Vermelha, a
  parteira], 青 [Azul, o cão, ECO do nome do cão; aqui o cão], 星 [Estrela],
  強い腕 [Braço Forte, o marido], 夏 [Verão, o pretendente], 太陽 [Sol, o bebê],
  水の町 [Cidade da Água]; afogamento/quase-morte e o pão mágico que apaga a
  memória preservados sem suavizar). **40004 アンナのしつもん** (#4 Anna's
  Questions — conto MODERNO/realista, diálogo mãe-filha; nome próprio アンナ,
  cão 青い目 [Olhos Azuis]; o vocabulário cívico/científico americano vira boas
  NOTAS [não é cognato em japonês]: ガン/さいぼう/りか/けんびきょう, けいざい/
  ぜいきん/せいふ/こうりつ, 国会/みんしゅとう/きょうわとう/じょういんぎいん/
  大とうりょう/みんしゅしゅぎ/せんきょ/とうひょう; notas culturais 教じゅ vs
  先生, 大学=おとなの学校, お医者さん, がまん; o talky/cívico puxa únicos p/
  cima e reciclagem p/ baixo, igual ao zh/es/it #4). **40005 冷たい心** (#5
  Cold Heart — nomes falantes 黒髪 [Cabelo Preto, o rei], 冷たい心 [Coração
  Frio, a fada má], 青 [Azul, o bebê→cão→príncipe, ECO do cão]; irmãos **一郎/
  二郎** recriam a "falta de imaginação para nomes" do original com a praxe
  REAL japonesa de nomear pela ORDEM de nascimento [郎 = sufixo de filho homem;
  一=1º, 二=2º] — nota cultural CAMPEÃ, como o 老大/老二 do zh e o Dois/Uno do
  es; a ladainha de presentes das fadas 「あなたに○○をあげます」 = ótima
  reciclagem embutida; a maldição/o roubo no mercado [どろぼう, ぼうでたたく]
  preservados sem suavizar; ponto-chave 〜にする [transformar X em] vs 〜になる
  [virar]). Capas reaproveitadas dos EN: #2=25, #3=17, #4=26, #5=11. Não há
  `vocab-ja.mjs` (a reciclagem do ja é por caractere, medida inline). Próximo:
  40006 (réplica do EN #6) ou seguir o N1.

### ESPANHOL (es) — fundações estabelecidas (livro 50001)
- **Premissa diferente dos outros idiomas**: o brasileiro JÁ entende 70–80%
  de um texto espanhol nativo pela proximidade. Por isso o ES NÃO é "começar
  do zero" — é atacar os obstáculos REAIS do par PT→ES. As histórias são
  recriadas para fazer esses obstáculos emergirem naturalmente, e as notas
  focam neles (não em vocabulário óbvio que o leitor já adivinha).
- **Os 5 eixos das notas** (o equivalente espanhol das "notas culturais" que
  o usuário ama no francês — priorize SEMPRE):
  1. **Falsos amigos** — os campeões de erro: `todavía` (=ainda, ≠todavia),
     `acordarse` (=lembrar-se, ≠acordar/despertar), `largo` (=longo, ≠largo/
     ancho), `rato` (=instante, ≠rato/ratón), `perro` (=cão), `salir`,
     `embarazada` (=grávida!), `vaso` (=copo), `oficina` (=escritório),
     `pelo` (=cabelo), `apellido` (=sobrenome), `exquisito` (=delicioso).
     Sempre que um aparecer no texto, vira explanation.
  2. **ser vs estar** — O erro nº 1 do brasileiro. Marque o contraste sempre
     que ocorrer: característica/identidade → SER (`era un pueblo`, `era un
     hada`); estado/emoção/localização → ESTAR (`estaba triste`, `estoy
     lleno`, `¿cómo estás?`).
  3. **por vs para** — `para` = finalidade/destino (`para vivir`, `para
     llegar`); `por` = causa/troca/tempo/meio (`por sus ojos`, `por la
     mañana`, `gracias por`).
  4. **Subjuntivo** — bem mais presente que no PT coloquial: após `como si`
     (`como si fuera`), `para que` (`para que se sintiera`), `querer que`
     (`quieres que te deje`), antecedente indefinido/negado (`algo que no
     fuera verdad`), imperativo negativo (`no digas`).
  5. **Estruturas-espelho** — `gustar`/`doler` (o que se gosta/dói é o
     sujeito: `me duele la cabeza`), `tener` onde o PT usa "estar com"
     (`tener hambre/ganas/sueño`), `dejar de + inf` (=parar de), `soler +
     inf` (=costumar), `el hada`/`el agua` (artigo `el` + "a" tônico).
- **Variedade**: padrão neutro pan-hispânico, mas em ES vale notar
  diferenças regionais quando surgirem (`ustedes` como plural normal na
  América Latina; tuteo/voseo; `coger` etc.). Notas culturais de uso real
  são bem-vindas como no francês.
- Fórmula de abertura N1: **Había una vez** ("Era uma vez"); nomes falantes:
  **Bocón** (Big Mouth → "boca" + aumentativo -ón = tagarela/fanfarrão),
  **Pedro** (o menino), **Verde** (o cão, pelos olhos verdes), **el hada**
  (a fada); loja-âncora do conto: «La Tienda Muy Grande Donde Hay de Todo».
- **Formato do token**: igual ao francês (escrita latina, COM espaços) —
  `translation.text` = tradução PT-BR direta (SEM transliteração; `es` não
  entra em `hasTranslit`). Espaço entre chunks é token `" "` translation:null;
  cada pontuação é token próprio, INCLUINDO os de abertura `¿` e `¡` e as
  aspas `« »`. Atenção: o texto fecha falas com `…».` (aspa antes do ponto
  final) — respeitar a ordem no lossless. Lossless = parágrafos unidos por ''.
- **Calibração N1 es** (livro 1): ~1.500 palavras, **TTR ≤ 0,35** (alvo mais
  alto que o EN ≤0,26 — o brasileiro lê mais rápido e tolera mais variedade;
  livro 1 saiu 0,28), ~48 parágrafos, 80% diálogo, ~560 tips, 20 explanations
  (teto ~5/seção). `WORD_RE` de `data.ts` (`à-ɏ`) já cobre acentos e ñ — não
  precisa mexer. Faixa de id: **es = 50001+**.
- Pipeline: `scripts/assemble-es.mjs` (cópia do fr; narrador 'Lucía'); receita
  idêntica à do francês (escrever o texto você mesmo a partir do EN original
  em `graded-readers/Nivel N/`, dividir em 4 seções balanceadas POR PALAVRAS
  — não por nº de parágrafos, já que o diálogo curto desbalanceia —, despachar
  4 agentes paralelos com o glossário de consistência + os pontos dos 5 eixos
  do trecho).
- **Feitos: 50001–50005** (réplicas dos EN #1–#5). 50002 **El Lugar Feliz**
  (#2 The Happy Place — Mano Derecha/Mano Izquierda, o dragão Ojos de Fuego,
  o rio Agua Azul, a ilha El Lugar Feliz; 1.558 palavras, TTR 0,29), 50003
  **La Partera** (#3 The Midwife — Roja a parteira, o cão Azul, Estrella,
  Brazos Fuertes, Verano, o bebê Sol, o Pueblo del Agua; falso amigo campeão
  `acordarse de`=lembrar-se; 1.558 palavras, TTR 0,28), 50004 **Las Preguntas
  de Ana** (#4 Anna's Questions — conto MODERNO/realista, diálogo mãe-filha;
  cognatos óbvios [cáncer, economía, impuestos, demócratas…] NÃO viram nota,
  foco em `jubilado`, `darse cuenta de`, `como si`+subjuntivo, `tal vez`+
  subjuntivo, maestra vs profesora; o mais curto: 1.308 palavras, TTR 0,32),
  50005 **Corazón Frío** (#5 Cold Heart — o Rei Pelo Negro, a fada má Corazón
  Frío, o príncipe→cão Azul, os meninos Dos/Uno; ladainha de presentes das
  fadas `Te doy… para que…` = ótimos subjuntivos; cena de roubo/pancada
  preservada sem suavizar [robar, ladrón, pegar=bater]; 1.496 palavras, TTR
  0,27). Métricas N1 es (50001–50005): ~1.300–1.560 palavras, TTR 0,27–0,32, 20
  expl/livro (5/seção), ~390–500 chunks traduzidos. tryout só nos 3 primeiros
  (50001–50003), espelhando o original.
- **Feitos: 50006–50009** (réplicas dos EN #6–#9; tryout=false). Estes 4
  ADOTAM o sistema de PRIORIDADE de notas (camadas por cor): ~6 explanations
  `high`/seção (≈23–24/livro, as imperdíveis dos 5 eixos) + MUITAS `low`
  (124–156 explanations TOTAIS/livro — a política de densidade em camadas; a UI
  filtra por cor). Os 5 primeiros livros não têm `priority` (contam como `high`).
  Pipeline: `data/es/_split.mjs <id> <slug>` divide a fonte em 4 seções
  balanceadas POR PALAVRAS; 4 agentes paralelos anotam (ref. de tokenização =
  `_50004-section-2.json`, que mostra `«`/`¿`/`¡`/`»`/`?` como tokens próprios
  sem espaço ao redor). Reciclagem POR FORMA: 74%/64%/76%/63% (#7 e #9 caem por
  trazerem muito vocabulário novo — criaturas do mar; corte/animais/carrera —,
  o mesmo padrão do #4 talky, cf. aprendizado (c)). **50006 Buen Corazón y Sus
  Cuatro Amigos** (#6 — nome falante Buen Corazón [Bom Coração]; os 4 cães
  comprados ao Rei; a **llave azul** mágica [no copo de água realiza desejos];
  a **casamentera** [go-between, nota cultural]; sangue falso de polvo vermelho;
  prisão e os cães que recuperam a chave; falsos amigos campeões: cena=jantar,
  vaso=copo, suegra=sogra, cárcel=cadeia; 1.749 palavras, TTR 0,22 — o mais
  reciclado), **50007 Cómo la Medusa Perdió su Caparazón** (#7 How the Jellyfish
  Lost Its Shell — **medusa=água-viva** [nota: não "medusa/górgona"]; o Rey del
  Mundo Bajo el Mar doente precisa do coração de um mono; la tortuga mensageira
  engana o macaco, que se vira e foge [deixou o coração na árvore]; a medusa
  fofoqueira [tu gran boca, a "Boca Grande" do conto] é castigada e perde o
  caparazón; falsos amigos pastel=bolo, tirar de=puxar, perezosa=preguiçosa;
  `como si estuviera`=subjuntivo campeão; vocabulário marinho [calamar=lula,
  sirenas=sereias] puxa únicas p/ cima [503] e reciclagem p/ baixo [64%];
  1.555 palavras, TTR 0,32), **50008 Como Romeo y Julieta** (#8 — conto MODERNO
  com telefones/chats/narrador metaficcional; nomes falantes **Pedro Rojo
  "Fuerte"** + **Ana Azul "Bonita"** [ECOS dos recorrentes Pedro do #1 e Ana do
  #4] + **María Verde "Feliz"**; famílias Roja/Azul que se odeiam sem motivo;
  diálogos pai/mãe REPETIDOS quase idênticos = andaime/reciclagem; eixos ricos:
  SER [era bonita] vs ESTAR [estaba feliz], doler [le hizo doler el corazón],
  falsos amigos largo=longo/rato=instante, **salir con=namorar** [falso amigo +
  cultural], barbacoa del domingo; 1.705 palavras, TTR 0,24), **50009 Favor con
  Favor se Paga** (#9 One Good Turn Deserves Another — título recriado como
  PROVÉRBIO real [uma gentileza merece outra], retomado no fecho como moral; o
  príncipe exilado traído pelo viejo criado no pozo [troca de roupas/lugar]; o
  ser mágico dá as **llaves roja/azul/verde** p/ chamar osos/lobos/palomas; a
  carrera de 3 dias pela mão da princesa; falsos amigos campeões: **cubo=balde**,
  **criado=empregado/servo** [≠criança], **carrera=corrida** [≠carreira],
  pozo=poço, amo=dono, muro=muro, desterrar=banir; subjuntivos hacer que+subj,
  para que+subj, cuando quieras; o mais longo [espelha o original, 23,6 min]:
  2.478 palavras, 596 únicas, TTR 0,24). Capas reaproveitadas dos EN: #6=7,
  #7=1, #8=24, #9=9. Próximo: 50010 (réplica do EN #10) ou seguir até completar
  o N1.

### ITALIANO (it) — fundações estabelecidas (livros 60001–60005; faixa 60001+)
- **Premissa igual à do espanhol, não à dos idiomas "do zero"**: o brasileiro
  já entende 70–85% de um texto italiano nativo pela proximidade latina (em
  vários pontos até MAIS que o espanhol — léxico e morfologia muito próximos).
  Por isso o IT NÃO é "começar do zero" — é atacar os obstáculos REAIS do par
  PT→IT. As histórias são recriadas para fazer esses obstáculos emergirem
  naturalmente, e as notas focam neles (não em vocabulário óbvio que o leitor
  já adivinha). Mesma filosofia do [[notas-culturais-graded-readers]] e do ES.
- **Os 5 eixos das notas** (o equivalente italiano dos "5 eixos" do espanhol —
  priorize SEMPRE 2–3 por seção):
  1. **Falsos amigos (falsi amici)** — os campeões de erro PT→IT:
     `burro` (=manteiga, ≠burro/asino), `tirare` (=puxar, ≠tirar — campeão,
     igual ao `tirer` francês), `salire` (=subir, ≠sair/uscire), `guardare`
     (=olhar, ≠guardar/tenere), `squisito` (=delicioso, ≠esquisito/strano —
     igual ao `exquisito` espanhol), `caldo` (=quente, ≠caldo/brodo),
     `cena` (=jantar, ≠cena/scena), `negozio` (=loja, ≠negócio/affare),
     `palestra` (=academia/ginásio, ≠palestra/conferenza), `fattoria`
     (=fazenda, ≠fábrica/fabbrica), `cantina` (=adega/porão), `gabinetto`
     (=banheiro), `subito` (=imediatamente, ≠súbito/improvviso), `morbido`
     (=macio, ≠mórbido), `rumore` (=barulho, ≠rumor/voce), `birra` (=cerveja),
     `gamba` (=perna), `esperto` (=perito/especialista, ≠esperto/sveglio),
     `prendere` (=pegar/tomar), `stanza` (=cômodo/quarto). Sempre que um
     aparecer no texto, vira explanation.
  2. **Gênero & plural diferentes do PT** — o plural NÃO leva -s: `-o`→`-i`,
     `-a`→`-e`, `-e`→`-i` (`amico`→`amici`, `casa`→`case`, `fiore`→`fiori`);
     mudanças ortográficas no plural (`amico`→`amici` mas `lago`→`laghi`;
     `amica`→`amiche`, `arancia`→`arance`). Gênero que diverge do PT: `il
     fiore` (a flor), `il latte`, `il sangue`, `il miele`, `il mare`, `l'arte`
     (fem). Marque sempre que o gênero/plural surpreender o brasileiro.
  3. **Preposizioni articolate** — o obstáculo MECÂNICO nº 1: `di/a/da/in/su`
     (+ às vezes `con`) FUNDEM com o artigo → `del/dello/della/dei/degli/delle`,
     `al/allo/alla/ai/agli/alle`, `dal/dalla/dai`, `nel/nello/nella/nei/negli/
     nelle`, `sul/sulla/sui/sugli`. O PT mantém "de o/em o" separados só em
     parte; o italiano funde tudo e flexiona em gênero/número. Sempre que
     aparecer uma forma não óbvia, vira nota.
  4. **Auxiliar essere vs avere no passato prossimo** — o ERRO nº 1 do
     brasileiro: o PT usa "ter" para tudo, mas o IT usa `essere` nos verbos de
     movimento/mudança de estado (`sono andato`, `è arrivata`, `siamo usciti`)
     COM concordância do particípio em gênero/número (`andato/andata/andati/
     andate`) — enquanto `avere` (a maioria dos transitivos) NÃO concorda
     (`ho mangiato`). Marque o contraste sempre que ocorrer.
  5. **Estruturas-espelho & congiuntivo** — `piacere` (o que se gosta é o
     SUJEITO: `mi piace la casa`, `mi piacciono i libri`, como o `gustar`/
     `doler` do espanhol); `c'è`/`ci sono` (=há); `ci vuole`/`ci vogliono`
     (=leva/é preciso, `volerci`); `ne` (=disso/disto); `stare` + gerúndio p/
     o contínuo (`sto mangiando`); e o **congiuntivo**, bem mais vivo que no
     PT coloquial: após `penso/credo che` (`penso che sia`), `voglio che`
     (`voglio che tu venga`), `come se` (`come se fosse`), `prima che`,
     antecedente indefinido/negado.
- **Eixo bônus — ortografia/fonética** (equivalente às "letras mudas" do
  francês): as **doppie** (consoantes dobradas) que mudam o sentido
  (`nonno`=avô ≠ `nono`=nono; `palla`=bola ≠ `pala`=pá; `sete`=sede ≠ `sette`
  =sete) e os acentos gráficos da tônica final (`città`, `perché`, `caffè`,
  `è`=é/está ≠ `e`=e) — viram ótimas notas, como as armadilhas ortográficas
  do francês (cf. aprendizado (f) do francês).
- **Diminutivos/aumentativos** como nota cultural recorrente (igual ao `-ón`
  espanhol, ao `小` chinês): `-ino`/`-etto`/`-ello`/`-uccio` (`ragazzino`,
  `casetta`, `fratellino`) e o aumentativo `-one` (`librone`); o pejorativo
  `-accio` (`tempaccio`). Esses sufixos também alimentam os nomes falantes.
- **Variedade**: base no italiano STANDARD (neutro); notar regionalismos
  quando surgirem é bem-vindo (como no espanhol), mas a régua é o standard.
- Fórmula de abertura N1: **C'era una volta** ("Era uma vez"); nomes falantes
  pelo MECANISMO: **Boccagrande** (Big Mouth — `bocca` + `grande`; nota
  cultural campeã: o idiom `avere la lingua lunga` = ser fofoqueiro/não saber
  guardar segredo — variante possível do nome: **Lingualunga**, eco do duplo
  sentido do Ōguchi japonês), **Pierino** (o menino — o "Joãozinho" das piadas
  italianas, o equivalente cultural exato), **Verdino** (o cão, pelos olhos
  verdes; `verde` + dim. `-ino`), **la fata** (a fada); loja-âncora do conto:
  «Il Grande Negozio Dove C'è di Tutto».
- **Formato do token**: igual ao francês/espanhol (escrita latina, COM
  espaços) — `translation.text` = tradução PT-BR direta (SEM transliteração;
  `it` NÃO entra em `hasTranslit`). Espaço entre chunks é token `" "`
  translation:null; cada pontuação é token próprio. Convenção de aspas de
  fala: usar «» como no fr/es (token próprio cada uma). Lossless = parágrafos
  unidos por '' (igual ao fr).
- **Calibração N1 it** (alvo, a confirmar no livro 1): ~1.500 palavras,
  **TTR ≤ 0,35** (alvo mais alto que o EN ≤0,26 — o brasileiro lê italiano
  rápido e tolera mais variedade, igual ao es), ~48 parágrafos, 80% diálogo,
  ~560 tips, 20 explanations (teto ~5/seção). O `WORD_RE` de `data.ts`
  (`[a-zà-ɏ]`) JÁ cobre os acentos italianos (à è é ì í ò ó ù ú) — **NÃO
  precisa mexer** (igual ao es/fr). Faixa de id: **it = 60001+**.
- **Implementação (wiring) — FEITO**: `data.ts` (`'it'` no loop de idiomas;
  WORD_RE inalterado, `à-ɏ` já cobre os acentos); `Header.tsx` (botão
  "Italiano" no `langSection`); `ReaderView.tsx` (`speechLang` it→`it-IT`, fora
  de `hasTranslit`); `scripts/assemble-it.mjs` (narrador `'Giulia'`, tryout
  ≤60003); `scripts/vocab-it.mjs`; `data/it/` com `_glossary.md`, `_SPEC.md`
  (contrato de anotação dos agentes) e `_split.mjs` (divide em 4 seções
  balanceadas POR PALAVRAS).
- **Pipeline**: idêntica à do espanhol/francês — escrever o texto VOCÊ MESMO a
  partir do EN original em `graded-readers/Nivel N/`, rodar `node
  data/it/_split.mjs <id> <slug>`, despachar 4 agentes paralelos (cada um lê
  `_SPEC.md` + `_glossary.md` + sua seção, com os pontos dos 5 eixos do
  trecho), `node scripts/assemble-it.mjs`, `node scripts/vocab-it.mjs`,
  reiniciar o dev.
- **Feitos: 60001–60005** (réplicas dos EN #1–#5; tryout só nos 3 primeiros).
  **60001 Il Bambino Che Non Sapeva Dire La Verità** (#1 — Boccagrande/Pietro,
  cão Verde, la fata; o falso amigo `paese`=vila já apareceu como nota
  estrela; 1.559 palavras, TTR 0,29), **60002 Il Posto Felice** (#2 The Happy
  Place — Eroi Erranti Mano Destra/Mano Sinistra, dragoa Occhi di Fuoco, rio
  Acqua Azzurra, ilha Il Posto Felice; passato remoto narrativo entra aqui;
  `paese` no duplo sentido vila/reino; 1.480 palavras, TTR 0,32), **60003 La
  Levatrice** (#3 The Midwife — Rossa a levatrice/parteira, cão Azzurro,
  Stella, Braccia Forti, Estate, bebê Sole, Paese dell'Acqua; nota-estrela: o
  **Lei de cortesia** na 3ª pessoa + periodo ipotetico `se fossi venuta...`;
  1.503 palavras, TTR 0,31), **60004 Le Domande di Anna** (#4 Anna's Questions
  — conto MODERNO/realista, diálogo mãe-filha; cão Occhi Azzurri; cognatos
  óbvios [cancro, cellule, economia, elezione] NÃO viram nota, foco em
  `rendersi conto`, `in pensione`=aposentado, `le tasse`=impostos, `macchina`=
  carro, professoressa vs insegnante vs maestra; o mais curto/talky: 1.237
  palavras, TTR 0,35 — espelha o ES #4), **60005 Cuore Freddo** (#5 Cold Heart
  — Re Capelli Neri, fada má Cuore Freddo, príncipe→cão Azzurro, irmãos Due/Uno
  [recriam a "falta de imaginação para nomes" numerando os filhos]; ladainha
  `Ti do…` = ótima reciclagem; assalto/pancada preservados sem suavizar
  [rubare, ladro, colpire col bastone]; 1.436 palavras, TTR 0,30). Métricas N1
  it estáveis: ~1.240–1.560 palavras, TTR 0,29–0,35, 20 expl/livro (5/seção;
  1 agente estourou p/ 6 e foi anulado via node, cf. aprendizado (b) do fr),
  ~520–605 chunks/tips. Reciclagem cresce com a coleção (43%→60%→54%→73%, cf.
  aprendizado (c)). Capas reaproveitadas dos EN: #1=23, #2=25, #3=17, #4=26,
  #5=11. **Próximo: 60006** (réplica do EN #6) ou seguir até completar o N1.

### REAL BOOKS (nível 9, inglês AUTÊNTICO)
- **Premissa diferente dos graded**: não são adaptações recriadas no nível —
  são livros REAIS, não-editados (literatura comercial), anotados com a MESMA
  mecânica (tradução por chunk + tips densas + ~5 explanations/seção). O nível
  9 (`levels.json`, campo `name: "Real Books"`, renderizado em `LibraryView`
  no lugar de "Nível {id}") agrupa esses livros; a faixa de id é **90001+**,
  lang `'en'`. Catálogo próprio em `data/readers-realbooks.json` (carregado em
  `data.ts`, separado do dump `readers.json` p/ não ser sobrescrito por
  `npm run ingest`).
- Pipeline: `scripts/assemble-realbooks.mjs` (cópia do fr; fonte em
  `data/realbooks/<slug>.txt`, seções `_<id>-section-{1..4}.json`, capa do
  epub em `/public/covers/<id>-cover.jpg`). Extrair o texto do epub (unzip →
  achar o part da TOC → strip de tags preservando parágrafos), salvar a fonte,
  dividir em 4 seções **balanceadas por palavras**, despachar 4 agentes
  paralelos com o schema EN exato (chunks 2–4 palavras, pontuação/espaço como
  tokens `translation:null`, contrações `didn’t/you’re` inteiras, apóstrofo
  tipográfico `’` e aspas `“ ”` preservados no lossless). Explanations focam
  idioms/gírias/phrasal verbs/falsos amigos americanos (o que o usuário ama).
- Feito: **Percy Jackson & the Lightning Thief** — cada capítulo é um card
  próprio (id sequencial, título "— Ch. N", capa compartilhada
  `/covers/90001-cover.jpg`): **90001 = cap. 1** (~3.400 palavras, 167 parág.,
  2.372 tokens), **90002 = cap. 2** (~2.760 palavras, 149 parág., 1.998
  tokens). Próximo capítulo entra como **90003** (extrair `part5.xhtml` do
  epub — cap. 3 "GROVER UNEXPECTEDLY"; ver a TOC `toc.ncx` p/ o mapeamento
  capítulo→part). Lembrar de `+1` no `publishedReadersCount` do nível 9 em
  `levels.json` a cada novo livro.

## Pegadinhas conhecidas

- **NUNCA `npm run build` com o dev server rodando** — corrompe `.next` do
  dev. Se acontecer: matar o processo, apagar `.next`, subir o dev de novo.
- O dev server costuma estar rodando em background (porta 3000) — verificar
  antes de subir outro.
- `data.ts` carrega tudo no boot: mudanças em `data/*.json` exigem restart
  (em dev, mudanças nos .ts recompilam o módulo e recarregam sozinhas).
- PowerShell 5.1: mensagens de commit com aspas/acentos quebram no `-m` —
  gravar a mensagem em arquivo UTF-8 **sem BOM** e usar `git commit -F`.
- Console do PowerShell exibe mojibake em respostas UTF-8 de API
  (`GarÃ§on`) — é só exibição, o dado está correto.
- As fontes em `public/fonts` já foram corrigidas (os pesos do Barlow
  Condensed estavam trocados entre arquivos) — não substituir sem conferir
  hash/peso real.
- Erros de hydration reportados pelo usuário geralmente são extensões de
  navegador (ColorZilla `cz-shortcut-listen`, simuladores mobile) — validar
  primeiro em Chrome limpo via puppeteer.
- `/graded-readers` (dump EN), `/raw`, `/assets_raw` e `*.har` são
  gitignored (fonte local); a saída derivada em `/data` é versionada.
- Capturas/screenshots de teste vão em `/shots` (gitignored).
