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
  // Ekran kilidi / uyku: ana süreç kasanın kilitlenmesini ister
  onLockRequest: (callback) => {
    const handler = () => callback()
    ipcRenderer.on('vault:lock-request', handler)
    return handler
  },
  removeLockRequestListener: (handler) => {
    ipcRenderer.removeListener('vault:lock-request', handler)
  },
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  openSite: (url) => ipcRenderer.invoke('site:open', url),
  backupVault: (json) => ipcRenderer.invoke('vault:backup', json),
  openBackupFolder: () => ipcRenderer.invoke('vault:open-backups'),
  copySecret: (text) => ipcRenderer.invoke('clipboard:copy-secret', text),
  protectText: (text) => ipcRenderer.invoke('secure:protect', text),
  unprotectText: (encoded) => ipcRenderer.invoke('secure:unprotect', encoded),
})
