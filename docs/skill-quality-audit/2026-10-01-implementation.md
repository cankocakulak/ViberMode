# Skill kalite ve maliyet iyileştirmeleri

1 Ekim 2026. Önceki incelemede bulunan sorunlar için uygulanan değişiklikler:

- `cost-reviewer`: bağımsız maliyet incelemesi; query scope/limit, gerekli kolonlar, veri transferi, tekrarlı okumalar, job/worker/retry çarpanları ve resource yaşam süresi. Codex, Cursor ve genel agent yüzeylerinde kayıtlı.
- Ortak `cost-safety.md`: planner, task planner, bootstrap, implementation-runner ve reviewer yalnızca ilgili iş yükü değiştiğinde okur. Var olan provider/ORM/branch ve kullanıcı yetkisi korunur; kesin fiyat/tasarruf uydurulmaz.
- `repo-change`: küçük, anlaşılmış, düşük riskli işler doğrudan uygulama ve hedefli kontrolle ilerler. Yapılandırılmış akış riskli, bağımlı veya devam ettirilebilir işler için kullanılır. Dosya sayısı tek başına task bölmez; yetkili implementation loop aynı oturumda ardışık görevleri tamamlar.
- Release kontrolü: açık doğrulama/review verdict'leri, gerekli stage'ler ve boş blockers zorunlu. Gerçek komutları çalıştıran runner çıkış kodlarını scope ve kaynak fingerprint'i ile bağlar. Kaynak değişmişse eski doğrulama ve review onayları release açamaz. Kullanıcıya görünen değişikliklerde experience skip kabul edilmez.
- Codex/Claude kurulumları: source commit ve content hash manifesti, salt okunur drift kontrolü, önce staging ve normal yayınlama hatasında rollback. Kişisel başka skill'ler korunur. Ani süreç sonlanması için lock/backup kurtarma gerekebilir; global atomik değişim garantisi verilmez.
- `evaluations/skill-quality/`: 10 offline davranış senaryosu ve model/sürüm/skill commit'iyle karşılaştırma yöntemi. Bu set, ölçülmüş model A/B sonucu değildir.

## Doğrulama

Release açığı önce testte yeniden üretildi: FAIL raporuna rağmen eski kontrol exit 0 verdi. Yeni regresyonlar eksik/başarısız doğrulama, yanlış scope/hedef, komut planı farkı, değişmiş kaynak, eski review, hatalı verdict ve uygunsuz experience skip'i bloke ediyor. Kurulum testleri drift, idempotency, eksik dosya, yeni/emekli skill, staging/yayınlama hatası ve rollback'i doğruluyor.

213 Node testi geçti; skill metadata kontrolü ve reference/task phase kontrolleri geçti (81 capability, 10 task dosyası; mevcut legacy uyarıları sürüyor). Gerçek Codex ve Claude adapter kurulumları izole dizinlerde install/check ile doğrulandı. Kişisel Codex snapshot’ı commit sonrasında yenilenir; kurulum manifesti teslim edilen kaynak commit’ini kaydeder.

Bu değişiklikler koruma ve doğrulama davranışını iyileştirir. Üretim faturası düşüşü veya farklı modellerde kalite artışı henüz ölçülmedi. Release fingerprint'i git-visible kaynakları kapsar; ignored ortam ayarları, dış servisler ve gerçek runtime davranışı ayrıca kanıt gerektirir. Uygulama kodu artifact dizininde tutulmamalıdır.
