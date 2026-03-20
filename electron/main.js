import { app, BrowserWindow, ipcMain, session } from 'electron'
import { join } from 'path'

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: 'Şifre Üretici',
    icon: join(app.getAppPath(), 'build', 'icon.png'),
    autoHideMenuBar: true,
    backgroundColor: '#0f0f0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      preload: join(app.getAppPath(), 'electron', 'preload.cjs')
    }
  })

  // F11 ile tam ekran geçişi
  win.webContents.on('before-input-event', (_event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      win.setFullScreen(!win.isFullScreen())
    }
  })

  // Tam ekran durumu değiştiğinde renderer'a bildir
  win.on('enter-full-screen', () => {
    win.webContents.send('fullscreen-changed', true)
  })
  win.on('leave-full-screen', () => {
    win.webContents.send('fullscreen-changed', false)
  })

  // IPC: tam ekran aç/kapat
  ipcMain.handle('toggle-fullscreen', () => {
    win.setFullScreen(!win.isFullScreen())
    return win.isFullScreen()
  })

  // IPC: tam ekran durumunu sorgula
  ipcMain.handle('is-fullscreen', () => {
    return win.isFullScreen()
  })

  // Navigasyon kısıtlamaları
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault()
    }
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // Production: load built files
  win.loadFile(join(app.getAppPath(), 'dist', 'index.html'))
}

app.whenReady().then(() => {
  // CSP header injection
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; object-src 'none'"
        ]
      }
    })
  })

  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
