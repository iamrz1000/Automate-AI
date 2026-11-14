const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('automateDesktop', {
  isElectron: true,
  platform: process.platform,
  arch: process.arch,
  getPlatformInfo: () => ipcRenderer.invoke('automate:get-platform-info'),
  notify: (title, body) => ipcRenderer.invoke('automate:notify', { title, body }),
  saveFile: (filename, base64Data) =>
    ipcRenderer.invoke('automate:save-file', { filename, base64Data }),
  openExternal: (url) => ipcRenderer.invoke('automate:open-external', url),
});
