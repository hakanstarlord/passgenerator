# CLAUDE.md — PassGen Proje Rehberi

Bu dosya, her yeni Claude Code oturumunda otomatik olarak okunur.
Amaç: Tekrar eden hataları önlemek, proje kurallarını korumak.

---

## Proje Özeti

Şifre üretici masaüstü uygulaması. React 19 + Vite 8 + TailwindCSS 3 + Lucide React + Electron 45.

### Electron sürüm notları

- **Electron 44+:** `clipboard.readText()` / `writeText()` Promise döndürür; her zaman `await` et (senkron karşılaştırma sessizce bozulur). `clipboard` modülü renderer'da yok, yalnızca ana süreçte.
- **Electron 45+:** `safeStorage` için async API kullan (`isAsyncEncryptionAvailable`, `encryptStringAsync`, `decryptStringAsync` → `{ result }`). Senkron metotlar kullanımdan kalktı, Electron 46'da siliniyor.
- **Electron 45+:** Sandbox'lı preload'da `require` yalnızca `electron` yükler; `Buffer` ve `setImmediate` yok.
- Electron yükseltmeden önce resmi `docs/breaking-changes.md` dosyasını kullandığımız API'lere göre tara.
- npm 10.9.2'nin bağımlılık çözücüsü `vitest` güncellemesinde `Cannot read properties of null (reading 'edgesOut')` hatası verir; geçici çözüm `npx -y npm@11 install ...`. npm 11 kurulum betiklerini çalıştırmaz; `electron-winstaller` için `vendor/7z.exe` ve `vendor/rcedit.exe`'nin yerinde olduğunu kontrol et.

## Dil Kuralları

- **Tüm UI metinleri Türkçe yazılmalıdır.** Türkçe karakterler (ç, ğ, ı, ö, ş, ü, İ) doğru kullanılmalıdır.
- Asla ASCII-only Türkçe yazma (Gecmis yerine Geçmiş, Sifre yerine Şifre, vb.).
- Kod içi değişken/fonksiyon isimleri İngilizce kalır.

## Dizin Yapısı

```
passwordgenerator/                 # Repo kökü = proje kökü (iç içe klasör yok)
├── build/
│   ├── icon.png                   # Uygulama ikonu (kaynak PNG)
│   └── icon.ico                   # Windows ikonu (exe'ye gömülür, rcedit ile)
├── electron/
│   ├── main.js                    # Electron ana süreç (pencere, ikon, CSP, GitHub güncelleme kontrolü)
│   ├── preload.cjs                # Preload script (contextBridge: fullscreen, güncelleme, harici URL, kasa yedeği, safeStorage, pano)
│   ├── backups.js                 # Kasa yedeği adı ve doğrulama (saf fonksiyonlar, test edilir)
│   ├── secretClipboard.js         # Şifre kopyalama + 30 sn sonra pano temizliği (ana süreç, test edilir)
│   ├── __tests__/                 # Vitest testleri (exe'ye paketlenmez)
│   └── setIcon.cjs                # afterPack hook (rcedit ile exe'ye ikon gömer)
├── scripts/
│   └── watch-build.mjs            # Değişiklikte exe'yi yeniden derler (npm run electron:watch)
├── public/
│   ├── favicon.svg                # Tarayıcı favicon
│   └── icon.png                   # Uygulama ikonu (UI içinde kullanılır)
├── src/
│   ├── App.jsx                    # Ana konteyner, tab yönetimi
│   ├── GeneratorPanel.jsx         # Şifre üretim paneli
│   ├── HistoryPanel.jsx           # Geçmiş paneli
│   ├── VaultPanel.jsx             # Kasa paneli (kurulum/kilit/açık durumları)
│   ├── VaultEntryForm.jsx         # Kasa kaydı formu (Yeni Kayıt ve düzenleme ortak)
│   ├── main.jsx                   # React giriş noktası
│   ├── index.css                  # Tailwind + özel animasyonlar
│   ├── hooks/
│   │   ├── usePasswordHistory.js  # Geçmiş hook (safeStorage ile şifreli, boyut sınırlı, otomatik temizleme)
│   │   ├── useSavedPasswords.js   # Kasa hook (AES-GCM şifreli, kilit/açma, düzenleme, içe/dışa aktarma)
│   │   ├── useUnlockRateLimit.js  # Kasa açma deneme sınırlaması (5→30sn, 10→5dk, kalıcı)
│   │   ├── useAutoLock.js         # Otomatik kilit (5dk hareketsizlik, 30sn uyarı)
│   │   └── useUndoDelete.js       # Kasada silmeyi geri alma (7 sn, en fazla 5 kayıt)
│   └── utils/
│       ├── passwordGenerator.js   # generatePassword, calculateStrength, calculateEntropy
│       ├── clipboard.js           # copyToClipboard (30 sn otomatik temizleme)
│       ├── crypto.js              # AES-GCM şifreleme/çözme, PBKDF2 anahtar türetme
│       ├── duplicateCheck.js      # Kasada duplikasyon tespiti
│       ├── exportImport.js        # Kasa dışa/içe aktarma (.passgen dosya formatı)
│       ├── categories.js          # Kasa kategorileri (etiket, ikon, normalizeCategory)
│       ├── vaultEntry.js          # normalizeVaultEntry: eksik alanları şifreden tamamlar
│       ├── masterPassword.js      # Ana şifre kuralı (getMasterPasswordProblem)
│       ├── historyStorage.js      # Geçmişi safeStorage ile şifreli okur/yazar (düz metin yazmaz)
│       ├── unlockRateLimit.js     # Kilit açma deneme sayacı (localStorage, 24 saat sıfırlama)
│       ├── siteUrl.js             # Site alanını http/https adresine çevirir, tarayıcıda açar
│       └── __tests__/             # Vitest birim testleri (utils/ için)
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
- Kasa kaydı alanları: `id`, `name`, `password`, `category`, `date`, `strength`, `length`, `charTypes` ve isteğe bağlı `username`, `url`, `notes` (boşsa hiç tutulmaz). Elle ekleme ve düzenleme `VaultEntryForm` ile yapılır; kayıt `normalizeVaultEntry`'den geçer (güç, uzunluk, karakter türleri şifreden hesaplanır). Not, şifre gösterildiğinde görünür.
- `VaultPanel` → `savePasswords`, `unlock`, `lock`, `setupMasterPassword`, `removePassword`, `restorePassword`, `updatePassword`, `importPasswords`, `exportPasswords`, `clearAll` prop'larını alır. Ana şifre hiçbir bileşene verilmez.
- `GeneratorPanel` → `savedPasswords` prop'u ile duplikasyon kontrolü yapar. Kasaya `onSaveToVault(entries)` ile tek seferde toplu yazar ve sonucu bekler.
- **Kasa yazmaları sıralıdır:** `useSavedPasswords` içindeki her değişiklik `mutate(prev => next)` ile sıraya alınır. Yeni kasa işlemi eklerken `next` listesini `savedPasswords` state'inden hesaplama — art arda çağrılarda eski liste kullanılır ve kayıtlar kaybolur.
- **Dışarıdan gelen kayıtlar normalleştirilir:** İçe aktarma, kilit açma ve migrasyonda her kayıt `normalizeVaultEntry` ile tamamlanır (eksik `charTypes`, `strength`, `length`, `date`, `name`, `id` şifreden/varsayılandan üretilir; bilinmeyen alanlar korunur). Şifresi olmayan kayıtlar atlanır ve içe aktarma önizlemesinde sayısı gösterilir. Hiç geçerli kayıt yoksa içe aktarma butonu kapalıdır.
- localStorage anahtarları: `passgen_history` (geçmiş, safeStorage ile şifreli), `passgen_vault` (kasa, şifreli)

## Güvenlik

- Şifre üretiminde **`crypto.getRandomValues()`** kullan. `Math.random()` kullanma.
- `getRandomIndex` fonksiyonunda **rejection sampling** ile modulo bias önlenir.
- Fisher-Yates shuffle algoritması ile karıştır.
- Her aktif karakter setinden en az 1 karakter garantile.
- Pano kopyalamalarında `copyToClipboard()` kullan — 30 saniye sonra pano otomatik temizlenir. Electron'da kopyalama ve temizlik ana süreçte yapılır (`clipboard:copy-secret` IPC, `electron/secretClipboard.js`): pencere odakta olmasa da çalışır, uygulama kapanırken (`will-quit`) bekleyen şifre de silinir. Panoda artık başka bir metin varsa dokunulmaz. Renderer'daki `navigator.clipboard` yolu yalnızca web modu içindir (odak dışındayken çalışmaz).
- Kasa verileri AES-GCM ile şifrelenir, anahtar PBKDF2 (SHA-256, 600.000 iterasyon) ile türetilir.
- **Ana şifre bellekte tutulmaz:** kilit açılışında (veya kurulumda) anahtar bir kez türetilir ve `useSavedPasswords` içinde dışa aktarılamaz (`extractable: false`) `CryptoKey` olarak tutulur (`vaultKeyRef = { key, salt }`). Kilitlenince silinir. Yazmalar `encryptWithKey` ile yapılır: kasa salt'ı sabit, IV her yazmada yeni.
- Şifreli blob biçimi değişmez: `base64(salt[16] | iv[12] | ciphertext)`. Kasa, otomatik yedekler ve `.passgen` dosyaları ana şifreyle `decrypt(data, password)` ile açılır. Kilit açma GCM doğrulamasına dayanır; `passwordHash` / `hashSalt` yalnızca eski sürümlerle uyumluluk için yazılır.
- Base64 dönüşümünde `bytesToBase64` / `base64ToBytes` kullan; `String.fromCharCode(...büyükDizi)` ~200 KB üstünde yığını taşırır.
- Electron: CSP header aktif, sandbox aktif, dış URL navigasyonu ve popup'lar engelli. Kayıttaki site yalnızca `site:open` IPC ile varsayılan tarayıcıda açılır; ana süreç yalnızca `http:` / `https:` kabul eder (`toSiteUrl` renderer'da şema ekler ve doğrular).
- Geçmiş en fazla 100 kayıt tutar, 30 günden eski kayıtlar otomatik temizlenir (kullanıcı bu kuralın kalmasını seçti).
- Geçmiş diske **düz metin yazılmaz**: `passgen_history` değeri `{ version: 2, protected }` biçiminde Electron `safeStorage` (Windows DPAPI) ile şifrelidir (`secure:protect` / `secure:unprotect` IPC, `src/utils/historyStorage.js`). Eski düz dizi biçimi ilk açılışta şifreli biçime çevrilir. safeStorage yoksa (web modu) geçmiş yalnızca bellekte tutulur. Çözülemeyen veri silinmez, `passgen_history_unreadable` anahtarına kopyalanır.
- Master şifre belirleme: **en az 12 karakter** ve güç skoru >= 2 ("Orta") zorunlu (`getMasterPasswordProblem`, `src/utils/masterPassword.js`). Kural yalnızca kasa kurulumunda (ve ileride ana şifre değiştirmede) uygulanır; mevcut ana şifreler ve kilit açma etkilenmez.
- Kasa açma deneme sınırlaması: 5 başarısız → 30sn, 10 ve üstü → her başarısızlıkta 5dk bekleme. Durum `localStorage`'da (`passgen_unlock_rate`) tutulur, uygulama yeniden başlatılınca korunur (`src/utils/unlockRateLimit.js`). Başarılı açılışta veya son başarısızlıktan 24 saat sonra sayaç sıfırlanır. Bekleme süresi en fazla 5dk'ya kırpılır (saat geri alınırsa uzamasın).
- Otomatik kilit: 5dk hareketsizlikte kasa kilitlenir, 30sn önce uyarı banner'ı gösterilir.
- Kasaya kaydetmeden önce duplikasyon kontrolü yapılır.
- Dışa aktarma: kasa verileri master şifreyle şifreli `.passgen` dosyası olarak indirilir.
- İçe aktarma: `.passgen` dosyası şifre çözülerek önizlenir, birleştir/değiştir modları desteklenir.
- Otomatik yedek (yalnızca Electron): her başarılı kasa yazmasından sonra şifreli `.passgen` yedeği `%APPDATA%\password-generator\yedekler` klasörüne **yeni bir dosya** olarak yazılır (`saveAutoBackup` → `vault:backup` IPC → `electron/backups.js`). Yedekler **asla silinmez, döndürülmez, üzerine yazılmaz** (`wx` bayrağı). Geri yükleme İçe Aktar ile yapılır; İçe Aktar penceresinde "Yedek Klasörünü Aç" butonu vardır.

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
npm test               # Vitest birim testleri (tek sefer)
npm run test:watch     # Vitest izleme modu
npm run preview        # Production önizleme (web)
npm run electron:dev   # Electron ile hızlı test (build + aç)
npm run electron:build # Portable exe oluştur (release/ altına)
npm run electron:watch # Değişiklikte exe'yi otomatik yeniden derle
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
11. **Kayıtlı şifreleri veya yedeklerini otomatik silme:** Yedekleri temizleyen, budayan, döndüren veya üzerine yazan kod ekleme; sayı/süre sınırlı saklama kuralı önerme. Kullanıcı kuralı: kayıtlı şifreler kesinlikle silinmemeli. Disk kullanımı kaygısı varsa bilgi ver, temizliği kullanıcıya bırak.

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
