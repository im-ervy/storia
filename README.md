# Storia

**Storia** é um app de leitura para aprender idiomas com *graded readers* —
histórias graduadas por nível (1–7). O leitor mostra a tradução em PT-BR
trecho a trecho, *tips* palavra a palavra e notas pedagógicas (falsos amigos,
gramática, cultura), com narração por text-to-speech, transliteração para
escritas não-latinas e acompanhamento de progresso.

Idiomas: inglês, francês, espanhol, italiano, mandarim, russo e japonês — os
três últimos com transliteração / *ruby* (pinyin, romanização e furigana)
acima do texto.

## Stack

- **Next.js 15** (App Router) — React no front + API routes no mesmo projeto
- **TypeScript**
- Sem banco externo: catálogo e conteúdo em JSON (`/data`)
- **Web Speech API** para o TTS (no navegador, offline, sem chave)
- Apps **mobile** (Expo / React Native) e **desktop** (Electron) que
  reaproveitam o mesmo conteúdo offline

## Como rodar

```bash
npm install
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

> O catálogo e o conteúdo dos livros já vêm versionados em `/data` — não há
> passo de seed nem dependências externas para subir o app.

## Estrutura

```
data/                catálogo (por idioma) + conteúdo dos livros (tokens)
  readers*.json      catálogos: um por idioma (readers-fr.json, readers-es.json, …)
  content/{id}.json  texto tokenizado: tradução + tips + notas por trecho
public/              capas, ícones, fontes e mídia
src/app/             páginas e API routes
  api/               endpoints do catálogo / leitor / progresso
  library/           catálogo por nível
  reading/[id]/      leitor interativo
src/components/       Header, LibraryView, ReaderCard, ReaderView, Stars
src/lib/             tipos + camada de dados
scripts/             montagem e QA do conteúdo (assemble-*, analyze-*, test-*)
mobile/              app Expo (porta offline)
desktop/             app Electron (empacota o Next.js local)
```

## Formato do conteúdo

Cada livro é `data/content/{id}.json` = `{ id, total, tokens[] }`. Um token de
conteúdo carrega a tradução e as glosas do trecho:

```jsonc
{
  "text": "bonjour",
  "newLine": false,
  "translation": {
    "text": "olá",
    "tips": [
      { "text": "bonjour", "translatedText": "olá", "explanation": "saudação informal" }
    ]
  }
}
```

Pontuação e espaços são tokens com `translation: null`. Invariante do formato:
concatenar todos os `text` reproduz o texto integral do livro (`newLine: true`
abre um novo parágrafo).

## API

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/level` | níveis publicados |
| GET | `/api/user/levels` | níveis liberados |
| GET | `/api/user/readers` | catálogo paginado / filtrado / ordenado |
| GET | `/api/reader/reading/stats` | progresso por nível |
| GET | `/api/user/readTextsInfo` | palavras lidas / únicas |
| GET | `/api/reader/:id` | detalhe do livro |
| GET | `/api/reader/:id/resume` | retoma da última posição |
| GET | `/api/reader/:id/sentences` | tokens paginados |
| PUT | `/api/reader/:id/positions/:pos/read` | marca posição lida |
