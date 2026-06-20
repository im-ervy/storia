# Graded Readers — app mobile (Expo React Native)

Porta nativa do app web (`../src`) para Expo. **Offline**: empacota os dados de
`../data` dentro do app e replica a experiência do desktop (biblioteca, modo
leitura paginado com tradução por chunk + tips + notas, tela de congratulation,
avaliação, progresso persistido, multi-idioma com ruby/furigana).

## Rodar

```bash
cd mobile
npm install --legacy-peer-deps   # conflito de peer dep só nas libs web do expo-router (inócuo p/ Metro)
npm run assets                   # gera os assets a partir de ../data (ver abaixo) — JÁ RODADO, refaça se ../data mudar
npm start                        # abre o Metro (Expo Go / dev client)
npm run android | npm run ios    # build/abrir direto num device/emulador
npm run typecheck                # tsc --noEmit
```

## Arquitetura (paridade com o web)

- **Sem servidor.** A lógica de `src/lib/data.ts` (Next, fs) foi portada para o
  cliente em `src/lib/data.ts` (Expo). Catálogos (`readers*.json`, `levels.json`)
  são importados direto; o conteúdo dos readers (`data/content/<id>.json`, 30MB)
  é empacotado como **asset** (`assets/content/<id>.txt`, JSON cru) e carregado
  sob demanda via `expo-asset` + `expo-file-system` (`src/lib/content.ts`) — fora
  do bundle JS. O progresso/notas vivem em **AsyncStorage** (`src/lib/store.ts`)
  no lugar do `userState.json`; o estado-base "lido" vem do `times>0` do catálogo,
  igual ao web.
- **`scripts/gen-assets.mjs`** copia `../data/content/*`, `../public/covers/*` e os
  catálogos para dentro de `mobile/` e gera os require-maps
  (`src/generated/contentMap.ts`, `coverMap.ts`). Rode `npm run assets` sempre que
  `../data` mudar. A saída é gitignored (derivada).
- **Navegação:** `expo-router` (espelha as rotas do Next): `app/library.tsx`,
  `app/reading/[id]/index.tsx`, `app/reading/[id]/congratulation.tsx`.
- **Modo leitura** (`app/reading/[id]/index.tsx`): paginação por MEDIÇÃO real
  (`onTextLayout` mede as quebras de linha → `src/lib/pagination.ts` empacota em
  páginas pela altura disponível), tap-to-translate com tooltip + tips +
  explanation, ruby/furigana acima do texto (zh/ru/ja), narração via
  `expo-speech`, swipe, três temas (branco/preto/sépia) e o fluxo
  finalizar → congratulation → avaliar. As cores/medidas vêm do CSS do web
  (`src/theme/colors.ts`).
- **Idioma** ativo em `AppContext` (`gr-lang` no AsyncStorage); tema de leitura
  (`gr-color-theme`) e modo ruby (`gr-pinyin`) idem.

## Limitações conhecidas (v1)

- **Fontes:** o web usa Barlow/Barlow Condensed/Open Sans (woff2). O mobile usa as
  fontes do sistema (woff2 não roda em RN). Para fidelidade total, adicionar os
  `.ttf` via `expo-font`.
- **Ícones:** `@expo/vector-icons` (Ionicons) no lugar dos SVGs do web.
- **Tooltip de tradução:** ancorado como card no rodapé da área de leitura (no web
  ele flutua sob o token tocado) — adaptação mobile.
- A paginação por medição é fiel mas aproximada nas quebras quando um chunk longo
  quebra no meio; tokens são curtos (2–4 palavras), então o impacto é mínimo.
