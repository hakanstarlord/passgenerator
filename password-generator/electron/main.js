import { app, BrowserWindow, ipcMain, session, net, shell } from 'electron'
import { join } from 'path'
import { readFileSync } from 'fs'

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: 'Şifre Üretici',
    icon: join(app.getAppPath(), 'build', 'icon.ico'),
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

// GitHub repo — kullanıcı tarafından ayarlanacak
const GITHUB_OWNER = 'hakanbugracerit'
const GITHUB_REPO = 'password-generator'

function checkForUpdates() {
  return new Promise((resolve) => {
    try {
      const pkgPath = join(app.getAppPath(), 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
      const currentVersion = pkg.version

      const request = net.request({
        method: 'GET',
        url: `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`,
      })

      request.setHeader('User-Agent', 'PassGen-Update-Check')

      let body = ''
      request.on('response', (response) => {
        if (response.statusCode !== 200) {
          resolve({ hasUpdate: false, currentVersion, latestVersion: currentVersion, releaseUrl: '' })
          return
        }
        response.on('data', (chunk) => { body += chunk.toString() })
        response.on('end', () => {
          try {
            const data = JSON.parse(body)
            const latestVersion = (data.tag_name || '').replace(/^v/, '')
            const releaseUrl = data.html_url || ''
            const hasUpdate = latestVersion && latestVersion !== currentVersion && compareVersions(latestVersion, currentVersion) > 0
            resolve({ hasUpdate, currentVersion, latestVersion, releaseUrl })
          } catch {
            resolve({ hasUpdate: false, currentVersion, latestVersion: currentVersion, releaseUrl: '' })
          }
        })
      })

      request.on('error', () => {
        resolve({ hasUpdate: false, currentVersion, latestVersion: currentVersion, releaseUrl: '' })
      })

      request.end()
    } catch {
      resolve({ hasUpdate: false, currentVersion: '0.0.0', latestVersion: '0.0.0', releaseUrl: '' })
    }
  })
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na > nb) return 1
    if (na < nb) return -1
  }
  return 0
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

  // IPC: güncelleme kontrolü
  ipcMain.handle('check-for-updates', () => checkForUpdates())

  // IPC: harici URL aç (sadece GitHub)
  ipcMain.handle('open-external', (_, url) => {
    if (typeof url === 'string' && url.startsWith('https://github.com/')) {
      shell.openExternal(url)
    }
  })

  createWindow()

  // 5sn sonra güncelleme kontrolü (başlangıç hızını etkilememek için)
  setTimeout(() => checkForUpdates(), 5000)
})

app.on('window-all-closed', () => {
  app.quit()
})
