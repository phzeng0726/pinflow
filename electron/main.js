const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  nativeImage,
  screen,
  dialog,
} = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const { spawn } = require("child_process");
const http = require("http");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";

const isDev = !!process.env.ELECTRON_DEV;
const BACKEND_PORT = 34115;
const FRONTEND_DEV_URL = "http://localhost:5173";

let mainWindow = null;
let pinWindow = null;
let tray = null;
let backendProcess = null;

// ── Backend ──────────────────────────────────────────────────────────────────

function startBackend() {
  if (isDev) {
    // In dev mode the user runs `go run .` manually, nothing to spawn.
    return;
  }

  const exe = path.join(process.resourcesPath, "pinflow-backend.exe");
  const workspacePath = path.join(app.getPath("userData"), "workspace");
  backendProcess = spawn(exe, ["--workspace", workspacePath], {
    stdio: "ignore",
    detached: false,
  });
  backendProcess.on("error", (err) => console.error("[backend]", err));
}

function waitForBackend(retries = 20, interval = 500) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const req = http.get(
        `http://localhost:${BACKEND_PORT}/api/health`,
        (res) => {
          if (res.statusCode === 200) return resolve();
          tryAgain();
        },
      );
      req.on("error", tryAgain);
      req.setTimeout(400, () => {
        req.destroy();
        tryAgain();
      });
    };
    const tryAgain = () => {
      attempts++;
      if (attempts >= retries)
        return reject(new Error("Backend did not start in time"));
      setTimeout(check, interval);
    };
    check();
  });
}

// ── Windows ───────────────────────────────────────────────────────────────────

function getIndexUrl(route = "") {
  if (isDev) return FRONTEND_DEV_URL + route;
  const indexPath = path.join(
    __dirname,
    "..",
    "frontend",
    "dist",
    "index.html",
  );
  return pathToFileURL(indexPath).href + (route ? "#" + route : "");
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 500,
    title: "PinFlow",
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(getIndexUrl());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createPinWindow() {
  pinWindow = new BrowserWindow({
    width: 300,
    height: 500,
    x: 20,
    y: 20,
    minWidth: 240,
    minHeight: 200,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    resizable: true,
    title: "PinFlow – Pins",
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // TanStack Router with hash routing in file:// mode
  if (isDev) {
    pinWindow.loadURL(FRONTEND_DEV_URL + "/#/pin");
  } else {
    const indexPath = path.join(
      __dirname,
      "..",
      "frontend",
      "dist",
      "index.html",
    );
    pinWindow.loadURL(pathToFileURL(indexPath).href + "#/pin");
  }

  pinWindow.setAlwaysOnTop(true, "screen-saver");
  pinWindow.on("closed", () => {
    pinWindow = null;
  });
}

// ── Tray ──────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, "icons", "icon.ico");
  const img = nativeImage.createFromPath(iconPath);
  tray = new Tray(img.isEmpty() ? nativeImage.createEmpty() : img);
  tray.setToolTip("PinFlow");
  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    {
      label: pinWindow
        ? pinWindow.isVisible()
          ? "Hide Pin Window"
          : "Show Pin Window"
        : "Open Pin Window",
      click: togglePinWindow,
    },
    { type: "separator" },
    { label: "Quit", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
}

function togglePinWindow() {
  if (!pinWindow) {
    createPinWindow();
    updateTrayMenu();
    return;
  }
  if (pinWindow.isVisible()) {
    pinWindow.hide();
  } else {
    pinWindow.show();
    pinWindow.focus();
  }
  updateTrayMenu();
}

// ── IPC ───────────────────────────────────────────────────────────────────────

ipcMain.on("open-card-detail", (_event, { boardId, cardId }) => {
  const { width: sw, height: sh } = screen.getPrimaryDisplay().workAreaSize;
  const w = 960;
  const h = 720;
  const x = Math.round((sw - w) / 2);
  const y = Math.round((sh - h) / 2);

  const win = new BrowserWindow({
    width: w,
    height: h,
    x,
    y,
    show: false,
    alwaysOnTop: true,
    transparent: true,
    frame: false,
    title: "PinFlow – Card Detail",
    icon: path.join(__dirname, "icons", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.once("ready-to-show", () => win.show());

  const route = `/card-detail?boardId=${boardId}&cardId=${cardId}`;
  if (isDev) {
    win.loadURL(FRONTEND_DEV_URL + "/#" + route);
  } else {
    const indexPath = path.join(
      __dirname,
      "..",
      "frontend",
      "dist",
      "index.html",
    );
    win.loadURL(pathToFileURL(indexPath).href + `#${route}`);
  }
});

ipcMain.on("minimize-window", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});
ipcMain.on("toggle-pin-window", () => togglePinWindow());
ipcMain.on("hide-pin-window", () => {
  if (pinWindow && pinWindow.isVisible()) {
    pinWindow.hide();
    updateTrayMenu();
  }
});

// 接收 theme/locale 設定變更，廣播給其他視窗
ipcMain.on("broadcast-settings", (event, settings) => {
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    if (win.webContents !== event.sender) {
      win.webContents.send("settings", settings);
    }
  });
});

// 接收來自任一視窗的 React Query 資料刷新指令，並廣播給其他視窗
ipcMain.on("broadcast-query-invalidation", (event, queryKey) => {
  // 取得所有開啟的視窗
  const windows = BrowserWindow.getAllWindows();
  windows.forEach((win) => {
    // 排除發送指令的來源視窗，只通知「其他」視窗進行畫面跟資料的刷新
    // 確保主視窗操作會同步到小視窗，反之亦然
    if (win.webContents !== event.sender) {
      win.webContents.send("query-invalidation", queryKey);
    }
  });
});

// ── Auto Updater ──────────────────────────────────────────────────────────────

function setupAutoUpdater() {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("update-available", (info) => {
    log.info("[updater] Update available:", info.version);
    mainWindow?.webContents.send("updater:available", { version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    log.info("[updater] Already up to date.");
  });

  autoUpdater.on("download-progress", (progress) => {
    const percent = Math.round(progress.percent);
    log.info(`[updater] Downloading... ${percent}% (total: ${progress.total})`);
    mainWindow?.setProgressBar(progress.percent / 100);
    mainWindow?.webContents.send("updater:progress", { percent, total: progress.total });
  });

  autoUpdater.on("update-downloaded", () => {
    log.info("[updater] Update downloaded.");
    mainWindow?.setProgressBar(-1);
    mainWindow?.webContents.send("updater:downloaded");
  });

  autoUpdater.on("error", (err) => {
    log.error("[updater] Error:", err.message);
    mainWindow?.setProgressBar(-1);
    mainWindow?.webContents.send("updater:error", { message: err.message });
  });

  autoUpdater.checkForUpdates();
}

ipcMain.on("updater:start-download", () => {
  autoUpdater.downloadUpdate();
});

ipcMain.on("updater:install", () => {
  autoUpdater.quitAndInstall(true, true);
});

// ── App lifecycle ─────────────────────────────────────────────────────────────

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) {
      createMainWindow();
      return;
    }
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (!mainWindow.isVisible()) mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    startBackend();

    try {
      await waitForBackend();
    } catch (e) {
      console.warn(
        "[main] Backend health check failed — continuing anyway:",
        e.message,
      );
    }

    createMainWindow();
    createTray();
    if (!isDev) setupAutoUpdater();
  });

  app.on("window-all-closed", () => {
    // Keep running in tray on all platforms
  });

  app.on("activate", () => {
    if (!mainWindow) createMainWindow();
  });

  app.on("will-quit", () => {
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
  });
}
