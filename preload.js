const { contextBridge } = require('electron');

// Expõe informações do Electron para o app web
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,   // 'win32' | 'darwin' | 'linux'
  version: process.versions.electron,
  isDesktop: true,
});
