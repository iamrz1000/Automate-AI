const { app, BrowserWindow, Tray, Menu, Notification, dialog, ipcMain, shell, nativeImage } = require('electron');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const APP_NAME = 'Automate AI';
const REMOTE_API_ORIGIN =
  process.env.AUTOMATE_API_BASE_URL ||
  'https://ais-pre-vtowivipoo5oo4ojwcooaz-190037377446.asia-east1.run.app';

let mainWindow = null;
let tray = null;
let localServer = null;
let localPort = 0;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function getAppIconPath() {
  const candidates = [
    path.join(__dirname, '..', 'build', 'icons', 'icon.png'),
    path.join(__dirname, '..', 'public', 'assets', 'aistudio', 'automate_ai_logo_transparent.png'),
    path.join(__dirname, '..', 'dist', 'assets', 'aistudio', 'automate_ai_logo_transparent.png'),
  ];
  return candidates.find((p) => fs.existsSync(p));
}

function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.url, REMOTE_API_ORIGIN);
  const client = targetUrl.protocol === 'https:' ? https : http;

  const headers = { ...req.headers };
  delete headers.host;
  delete headers.connection;

  const proxyReq = client.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    }
    res.end(
      JSON.stringify({
        error: 'Unable to reach Automate AI cloud backend. Check your internet connection.',
        detail: err.message,
      })
    );
  });

  req.pipe(proxyReq);
}

function startLocalStaticServer() {
  return new Promise((resolve, reject) => {
    const distDir = path.join(__dirname, '..', 'dist');
    const server = http.createServer((req, res) => {
      const urlPath = (req.url || '/').split('?')[0];

      // Forward backend API requests to the Automate AI API origin
      if (urlPath.startsWith('/api/')) {
        proxyApiRequest(req, res);
        return;
      }

      const safePath = path.normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(distDir, safePath === '/' ? 'index.html' : safePath);

      if (!filePath.startsWith(distDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distDir, 'index.html');
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';

      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('Asset not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      });
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      localServer = server;
      localPort = typeof addr === 'object' && addr ? addr.port : 0;
      resolve(localPort);
    });
  });
}

function createWindow() {
  const iconPath = getAppIconPath();
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 390,
    minHeight: 640,
    title: APP_NAME,
    backgroundColor: '#090a14',
    icon: iconPath,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    vibrancy: isMac ? 'under-window' : undefined,
    visualEffectState: isMac ? 'active' : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Open external links (GitHub releases, Firebase OAuth popups, docs) safely
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (
      url.startsWith('https://accounts.google.com') ||
      url.startsWith('https://github.com/login') ||
      url.includes('firebaseapp.com/__/auth/')
    ) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 520,
          height: 680,
          backgroundColor: '#090a14',
          autoHideMenuBar: true,
        },
      };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadURL(`http://127.0.0.1:${localPort}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = getAppIconPath();
  if (!iconPath) return;

  try {
    const img = nativeImage.createFromPath(iconPath).resize({ width: 18, height: 18 });
    tray = new Tray(img);
    tray.setToolTip(APP_NAME);
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Open Automate AI',
          click: () => {
            if (mainWindow) {
              if (mainWindow.isMinimized()) mainWindow.restore();
              mainWindow.show();
              mainWindow.focus();
            } else {
              createWindow();
            }
          },
        },
        { type: 'separator' },
        {
          label: 'Quit Automate AI',
          click: () => app.quit(),
        },
      ])
    );
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch {
    // Tray icon optional across headless Linux WMs
  }
}

function registerIpcHandlers() {
  ipcMain.handle('automate:get-platform-info', () => ({
    runtime: 'electron',
    os: process.platform,
    arch: process.arch,
    version: app.getVersion(),
    remoteApiOrigin: REMOTE_API_ORIGIN,
  }));

  ipcMain.handle('automate:notify', (_event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title: title || APP_NAME, body: body || '' }).show();
      return true;
    }
    return false;
  });

  ipcMain.handle('automate:save-file', async (_event, { filename, base64Data }) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      defaultPath: filename || 'automate-export',
    });
    if (canceled || !filePath) {
      return { saved: false };
    }
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return { saved: true, filePath };
  });

  ipcMain.handle('automate:open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      shell.openExternal(url);
      return true;
    }
    return false;
  });
}

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    app.setAppUserModelId('com.automateai.desktop');
    registerIpcHandlers();

    if (!process.env.ELECTRON_START_URL) {
      await startLocalStaticServer();
    }

    createWindow();
    createTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('before-quit', () => {
    if (localServer) {
      localServer.close();
      localServer = null;
    }
  });
}
