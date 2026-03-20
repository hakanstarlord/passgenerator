# PassGen — Şifre Üretici

Güvenli ve kullanımı kolay masaüstü şifre üretici uygulaması.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)

## Özellikler

- **Güvenli üretim** — `crypto.getRandomValues()` ile kriptografik olarak güvenli şifre üretimi (rejection sampling ile modulo bias önlemi)
- **Özelleştirilebilir** — Uzunluk (8–128), büyük/küçük harf, rakam, özel karakter seçenekleri
- **Güçlük göstergesi** — Üretilen şifrenin güçlük seviyesini anlık olarak gösterir
- **Çoklu üretim** — Tek seferde birden fazla şifre üretebilme
- **Şifreli kasa** — Kayıtlı şifreler AES-GCM ile şifrelenir, PBKDF2 (600.000 iterasyon) ile anahtar türetilir
- **Geçmiş** — Üretilen şifreler localStorage'da saklanır (maks. 100 kayıt, 30 gün otomatik temizleme)
- **Pano güvenliği** — Kopyalanan şifreler 30 saniye sonra panodan otomatik temizlenir
- **Koyu tema** — Göz yormayan karanlık arayüz
- **Masaüstü uygulaması** — Electron ile Windows portable exe olarak dağıtılabilir
- **Electron güvenliği** — CSP header, sandbox, dış navigasyon engeli

## Hızlı Başlangıç

Projeyi kendi bilgisayarınıza kurmak için aşağıdaki adımları izleyin:

### Gereksinimler

- [Node.js](https://nodejs.org/) (v18 veya üzeri)
- [Git](https://git-scm.com/)

### Kurulum

```bash
# 1. Projeyi klonlayın
git clone https://github.com/hakanstarlord/passgenerator.git

# 2. Proje klasörüne girin
cd passgenerator

# 3. Bağımlılıkları yükleyin
npm install
```

### Çalıştırma

```bash
# Tarayıcıda açmak için
npm run dev

# Masaüstü uygulaması olarak açmak için
npm run electron:dev

# Windows portable exe oluşturmak için
npm run electron:build
```

`npm run dev` komutu çalıştıktan sonra terminalde görünen adresi (varsayılan: `http://localhost:5173`) tarayıcınızda açın.

## Teknolojiler

| Teknoloji | Kullanım |
|-----------|----------|
| React 19 | Arayüz bileşenleri |
| Vite 8 | Build aracı |
| TailwindCSS 3 | Stil |
| Lucide React | İkonlar |
| Electron 41 | Masaüstü uygulaması |

## Proje Yapısı

```
├── build/              # Uygulama ikonu (electron-builder)
├── electron/           # Electron ana süreç (CSP, sandbox, navigasyon kısıtlamaları)
├── public/             # Statik dosyalar
├── src/
│   ├── App.jsx               # Ana konteyner, tab yönetimi
│   ├── GeneratorPanel.jsx    # Şifre üretim paneli
│   ├── HistoryPanel.jsx      # Geçmiş paneli
│   ├── VaultPanel.jsx        # Kasa paneli (kurulum / kilit / açık)
│   ├── hooks/
│   │   ├── usePasswordHistory.js   # Geçmiş hook (boyut sınırlı)
│   │   └── useSavedPasswords.js    # Kasa hook (AES-GCM şifreli)
│   └── utils/
│       ├── passwordGenerator.js    # Şifre üretimi, güçlük hesaplama
│       ├── clipboard.js            # Pano yardımcısı (otomatik temizleme)
│       └── crypto.js               # AES-GCM şifreleme, PBKDF2 anahtar türetme
```

## Lisans

MIT
