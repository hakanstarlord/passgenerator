const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  isFullscreen: () => ipcRenderer.invoke('is-fullscreen'),
  onFullscreenChange: (callback) => {
    const handler = (_event, value) => callback(value)
    ipcRenderer.on('fullscreen-changed', handler)
    return handler
  },
  removeFullscreenListener: (handler) => {
    ipcRenderer.removeListener('fullscreen-changed', handler)
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  backupVault: (json) => ipcRenderer.invoke('vault:backup', json),
  openBackupFolder: () => ipcRenderer.invoke('vault:open-backups'),
  protectText: (text) => ipcRenderer.invoke('secure:protect', text),
  unprotectText: (encoded) => ipcRenderer.invoke('secure:unprotect', encoded),
})
