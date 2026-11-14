# Değişiklik Günlüğü

## 1.1.0 — 2026-11-14

Projenin baştan sona incelenip iyileştirildiği oturumda yapılanlar. Ayrıntılar ilgili commit mesajlarında.

### Yeni özellikler

- **Kasaya elle kayıt:** Kasa ekranında "Yeni Kayıt". Kayıtlara kullanıcı adı, site ve not eklenebilir. Kullanıcı adı kopyalanır, site varsayılan tarayıcıda açılır, not şifre gösterilince görünür. Arama ad, kullanıcı adı ve sitede yapılır.
- **Ana şifreyi değiştirme:** Kasa başlığındaki anahtar ikonu. Mevcut şifre kasa çözülerek doğrulanır. Değişiklikten önceki hal eski şifreyle yedeklenir.
- **Tarayıcıdan içe aktarma:** Chrome, Edge ve Firefox şifre CSV'si önizlenip kasaya alınır. Birebir aynı kayıtlar atlanır.
- **Üretilen şifre kartında "Kasaya kaydet":** Şifre üretildikten sonra ad, kullanıcı adı, site, kategori ve notla kaydedilir. Kasaya giden şifre geçmişten kaldırılır.
- **Şifre sağlığı:** Zayıf, birden fazla kayıtta kullanılan ve 1 yıldan uzun süredir değişmeyen şifreler özetlenir ve filtrelenir.
- **Sistem kilidi:** Windows kilitlenince (Win+L) veya uykuya geçince kasa kilitlenir, panodaki şifre silinir. Pencereyi küçültmek kilitlemez.
- **Otomatik şifreli yedek:** Her kasa değişikliğinden sonra `%APPDATA%\password-generator\yedekler` klasörüne yeni bir `.passgen` dosyası yazılır. Yedekler hiç silinmez. İçe Aktar penceresinde "Yedek Klasörünü Aç" var.

### Güvenlik

- Geçmiş diske düz metin yazılmıyor; Windows hesabına bağlı olarak şifreleniyor (safeStorage).
- Ana şifre bellekte tutulmuyor; kilit açılışında türetilen, dışa aktarılamayan anahtar kullanılıyor.
- Yeni ana şifre en az 12 karakter ve en az "Orta" güçte olmalı. Mevcut ana şifreler etkilenmez.
- Pano temizliği ana süreçte: pencere odakta değilken, uygulama kapanırken ve sistem kilitlenince de çalışıyor.
- Kilit açma deneme sınırı uygulama yeniden başlatılınca sıfırlanmıyor.
- Electron 41 → 45.3.2. `npm audit` 37 açıktan 6 orta seviyeye indi.

### Düzeltmeler

- Klasör birleştirmede kaybolan özellikler geri geldi: ana şifre güç kuralı, güncelleme kontrolü, geçmişte entropi, geri al animasyonu.
- Birden fazla şifre aynı anda kaydedilince yalnızca biri kasada kalıyordu. Kasa yazmaları sıraya alındı.
- Eksik alanlı bir kayıt içe aktarılınca uygulama her açılışta boş ekrana düşüyordu. Dışarıdan gelen kayıtlar artık tamamlanıyor.
- Birleştirmede aynı şifreyi kullanan farklı site kayıtları sessizce atlanıyordu.
- Kasa ~600 kayda ulaşınca kayıtlar başarısız olurdu (base64 dönüşümünde yığın taşması).
- Güncelleme kontrolü var olmayan bir depoya bakıyordu. Artık `hakanstarlord/passgenerator`.
- Sayfa dili `tr`, başlık "Şifre Üretici".

### Paket ve geliştirme

- Exe'ye kullanılmayan `node_modules` girmiyor (`app.asar` 36,1 MB → 2,3 MB).
- `.claude/settings.local.json` git dışında; içindeki eski klasöre bakan exe derleme hook'u silindi.
- 16 test dosyasında 169 birim testi, lint temiz.

### Yükseltme notları

- Mevcut kasa, yedekler ve `.passgen` dosyaları aynen açılır; şifreli veri biçimi değişmedi.
- Eski düz metin geçmiş ilk açılışta şifreli biçime çevrilir.

### Doğrulama

Exe 2026-11-14'te kullanıcı tarafından denendi: geçmiş kapanıp açılınca duruyor, site tarayıcıda açılıyor, Win+L kasayı kilitliyor, kopyalanan şifre başka uygulamadayken 30 sn sonra panodan siliniyor.

### Açık kalanlar

- GitHub Release henüz yayınlanmadı. Etiket `v1.1.0` olmalı; güncelleme kontrolü etiketi `package.json` sürümüyle karşılaştırır.
- `npm audit`'teki 6 orta seviye açık electron-builder'ın macOS/Squirrel derleme bağımlılıklarında; exe'ye girmiyor. Tek önerilen düzeltme eski electron-builder'a düşmek.
- Tailwind 4, ESLint 10 ve Vitest 5 geçişleri yapılmadı.

## 1.0.0 — 2026-03-22

İlk sürüm: güvenli şifre üretimi, AES-GCM ile şifreli kasa, geçmiş, otomatik pano temizliği, otomatik kilit, Electron güvenlik ayarları (CSP, sandbox) ve Windows taşınabilir exe.
