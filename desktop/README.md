# Graded Readers — app desktop (Electron)

Embrulho desktop da réplica. **Não reimplementa nada**: sobe o app Next.js de
`../` como processo filho e o carrega numa janela nativa. Toda a funcionalidade
do web (biblioteca, modo leitura paginado, tradução por chunk + tips + notas,
congratulation/avaliação, multi-idioma com ruby/furigana, progresso persistido
em `../data/userState.json`) continua idêntica — e roda 100% offline.

## Instalar

```bash
cd desktop
npm install        # baixa o Electron (e electron-builder p/ empacotar)
```

O app Next da raiz precisa ter suas deps instaladas (`npm install` em `../`).

## Rodar

```bash
# Produção (recomendado): exige um build do Next antes.
cd ..  && npm run build        # gera ../.next  (NÃO rodar com o dev server ativo)
cd desktop && npm start         # sobe `next start` numa porta livre e abre a janela

# Dev (hot reload do Next):
npm run dev                     # GR_DEV=1 → sobe `next dev`
#   ⚠ não rode junto com um `next dev` já ativo na raiz: os dois escrevem em
#     ../.next e corrompem um ao outro. Use o modo "attach" abaixo nesse caso.

# Attach: NÃO sobe servidor, só abre uma URL já no ar (ex.: o dev server da raiz)
GR_SERVER_URL=http://localhost:3000 npm run attach
```

Como o servidor roda via `ELECTRON_RUN_AS_NODE` no próprio binário do Electron,
**não é preciso ter Node instalado no sistema** para a versão empacotada.

## Empacotar (instalador Windows)

```bash
cd .. && npm run build          # .next de produção
cd desktop && npm run dist:win  # electron-builder → desktop/release/
```

O `build.extraResources` copia `../.next`, `../public`, `../data`,
`../node_modules`, `package.json` e `next.config.mjs` para `resources/app`, e o
`main.js` roda o Next de lá quando `app.isPackaged`. Coloque um ícone em
`desktop/build/icon.ico` antes de gerar o instalador (opcional).

> Observação: empacotar inclui `node_modules` da raiz (Next + deps), então o
> artefato é grande. Para um instalador enxuto, um próximo passo é migrar o Next
> para `output: 'standalone'` e empacotar só o servidor standalone.

## Como funciona (main.js)

1. Acha uma porta TCP livre.
2. `spawn` do Next (`start` ou `dev`) com `cwd` = raiz do app e
   `ELECTRON_RUN_AS_NODE=1`.
3. Faz polling em `http://localhost:<porta>` até responder.
4. Abre o `BrowserWindow` (contextIsolation, sem nodeIntegration); links
   externos vão para o navegador padrão.
5. Ao sair, mata a árvore de processos do Next (`taskkill /t` no Windows).

Instância única (segunda execução foca a janela existente).
