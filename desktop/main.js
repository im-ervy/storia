// Processo principal do Electron.
//
// Estratégia: o app web é um Next.js que já roda 100% local (dados em JSON no
// disco, rotas de API próprias, progresso em data/userState.json). Em vez de
// reescrever nada, o Electron SOBE o servidor Next como processo filho e carrega
// http://localhost:<porta> num BrowserWindow. Assim toda a funcionalidade do
// desktop (biblioteca, modo leitura, finalização, multi-idioma, persistência)
// continua idêntica ao web — só que numa janela nativa e offline.
//
// Modos:
//   - Produção (padrão): roda `next start` (exige `next build` feito antes).
//   - Dev (GR_DEV=1): roda `next dev`.
//   - Attach (GR_SERVER_URL=http://...): NÃO sobe servidor; só abre a URL dada
//     (útil quando já há um dev server rodando — evita conflito no .next).
//
// Empacotado (electron-builder): o app Next é copiado para resources/app e
// rodado de lá; ver getAppRoot().

const { app, BrowserWindow, shell, Menu } = require('electron');
const { spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');
const path = require('node:path');
const fs = require('node:fs');

const isDev = process.env.GR_DEV === '1';
const attachUrl = process.env.GR_SERVER_URL || null;
const isSmoke = process.env.GR_SMOKE === '1';

let serverProc = null;
let mainWindow = null;

// Raiz do app Next: no dev é o repositório (um nível acima de desktop/);
// empacotado, é resources/app (ver extraResources no package.json).
function getAppRoot() {
  if (app.isPackaged) return path.join(process.resourcesPath, 'app');
  return path.join(__dirname, '..');
}

// Acha uma porta TCP livre.
function findFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Resolve o binário do next dentro do app Next (node_modules/.bin não é
// confiável cross-platform; usamos o entrypoint JS do next via node).
function nextCli(appRoot) {
  const cli = path.join(appRoot, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (!fs.existsSync(cli)) {
    throw new Error(`Next.js não encontrado em ${cli}. Rode "npm install" na raiz do projeto.`);
  }
  return cli;
}

function startNextServer(port) {
  const appRoot = getAppRoot();
  const cli = nextCli(appRoot);
  const args = [cli, isDev ? 'dev' : 'start', '-p', String(port)];
  const child = spawn(process.execPath, args, {
    cwd: appRoot,
    env: {
      ...process.env,
      // ELECTRON_RUN_AS_NODE faz o binário do Electron rodar como Node puro,
      // então não precisamos de um Node externo instalado no sistema.
      ELECTRON_RUN_AS_NODE: '1',
      NODE_ENV: isDev ? 'development' : 'production',
      PORT: String(port),
      // App offline empacotado: dispensa a porta de senha (que é só do deploy web).
      GR_DESKTOP: '1',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(`[next] ${d}`));
  child.stderr.on('data', (d) => process.stderr.write(`[next] ${d}`));
  child.on('exit', (code) => {
    if (code && code !== 0 && !app.isQuitting) {
      console.error(`[next] saiu com código ${code}`);
    }
  });
  return child;
}

// Aguarda o servidor responder 200/3xx na raiz.
function waitForServer(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      });
      req.on('error', retry);
      req.setTimeout(2000, () => req.destroy());
    };
    const retry = () => {
      if (Date.now() > deadline) reject(new Error('timeout aguardando o servidor Next'));
      else setTimeout(tick, 400);
    };
    tick();
  });
}

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 820,
    minWidth: 880,
    minHeight: 600,
    backgroundColor: '#f4f7f8',
    title: 'Graded Readers',
    icon: path.join(
      __dirname,
      'build',
      process.platform === 'win32' ? 'icon.ico' : 'icon.png'
    ),
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Links externos abrem no navegador padrão, não dentro do app.
  mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
    if (/^https?:/.test(target)) {
      shell.openExternal(target);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.on('did-finish-load', () => {
    if (isSmoke) {
      console.log('SMOKE_OK');
      app.isQuitting = true;
      app.quit();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.loadURL(url);
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    ...(isMac ? [{ role: 'appMenu' }] : []),
    { role: 'fileMenu' },
    { role: 'editMenu' },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    { role: 'windowMenu' },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function boot() {
  try {
    let url;
    if (attachUrl) {
      url = attachUrl;
      await waitForServer(url).catch(() => {
        /* segue mesmo sem ping — a URL pode demorar */
      });
    } else {
      const port = await findFreePort();
      url = `http://localhost:${port}`;
      serverProc = startNextServer(port);
      await waitForServer(url);
    }
    createWindow(url);
  } catch (err) {
    console.error('Falha ao iniciar:', err);
    app.quit();
  }
}

// Instância única — uma segunda execução foca a janela existente.
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    buildMenu();
    boot();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) boot();
    });
  });
}

function killServer() {
  if (serverProc && !serverProc.killed) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(serverProc.pid), '/f', '/t']);
      } else {
        serverProc.kill('SIGTERM');
      }
    } catch {
      /* ignore */
    }
  }
}

app.on('window-all-closed', () => {
  app.isQuitting = true;
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  killServer();
});
process.on('exit', killServer);
