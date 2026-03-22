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
  }
})
