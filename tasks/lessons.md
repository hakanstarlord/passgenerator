# Dersler

Kullanıcı düzeltmelerinden çıkan kurallar. Oturum başında gözden geçir.

## 2026-11-14 — Kayıtlı şifreler ve yedekleri asla otomatik silinmez

- **Ne oldu:** Otomatik kasa yedeği planında eski yedekleri budayan bir saklama kuralı önerdim (son 20 sürüm + son 30 günün her günü için 1 dosya, gerisi silinir). Kullanıcı planı reddetti: "kayıtlı şifreler kesinlikle silinmemeli."
- **Neden önemli:** Budanan bir yedekte, kasadan sonradan silinmiş bir şifrenin son kopyası olabilir. Saklama kuralı bu şifreyi kalıcı olarak yok eder.
- **Kural:** Kasadaki şifreleri veya yedek dosyalarını otomatik silen, budayan, döndüren ya da üzerine yazan hiçbir mekanizma önerme veya ekleme. Disk kullanımı gibi bir kaygı varsa tahmini kullanıcıya söyle, temizliği kullanıcıya bırak.
- **Uygulamada:** Yedekler `wx` bayrağıyla her seferinde yeni bir dosyaya yazılır; `electron/` içinde yedekler için `unlink`/`rm` çağrısı yoktur.

## 2026-11-14 — Exe yalnızca bütün işler bittikten sonra derlenir

- **Ne oldu:** Her maddeyi bitirdikten sonra `npm run electron:build` ile exe'yi yeniden derliyordum. Kullanıcı: "exeyi en son bütün işler bittikten sonra derlesek."
- **Kural:** Madde madde ilerlerken exe derleme. Doğrulama için `npm run lint`, `npm test`, `vite build` (scratch klasörüne) ve tarayıcı testi yeterli. Exe'yi yalnızca iş listesinin tamamı bittiğinde veya kullanıcı açıkça istediğinde derle.

## 2026-11-14 — Commit edilen her şey ayrıca sormadan push edilir

- **Ne oldu:** Her commit'ten sonra push için ayrı onay bekliyordum. Kullanıcı: "commit ettiklerini push da edebilirsin, ekstra sormana gerek yok."
- **Kural:** Kullanıcı commit istediğinde commit'ten hemen sonra `git push origin main` da yap ve sonucu (remote ile eşitlik) raporla; push için ayrıca sorma. Commit'in kendisi yine kullanıcı isteyince yapılır. Force push gerekiyorsa veya push reddedilirse dur ve sor.
