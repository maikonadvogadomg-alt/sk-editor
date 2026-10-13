const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 400,
    minHeight: 300,
    title: 'codelens-local',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,          // permite file:// carregar recursos locais
      allowRunningInsecureContent: true,
    },
    show: false,
    autoHideMenuBar: true,
    // Sem icon — usa ícone padrão do Electron (evita erro de arquivo ausente)
  });

  // Carrega o app web a partir da pasta www/
  win.loadFile(path.join(__dirname, 'www', 'index.html'));

  // Mostra janela só quando estiver pronto (evita flash branco)
  win.once('ready-to-show', () => win.show());

  // Sem barra de menu
  Menu.setApplicationMenu(null);
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
