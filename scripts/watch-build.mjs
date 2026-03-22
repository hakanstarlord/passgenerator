import { watch } from 'fs'
import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const watchDirs = ['src', 'electron', 'public'].map(d => resolve(root, d))

let building = false
let queued = false

function build() {
  if (building) {
    queued = true
    return
  }
  building = true
  const start = Date.now()
  console.log('\n\x1b[36m[watch]\x1b[0m Değişiklik algılandı, exe derleniyor...')
  try {
    execSync('npm run electron:build', { cwd: root, stdio: 'inherit' })
    const sec = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\x1b[32m[watch]\x1b[0m Exe güncellendi (${sec}s). Değişiklik bekleniyor...`)
  } catch {
    console.log('\x1b[31m[watch]\x1b[0m Build başarısız! Değişiklik bekleniyor...')
  }
  building = false
  if (queued) {
    queued = false
    build()
  }
}

let debounce = null
function onChange(eventType, filename) {
  if (!filename) return
  if (filename.endsWith('~') || filename.startsWith('.')) return
  clearTimeout(debounce)
  debounce = setTimeout(build, 500)
}

for (const dir of watchDirs) {
  watch(dir, { recursive: true }, onChange)
}

console.log('\x1b[36m[watch]\x1b[0m İlk exe derleniyor...')
build()
console.log('\x1b[36m[watch]\x1b[0m src/, electron/, public/ klasörleri izleniyor.')
console.log('\x1b[36m[watch]\x1b[0m Durdurmak için Ctrl+C\n')
