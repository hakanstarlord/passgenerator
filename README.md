# PassGen — Şifre Üretici

Güvenli ve kullanımı kolay masaüstü şifre üretici uygulaması.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?logo=tailwindcss&logoColor=white)
![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)

## Özellikler

- **Güvenli üretim** — `crypto.getRandomValues()` ile kriptografik olarak güvenli şifre üretimi
- **Özelleştirilebilir** — Uzunluk (8–128), büyük/küçük harf, rakam, özel karakter seçenekleri
- **Güçlük göstergesi** — Üretilen şifrenin güçlük seviyesini anlık olarak gösterir
- **Çoklu üretim** — Tek seferde birden fazla şifre üretebilme
- **Geçmiş** — Üretilen şifreler localStorage'da saklanır
- **Koyu tema** — Göz yormayan karanlık arayüz
- **Masaüstü uygulaması** — Electron ile Windows portable exe olarak dağıtılabilir

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
├── electron/           # Electron ana süreç
├── public/             # Statik dosyalar
├── src/
│   ├── App.jsx               # Ana konteyner, tab yönetimi
│   ├── GeneratorPanel.jsx    # Şifre üretim paneli
│   ├── HistoryPanel.jsx      # Geçmiş paneli
│   ├── hooks/                # Özel React hook'ları
│   └── utils/                # Yardımcı fonksiyonlar
```

## Lisans

MIT
