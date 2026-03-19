# OpenClaw Adimlama Plani

## Amaç

- OpenClaw tarafinda nasil bir kurulum sirasi izlenmesi gerektigini netlestirmek
- `product-to-spec` ve `spec-to-code` taraflarini ayni anda degil, dogru sirayla ele almak
- OpenClaw'i bir "tek super agent" gibi degil, asamali bir orchestration kati olarak konumlamak

## Temel Yaklasim

- OpenClaw'i bastan tum sistemi kuran tek agent gibi kullanma
- Once `product-to-spec` tarafini stabilize et
- Sonra `spec-to-code` icin ACP tabanli worker zincirine gec
- Sorumluluklari ayir:
  - `skills/agents` = uzman roller
  - `OpenProse` = yurutulebilir workflow
  - `ACP workers` = gercek coding/build/review iscileri

## Neden Bu Sirayla Gitmek Gerekiyor

- En buyuk risk tek prompta veya native subagent'lara fazla yuk binmesi
- `product-to-spec` daha cok orchestration problemi
- `spec-to-code` daha cok stateful coding/runtime problemi
- Bu ikisini ayni anda cozmeye calismak gereksiz karmasiklik yaratir

## Adim 1: Workspace Bootstrap

- OpenClaw'in calisacagi repo/workspace icinde sabit bootstrap dosyalarini netlestir
- En az su alanlar net olsun:
  - `AGENTS.md`
  - ViberMode role dosyalari
  - artifact path convention
  - `tasks.json` ve `run-state.json` semasi
- Amaç:
  - child worker hangi dosyayi okuyacagini tartismasin
  - path ve artifact kurallari deterministic olsun

## Adim 2: Ilk OpenClaw Skill Set

- Once butun ViberMode rollerini degil, cekirdek olanlari OpenClaw skill olarak tanimla
- Ilk skill set sunlar olsun:
  - `brainstormer`
  - `prd-writer`
  - `ux-designer`
  - `story-writer`
  - `task-planner`
  - `spec-orchestrator`
- Bu skill'ler dogrudan ViberMode artifact contract'ina yazsin
- Amaç:
  - `product-to-spec` tarafinda delegated context sorununu azaltmak

## Adim 3: Ilk `.prose` Dosyasi

- Ilk gercek `.prose` dosyan `product-to-spec.prose` olsun
- Akis soyle olsun:
  1. raw idea al
  2. brainstorm skill cagir
  3. `brainstorm.md` yaz
  4. prd skill cagir
  5. `prd.md` yaz
  6. ux skill cagir
  7. `ux.md` yaz
  8. stories skill cagir
  9. `stories.md` yaz
  10. task-planner skill cagir
  11. `tasks.json` uret
- Orchestrator bu asamada icerik uretmesin, sadece yonetsin
- Ilk basari kriteri:
  - ayni fikirden bu akisi 2-3 kez tutarli artifact'lerle alabiliyor olmak

## Adim 4: `spec-to-code` Icin Skill Degil Worker Graph Tasarla

- Burada direkt `.prose` ile baslama
- Once worker graph'i duz kur
- Ilk worker graph su olsun:
  - `task-orchestrator`
  - `codex-implementer` via ACP
  - `build-tester`
  - `reviewer`
  - gerekirse `fixer`
- Amaç:
  - coding loop'u prompt seviyesinde degil, isci zinciri seviyesinde kurmak

## Adim 5: ACP'yi Burada Devreye Al

- ACP'yi sadece coding tarafinda devreye sok
- Ilk ACP worker:
  - `codex-implementer`
- Ikinci ACP veya local worker:
  - `build-test`
- Ucuncu worker:
  - `review`
- Amaç:
  - OpenClaw orchestration gucu ile Codex coding gucunu ayirmak

## Adim 6: `run-state.json` Genislet

- Sadece completed task listesi tutma
- Step-level state ekle:
  - current task
  - current stage
  - last implement result
  - last build result
  - last review result
  - retry count
  - files changed
  - notes
- Bu olmadan `20-30` task loop kirilgan olur

## Adim 7: `spec-to-code` Icın V1 Supervisor Prompt

- Ilk surumde orchestrator'a su disiplini ver:
  - tek task sec
  - implement et
  - test et
  - review et
  - gerekiyorsa duzelt
  - done isaretle
  - otomatik siradaki task'a gec
  - yalnizca hard blocker varsa dur
- Ilk hedef:
  - "30 task tek shot" degil
  - "5 task sorunsuz loop" olmali

## Adim 8: `spec-to-code.prose` Daha Sonra

- Build/test/review zinciri stabil olduktan sonra bunu `.prose` seviyesine cikar
- Yoksa workflow dili kurulur ama alttaki worker davranisi kararsiz kalir

## Adim 9: Automation ve Cron En Son

- `cron` ancak su uc sey stabil olduktan sonra eklenmeli:
  - artifact uretimi
  - task loop
  - retry/failure state
- Ondan sonra su senaryolar mantikli olur:
  - nightly continuation
  - failed task retry
  - nightly build validation
  - pending review sweep

## Onerilen `spec-to-code` Worker Akisi

1. orchestrator `tasks.json` okur
2. uygun task secer
3. ACP ile Codex worker'a tek task yollar
4. worker kodu yazar
5. build/test worker `compile/lint/test` kosturur
6. reviewer diff ve artifact uyumuna bakar
7. basarisizsa fixer veya implementer'a geri donulur
8. basariliysa `run-state.json` guncellenir
9. siradaki task'a gecilir

## OpenClaw Tarafinda Eklenmesi Gerekenler

- `skills/` altinda ViberMode specialist skill'leri
- `product-to-spec.prose`
- `task-orchestrator` tanimi
- ACP worker config'leri
- genis `run-state.json` semasi
- build/review result artifact formatlari

## Ilk Etapta Eklememen Gerekenler

- her rol icin ayri onlarca agent
- tam paralel task execution
- tek seferde tam otonom `30-task` loop
- `cron` tabanli otomasyon

## Implementation Hints

- `product-to-spec` ile `spec-to-code` ayni runtime modelinde baslamasin
- `product-to-spec` icin OpenProse daha erken deger uretir
- `spec-to-code` icin once ACP-Codex worker'i stabilize et
- Native subagent'i coding icin degil, specialist reasoning icin kullan
- Orchestrator'in icerik uretmesini degil, karar vermesini iste
- Her worker tek sorumluluk tasisin

## Verification

- Ayni repo uzerinde demo bir feature sec
- `product-to-spec` akisni `.prose` ile kostur
- Cikan `tasks.json` icinden ilk `3-5` task icin ACP-Codex loop calistir
- Her task sonunda build/test/review sonucunu state'e yaz

## Expected

- artifact'ler deterministik uretilir
- orchestrator siradaki task'i dogru secer
- Codex worker repo icinde task'i uygular
- build/test/review asamalari stateful ilerler
- yalnizca blocker oldugunda insan mudahalesi gerekir

## Watch Out

- child worker context kaybi
- branch ve `cwd` karisikligi
- `run-state.json` zayif tasarlanirsa loop'un bozulmasi
- orchestrator'in fazla akilli olup worker isini yapmaya baslamasi

## Tek Cumlelik Oneri

- Once `product-to-spec.prose` ve temel OpenClaw skill set'ini kur
- Sonra `spec-to-code` icin `task-orchestrator + ACP Codex implementer + build/review workers` zincirini devreye al
- Bu sirayla gidersen en az surtunmeyle gercek bir workflow platformuna donusursun
