# Graded Readers — Réplica

Réplica full-stack da plataforma **gradedreaders.com**, reconstruída a partir de um
arquivo HAR de captura. Reproduz a biblioteca por níveis, o leitor interativo
frase-a-frase com tradução PT-BR e *tips* palavra-a-palavra, narração por
text-to-speech, temas de leitura e acompanhamento de progresso.

## Stack

- **Next.js 15** (App Router) — front-end React + API routes no mesmo projeto
- **TypeScript**
- Sem banco externo: dados em JSON (`/data`), progresso do usuário em memória
- Fontes, ícones e capas **reais** extraídos do HAR (`/public`)
- TTS via **Web Speech API** do navegador (offline, sem chave)

## Como rodar

```bash
npm install
npm run seed     # gera /data a partir dos payloads em /raw (já versionado)
npm run dev      # http://localhost:3000
```

Build de produção:

```bash
npm run build && npm start
```

## Estrutura

```
data/                 dados seed (catálogo + conteúdo do reader 14)
public/               assets reais (covers, icons, fonts, media)
scripts/seed.mjs      extrai/limpa os dados do HAR (corrige mojibake UTF-8)
src/app/              páginas e API routes
  api/                espelha os endpoints originais (/api/...)
  library/            catálogo por nível
  reading/[id]/       leitor interativo
src/components/       Header, LibraryView, ReaderCard, ReaderView, Stars
src/lib/              tipos + camada de dados
```

## Endpoints replicados

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/info` | versão |
| GET | `/api/level` | níveis publicados |
| GET | `/api/user/levels` | níveis liberados do usuário |
| GET | `/api/user/readers` | catálogo paginado/filtrado/ordenado |
| GET | `/api/reader/reading/stats` | progresso por nível |
| GET | `/api/user/readTextsInfo` | palavras lidas / únicas |
| GET | `/api/reader/:id` | detalhe do reader |
| GET | `/api/reader/:id/resume` | retoma da última posição |
| GET | `/api/reader/:id/sentences` | tokens paginados |
| PUT | `/api/reader/:id/positions/:pos/read` | marca posição lida |

## Notas sobre os dados

- O catálogo completo (195 readers, níveis 1–7) é ingerido do dump em
  `/graded-readers` por `npm run ingest` (`scripts/ingest-graded-readers.mjs`):
  capas, info (narrador, duração, palavras únicas) e o texto integral com
  traduções e tips (`*.sentences.json` → `data/content/{id}.json`).
- Os metadados capturados no HAR (notas, tryout, posição de leitura, vezes
  lidas) são mesclados por id quando existem — cobrem os readers do nível 1.
- O progresso do usuário é mantido em memória e reinicia ao reiniciar o servidor;
  o estado-base reflete a conta capturada no HAR (9 readers lidos, 1.275
  palavras únicas).
