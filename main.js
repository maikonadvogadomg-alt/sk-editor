/**
 * SK Jurídico IA — Electron Main Process
 * Versão: 1.7.0
 *
 * Inicia o backend Express e abre a janela do app.
 * Funciona 100% offline — sem dependência de Replit ou internet (exceto para a IA).
 */

const { app, BrowserWindow, shell, Menu, Tray, dialog, nativeImage } = require("electron");
const { autoUpdater } = require("electron-updater");
const path = require("path");
const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");

// ── Configuração ──────────────────────────────────────────────────────────────

const API_PORT = 8080;
const APP_PORT = 3000;
const IS_DEV = process.argv.includes("--dev") || process.env.NODE_ENV === "development";

let mainWindow = null;
let apiProcess = null;
let tray = null;
let apiReady = false;

// ── Caminhos de recursos ───────────────────────────────────────────────────────

function getResourcePath(...segments) {
  if (IS_DEV) {
    return path.join(__dirname, "..", "..", ...segments);
  }
  return path.join(process.resourcesPath, ...segments);
}

const API_DIST = getResourcePath("api-server", "dist", "index.mjs");
const FRONTEND_DIST = getResourcePath("frontend", "dist", "public");
const ICON_PATH = path.join(__dirname, "..", "..", "artifacts", "assistente-juridico", "public", "icon-192.png");

// ── Iniciar Backend Express ───────────────────────────────────────────────────

function startApiServer() {
  return new Promise((resolve, reject) => {
    const apiEntry = IS_DEV
      ? path.join(__dirname, "..", "..", "artifacts", "api-server", "dist", "index.mjs")
      : API_DIST;

    if (!fs.existsSync(apiEntry)) {
      console.warn(`[desktop] API não compilada em: ${apiEntry}`);
      console.warn("[desktop] Execute: pnpm --filter @workspace/api-server run build");
      resolve(false);
      return;
    }

    const env = {
      ...process.env,
      PORT: String(API_PORT),
      BASE_PATH: "/api",
      NODE_ENV: IS_DEV ? "development" : "production",
      ELECTRON_MODE: "1",
    };

    // Carrega .env se existir
    const envFile = path.join(__dirname, "..", "..", ".env");
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, "utf8").split("\n");
      for (const line of lines) {
        const [key, ...val] = line.split("=");
        if (key && !key.startsWith("#") && val.length) {
          env[key.trim()] = val.join("=").trim().replace(/^["']|["']$/g, "");
        }
      }
    }

    console.log(`[desktop] Iniciando API em http://localhost:${API_PORT}/api`);

    apiProcess = spawn(process.execPath, [apiEntry], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    apiProcess.stdout.on("data", (d) => {
      const msg = d.toString().trim();
      if (msg) console.log(`[api] ${msg}`);
      if (msg.includes("listening") || msg.includes("Server") || msg.includes("8080")) {
        apiReady = true;
        resolve(true);
      }
    });

    apiProcess.stderr.on("data", (d) => {
      console.error(`[api:err] ${d.toString().trim()}`);
    });

    apiProcess.on("exit", (code) => {
      console.log(`[desktop] API encerrada (code ${code})`);
      apiReady = false;
    });

    // Timeout: resolve mesmo sem mensagem após 5s
    setTimeout(() => resolve(apiReady || true), 5000);
  });
}

// ── Verificar se API está pronta ──────────────────────────────────────────────

function waitForApi(maxMs = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      const req = http.get(`http://localhost:${API_PORT}/api/health`, (res) => {
        resolve(res.statusCode < 500);
      });
      req.on("error", () => {
        if (Date.now() - start < maxMs) {
          setTimeout(check, 500);
        } else {
          resolve(false); // timeout — abre mesmo assim
        }
      });
      req.setTimeout(1000, () => { req.destroy(); });
    };
    check();
  });
}

// ── Criar janela principal ─────────────────────────────────────────────────────

function createWindow() {
  const icon = fs.existsSync(ICON_PATH) ? nativeImage.createFromPath(ICON_PATH) : undefined;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    title: "SK Jurídico IA",
    icon,
    backgroundColor: "#0f172a",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: !IS_DEV,
    },
  });

  // Menu
  buildMenu();

  // Carrega o app
  const frontendDist = IS_DEV
    ? path.join(__dirname, "..", "..", "artifacts", "assistente-juridico", "dist", "public")
    : FRONTEND_DIST;

  if (fs.existsSync(path.join(frontendDist, "index.html"))) {
    // Serve via file:// (frontend já compilado)
    mainWindow.loadFile(path.join(frontendDist, "index.html"));
  } else {
    // Dev mode: Vite dev server
    mainWindow.loadURL("http://localhost:23893/");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    if (IS_DEV) mainWindow.webContents.openDevTools();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  // Abre links externos no browser padrão
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });
}

// ── Menu da aplicação ─────────────────────────────────────────────────────────

function buildMenu() {
  const template = [
    {
      label: "Arquivo",
      submenu: [
        { label: "Novo documento", accelerator: "CmdOrCtrl+N", click: () => mainWindow?.webContents.executeJavaScript("window.dispatchEvent(new CustomEvent('sk:novo-documento'))") },
        { type: "separator" },
        { label: "Preferências", accelerator: "CmdOrCtrl+,", click: () => mainWindow?.webContents.executeJavaScript("window.location.hash='/configuracoes'") },
        { type: "separator" },
        { label: "Sair", accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4", click: () => app.quit() },
      ],
    },
    {
      label: "Editar",
      submenu: [
        { role: "undo", label: "Desfazer" },
        { role: "redo", label: "Refazer" },
        { type: "separator" },
        { role: "cut", label: "Recortar" },
        { role: "copy", label: "Copiar" },
        { role: "paste", label: "Colar" },
        { role: "selectAll", label: "Selecionar tudo" },
      ],
    },
    {
      label: "Visualizar",
      submenu: [
        { role: "reload", label: "Recarregar" },
        { role: "forceReload", label: "Forçar recarregamento" },
        { type: "separator" },
        { role: "resetZoom", label: "Zoom padrão" },
        { role: "zoomIn", label: "Ampliar" },
        { role: "zoomOut", label: "Reduzir" },
        { type: "separator" },
        { role: "togglefullscreen", label: "Tela cheia" },
        ...(IS_DEV ? [{ role: "toggleDevTools", label: "DevTools" }] : []),
      ],
    },
    {
      label: "Ajuda",
      submenu: [
        { label: "Manual do SK Jurídico", click: () => shell.openExternal("https://github.com/sk-juridico/docs") },
        { label: "Suporte", click: () => shell.openExternal("mailto:suporte@skjuridico.com.br") },
        { type: "separator" },
        { label: "Sobre", click: showAbout },
      ],
    },
  ];

  if (process.platform === "darwin") {
    template.unshift({
      label: app.name,
      submenu: [
        { role: "about" },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showAbout() {
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "SK Jurídico IA",
    message: "SK Jurídico IA",
    detail: `Versão: 1.7.0\nAssistente jurídico com inteligência artificial\npara advogados brasileiros.\n\nStack: Electron + React + Express + PostgreSQL\nSem dependência da Replit`,
    buttons: ["OK"],
  });
}

// ── Bandeja do sistema (System Tray) ──────────────────────────────────────────

function createTray() {
  if (!fs.existsSync(ICON_PATH)) return;

  try {
    const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
    tray = new Tray(icon);
    const menu = Menu.buildFromTemplate([
      { label: "Abrir SK Jurídico", click: () => mainWindow ? mainWindow.show() : createWindow() },
      { type: "separator" },
      { label: "Sair", click: () => app.quit() },
    ]);
    tray.setToolTip("SK Jurídico IA");
    tray.setContextMenu(menu);
    tray.on("double-click", () => mainWindow ? mainWindow.show() : createWindow());
  } catch (e) {
    // Tray opcional — ignora erros
  }
}

// ── Ciclo de vida do Electron ─────────────────────────────────────────────────

app.whenReady().then(async () => {
  console.log("[desktop] SK Jurídico IA v1.7.0 iniciando...");

  // Inicia API backend em paralelo
  const apiPromise = startApiServer();

  // Cria a janela já (carrega com loading ou diretamente)
  createWindow();
  createTray();

  await apiPromise;
  await waitForApi(10000);

  console.log("[desktop] API pronta. App rodando.");

  // Atualiza automaticamente (produção)
  if (!IS_DEV) {
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  if (apiProcess) {
    console.log("[desktop] Encerrando API...");
    apiProcess.kill("SIGTERM");
  }
});

// ── Segurança ─────────────────────────────────────────────────────────────────

app.on("web-contents-created", (_e, contents) => {
  contents.on("will-navigate", (e, url) => {
    const allowed = [`http://localhost:${API_PORT}`, `http://localhost:${APP_PORT}`, "file://"];
    if (!allowed.some((a) => url.startsWith(a))) {
      e.preventDefault();
      shell.openExternal(url);
    }
  });
});
