# CLAUDE.md — PassGen Proje Rehberi

Bu dosya, her yeni Claude Code oturumunda otomatik olarak okunur.
Amaç: Tekrar eden hataları önlemek, proje kurallarını korumak.

---

## Proje Özeti

Şifre üretici masaüstü uygulaması. React 19 + Vite 8 + TailwindCSS 3 + Lucide React + Electron 41.

## Dil Kuralları

- **Tüm UI metinleri Türkçe yazılmalıdır.** Türkçe karakterler (ç, ğ, ı, ö, ş, ü, İ) doğru kullanılmalıdır.
- Asla ASCII-only Türkçe yazma (Gecmis yerine Geçmiş, Sifre yerine Şifre, vb.).
- Kod içi değişken/fonksiyon isimleri İngilizce kalır.

## Dizin Yapısı

```
password-generator/
├── build/
│   ├── icon.png                   # Uygulama ikonu (kaynak PNG)
│   └── icon.ico                   # Windows ikonu (exe'ye gömülür, rcedit ile)
├── electron/
│   ├── main.js                    # Electron ana süreç (pencere, menü, ikon)
│   ├── preload.cjs                # Preload script (contextBridge, fullscreen API)
│   └── setIcon.cjs                # afterPack hook (rcedit ile exe'ye ikon gömer)
├── public/
│   ├── favicon.svg                # Tarayıcı favicon
│   └── icon.png                   # Uygulama ikonu (UI içinde kullanılır)
├── src/
│   ├── App.jsx                    # Ana konteyner, tab yönetimi
│   ├── GeneratorPanel.jsx         # Şifre üretim paneli
│   ├── HistoryPanel.jsx           # Geçmiş paneli
│   ├── VaultPanel.jsx             # Kasa paneli (kurulum/kilit/açık durumları)
│   ├── main.jsx                   # React giriş noktası
│   ├── index.css                  # Tailwind + özel animasyonlar
│   ├── hooks/
│   │   ├── usePasswordHistory.js  # Geçmiş hook (boyut sınırlı, otomatik temizleme)
│   │   ├── useSavedPasswords.js   # Kasa hook (AES-GCM şifreli, kilit/açma, düzenleme, içe/dışa aktarma)
│   │   ├── useUnlockRateLimit.js  # Kasa açma deneme sınırlaması (5→30sn, 10→5dk)
│   │   └── useAutoLock.js         # Otomatik kilit (5dk hareketsizlik, 30sn uyarı)
│   └── utils/
│       ├── passwordGenerator.js   # generatePassword, calculateStrength
│       ├── clipboard.js           # copyToClipboard (30 sn otomatik temizleme)
│       ├── crypto.js              # AES-GCM şifreleme/çözme, PBKDF2 anahtar türetme
│       ├── duplicateCheck.js      # Kasada duplikasyon tespiti
│       └── exportImport.js        # Kasa dışa/içe aktarma (.passgen dosya formatı)
├── release/                       # Electron build çıktısı (git-ignore)
```

## Dosya Adlandırma

- **Bileşenler:** PascalCase `.jsx` (GeneratorPanel.jsx)
- **Hooklar:** camelCase `use` prefix `.js` (usePasswordHistory.js)
- **Yardımcılar:** camelCase `.js` (passwordGenerator.js)

## Stil ve Tema

- Koyu tema: arka planlar `#0f0f0f`, `#16213e`, `#1a1a2e`
- Ana renk: Indigo (`#6366f1`, `indigo-500`)
- Yalnızca TailwindCSS sınıfları kullan. Satır içi stil yalnızca dinamik değerler (renk, genişlik) için.
- Özel animasyonlar `index.css` içinde `@keyframes` ile tanımlanır.
- Kart ve panel border deseni: `bg-white/[0.03] border border-white/[0.06]`

## Bileşen Kuralları

- Tüm bileşenler fonksiyonel, hook tabanlı.
- Küçük yardımcı bileşenler (ToggleSwitch, PasswordCard) aynı dosyada tanımlanabilir.
- Olay işleyicilerde `useCallback` tercih et.
- State yönetimi: `useState` + özel hooklar. Redux/Context yok.

## Veri Akışı

- State `App.jsx`'te tutulur, child bileşenlere prop olarak geçilir.
- `GeneratorPanel` → `onGenerate` callback ile geçmişe yazar. Kasaya kaydedilen şifreler geçmişe eklenmez.
- `HistoryPanel` → `removeFromHistory`, `clearHistory` prop'larını alır.
- `VaultPanel` → `unlock`, `lock`, `setupMasterPassword`, `removePassword`, `updatePassword`, `importPasswords`, `getMasterPassword`, `clearAll` prop'larını alır.
- `GeneratorPanel` → `savedPasswords` prop'u ile duplikasyon kontrolü yapar.
- localStorage anahtarları: `passgen_history` (geçmiş), `passgen_vault` (kasa, şifreli)

## Güvenlik

- Şifre üretiminde **`crypto.getRandomValues()`** kullan. `Math.random()` kullanma.
- `getRandomIndex` fonksiyonunda **rejection sampling** ile modulo bias önlenir.
- Fisher-Yates shuffle algoritması ile karıştır.
- Her aktif karakter setinden en az 1 karakter garantile.
- Pano kopyalamalarında `copyToClipboard()` kullan — 30 saniye sonra pano otomatik temizlenir.
- Kasa verileri AES-GCM ile şifrelenir, anahtar PBKDF2 (SHA-256, 600.000 iterasyon) ile türetilir.
- Electron: CSP header aktif, sandbox aktif, dış URL navigasyonu ve popup'lar engelli.
- Geçmiş en fazla 100 kayıt tutar, 30 günden eski kayıtlar otomatik temizlenir.
- Master şifre belirleme: minimum güç skoru >= 2 ("Orta") zorunlu.
- Kasa açma deneme sınırlaması: 5 başarısız → 30sn, 10 başarısız → 5dk bekleme (`sessionStorage`).
- Otomatik kilit: 5dk hareketsizlikte kasa kilitlenir, 30sn önce uyarı banner'ı gösterilir.
- Kasaya kaydetmeden önce duplikasyon kontrolü yapılır.
- Dışa aktarma: kasa verileri master şifreyle şifreli `.passgen` dosyası olarak indirilir.
- İçe aktarma: `.passgen` dosyası şifre çözülerek önizlenir, birleştir/değiştir modları desteklenir.

## Güçlük Hesaplama

- 0-4 skor skalası.
- Etiketler (Türkçe): Çok Zayıf → Zayıf → Orta → Güçlü → Çok Güçlü
- Renkler: `#ef4444` → `#f97316` → `#eab308` → `#22c55e` → `#4ade80`

## İkon Kütüphanesi

- Yalnızca `lucide-react` kullan. Başka ikon kütüphanesi ekleme.
- Import: `import { IconName } from 'lucide-react'`

## Uygulama İkonu

- İkon dosyaları üç yerde bulunur: `build/icon.png` (kaynak), `build/icon.ico` (Windows exe ikonu), `public/icon.png` (UI).
- `build/icon.ico` multi-size formatında olmalıdır (16x16, 32x32, 48x48, 256x256).
- `electron/main.js`'te `BrowserWindow`'a `icon` parametresi ile `build/icon.ico` verilir (görev çubuğu ikonu).
- `electron/setIcon.cjs` — `afterPack` hook'u olarak çalışır, `rcedit` ile ikonu exe'ye gömer (kısayol/dosya gezgini ikonu).
- `App.jsx`'te sol üst başlık çubuğunda `<img src="./icon.png">` ile gösterilir.
- İkon güncellenirken **üç konum da** (`build/icon.png`, `build/icon.ico`, `public/icon.png`) güncellenmelidir.
- PNG → ICO dönüşümü: `npx --yes png-to-ico build/icon.png > build/icon.ico`
- Önerilen boyut: minimum 512×512 px, şeffaf arka planlı PNG.
- **Not:** `signAndEditExecutable: false` olduğu için electron-builder ikonu gömmez; `setIcon.cjs` bu işi `afterPack` aşamasında yapar. rcedit Türkçe karakterli dosya adlarını desteklemediğinden geçici kopya kullanılır.

## Komutlar

```bash
npm run dev            # Geliştirme sunucusu (web)
npm run build          # Production derleme (web)
npm run lint           # ESLint kontrolü
npm run preview        # Production önizleme (web)
npm run electron:dev   # Electron ile hızlı test (build + aç)
npm run electron:build # Portable exe oluştur (release/ altına)
```

## Sık Yapılan Hatalar — YAPMA

1. **Türkçe karakter unutma:** `Gecmis` yerine `Geçmiş`, `Tumunu` yerine `Tümünü` yaz.
2. **Math.random() kullanma:** Şifre üretiminde her zaman `crypto.getRandomValues()` kullan.
3. **Yeni bağımlılık ekleme:** Mevcut stack yeterli. Yeni paket eklemeden önce sor.
4. **Inline CSS ile tema rengi hardcode etme:** Tailwind sınıflarını tercih et.
5. **localStorage key'ini değiştirme:** `passgen_history` ve `passgen_vault` anahtarlarını değiştirme.
9. **`navigator.clipboard.writeText()` doğrudan kullanma:** Her zaman `copyToClipboard()` yardımcısını kullan.
10. **Kasaya kaydedilen şifreleri geçmişe ekleme:** Kasaya giden şifreler geçmişte görünmemeli.
6. **Bileşen dosyalarını gereksiz bölme:** Küçük yardımcı bileşenler ana dosyada kalabilir.
7. **İngilizce UI metni yazma:** Tüm kullanıcıya görünen metinler Türkçe olmalı.
8. **`vite.config.js`'de `base: './'` silme:** Electron'da dosya yollarının çalışması için gerekli.

## Yeni Özellik Eklerken

1. Mevcut dosyaları oku, yapıyı anla.
2. Yeni bileşen gerekiyorsa `src/` altına PascalCase `.jsx` ile ekle.
3. Yeni hook gerekiyorsa `src/hooks/` altına.
4. Yeni yardımcı fonksiyon gerekiyorsa `src/utils/` altına.
5. Her değişiklikten sonra `npm run build` ile doğrula.
6. **Bu dosyayı güncelle** — yeni kural veya yapı değişikliği varsa buraya ekle.

---

## Çalışma Prensiplerim (Claude Code Davranış Kuralları)

### 1. Önce Planla (Plan Mode Default)
- 3+ adım veya mimari karar gerektiren her görev için plan moduna gir.
- Bir şey ters giderse HEMEN DUR ve yeniden planla — körlemesine devam etme.
- Doğrulama adımları için de plan modu kullan, sadece inşa için değil.
- Belirsizliği azaltmak için baştan detaylı spec yaz.

### 2. Subagent Stratejisi
- Ana context penceresini temiz tutmak için subagent'ları bolca kullan.
- Araştırma, keşif ve paralel analizleri subagent'lara devret.
- Karmaşık problemlerde subagent'lar aracılığıyla daha fazla hesaplama gücü kullan.
- Her subagent'a tek bir odaklı görev ver.

### 3. Kendini Geliştirme Döngüsü
- Kullanıcıdan gelen HER düzeltmeden sonra: `tasks/lessons.md` dosyasını pattern ile güncelle.
- Aynı hatanın tekrarını engelleyen kurallar yaz.
- Hata oranı düşene kadar bu dersler üzerinde kararlılıkla iterasyon yap.
- Oturum başında ilgili proje dersleri gözden geçirilir.

### 4. Bitmeden Önce Doğrula
- Bir görevi çalıştığını kanıtlamadan asla tamamlandı olarak işaretleme.
- Uygun olduğunda main ile kendi değişikliklerin arasındaki farkı karşılaştır.
- Kendine sor: "Kıdemli bir mühendis bunu onaylar mıydı?"
- Testleri çalıştır, logları kontrol et, doğruluğu göster.

### 5. Zarafet Talep Et (Dengeli)
- Önemsiz olmayan değişikliklerde dur ve sor: "Daha zarif bir yol var mı?"
- Bir çözüm hack gibi hissettiriyorsa: "Bildiklerimin ışığında zarif çözümü uygula."
- Basit ve bariz düzeltmelerde bunu atla — aşırı mühendislik yapma.
- Sunmadan önce kendi çalışmanı sorgula.

### 6. Otonom Hata Çözme
- Hata raporu verildiğinde: direkt çöz. Yönlendirme bekleme.
- Logları, hataları, başarısız testleri işaret et — sonra çöz.
- Kullanıcıdan sıfır bağlam değişikliği talep et.
- Başarısız CI testlerini söylenmeden git düzelt.

---

## Görev Yönetimi

1. **Önce Planla**: `tasks/todo.md` dosyasına işaretlenebilir maddelerle plan yaz.
2. **Planı Doğrula**: Uygulamaya başlamadan önce kullanıcıyla kontrol et.
3. **İlerlemeyi Takip Et**: Tamamlanan maddeleri ilerledikçe işaretle.
4. **Değişiklikleri Açıkla**: Her adımda üst düzey özet ver.
5. **Sonuçları Belgele**: `tasks/todo.md` dosyasına inceleme bölümü ekle.
6. **Dersleri Kaydet**: Düzeltmelerden sonra `tasks/lessons.md` dosyasını güncelle.

---

## Temel İlkeler

- **Önce Basitlik**: Her değişikliği mümkün olduğunca basit yap. Minimum koda etki et.
- **Tembellik Yok**: Kök nedenleri bul. Geçici çözüm yok. Kıdemli geliştirici standartları.
