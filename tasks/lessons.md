# Dersler

Kullanıcı düzeltmelerinden çıkan kurallar. Oturum başında gözden geçir.

## 2026-11-14 — Kayıtlı şifreler ve yedekleri asla otomatik silinmez

- **Ne oldu:** Otomatik kasa yedeği planında eski yedekleri budayan bir saklama kuralı önerdim (son 20 sürüm + son 30 günün her günü için 1 dosya, gerisi silinir). Kullanıcı planı reddetti: "kayıtlı şifreler kesinlikle silinmemeli."
- **Neden önemli:** Budanan bir yedekte, kasadan sonradan silinmiş bir şifrenin son kopyası olabilir. Saklama kuralı bu şifreyi kalıcı olarak yok eder.
- **Kural:** Kasadaki şifreleri veya yedek dosyalarını otomatik silen, budayan, döndüren ya da üzerine yazan hiçbir mekanizma önerme veya ekleme. Disk kullanımı gibi bir kaygı varsa tahmini kullanıcıya söyle, temizliği kullanıcıya bırak.
- **Uygulamada:** Yedekler `wx` bayrağıyla her seferinde yeni bir dosyaya yazılır; `electron/` içinde yedekler için `unlink`/`rm` çağrısı yoktur.
