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

## Kurulum

```bash
git clone https://github.com/hakanstarlord/passgenerator.git
cd passgenerator
npm install
```

## Kullanım

```bash
# Geliştirme sunucusu (tarayıcı)
npm run dev

# Electron ile çalıştırma
npm run electron:dev

# Production build (web)
npm run build

# Portable exe oluşturma (Windows)
npm run electron:build
```

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
