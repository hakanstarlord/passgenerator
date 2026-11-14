# PassGen — Şifre Üretici

Güvenli ve kullanımı kolay masaüstü şifre üretici uygulaması.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-45-47848F?logo=electron&logoColor=white)

## Özellikler

- **Güvenli üretim** — `crypto.getRandomValues()` ile kriptografik olarak güvenli şifre üretimi (rejection sampling ile modulo bias önlemi)
- **Özelleştirilebilir** — Uzunluk (8–128), büyük/küçük harf, rakam, özel karakter seçenekleri
- **Güçlük göstergesi** — Üretilen şifrenin güçlük seviyesini anlık olarak gösterir
- **Çoklu üretim** — Tek seferde birden fazla şifre üretebilme
- **Şifreli kasa** — Kayıtlı şifreler AES-GCM ile şifrelenir, PBKDF2 (600.000 iterasyon) ile anahtar türetilir
- **Elle kayıt** — Kasaya ad, kullanıcı adı, site, şifre, kategori ve not ile kayıt eklenip düzenlenebilir; site tarayıcıda açılır
- **Ana şifreyi değiştirme** — Mevcut şifreyle doğrulanır, kasa yeni şifreyle yeniden şifrelenir; değişiklikten önceki hal eski şifreyle yedeklenir
- **Şifre sağlığı** — Kasada zayıf, birden fazla kayıtta kullanılan ve 1 yıldan uzun süredir değişmeyen şifreler özetlenir ve filtrelenebilir
- **Tarayıcıdan içe aktarma** — Chrome, Edge veya Firefox'un dışa aktardığı şifre CSV'si önizlenip kasaya alınır; birebir aynı kayıtlar atlanır
- **Geçmiş** — Üretilen şifreler Windows hesabına bağlı olarak şifreli saklanır (Electron safeStorage); maks. 100 kayıt, 30 gün otomatik temizleme
- **Pano güvenliği** — Kopyalanan şifreler 30 saniye sonra panodan otomatik temizlenir
- **Otomatik kilit** — Kasa 5 dakika hareketsizlikte, Windows kilitlenince (Win+L) veya bilgisayar uykuya geçince kilitlenir
- **Koyu tema** — Göz yormayan karanlık arayüz
- **Masaüstü uygulaması** — Electron ile Windows portable exe olarak dağıtılabilir
- **Otomatik yedek** — Masaüstü uygulamasında kasa her değişiklikte şifreli bir `.passgen` dosyası olarak `%APPDATA%\password-generator\yedekler` klasörüne yedeklenir. Yedekler hiç silinmez; geri yüklemek için İçe Aktar'dan bir yedek seçilir
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
| Electron 45 | Masaüstü uygulaması |

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
