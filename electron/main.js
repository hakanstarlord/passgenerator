import { app, BrowserWindow } from 'electron'
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
      contextIsolation: true
    }
  })

  // Production: load built files
  win.loadFile(join(app.getAppPath(), 'dist', 'index.html'))
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  app.quit()
})
