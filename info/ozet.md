# Mimari Ozet

## Amac

- Hedef sadece kod yazdirmak degil; fikirden baslayip `brainstorm -> PRD -> UX -> stories -> tasks -> code -> compile/test -> review -> next task` seklinde tek akis kurmak.
- Uzun vadede bu akisin duzenli test edilebilir, degistirilebilir ve mumkunse `cron` benzeri otomasyonlarla tekrar calistirilabilir hale gelmesi isteniyor.
- Ideal durumda insan mudahalesi sadece blocker, approval veya ciddi sapma durumlarinda olsun.

## ViberMode Tarafi

- ViberMode'un guclu tarafi artifact-temelli pipeline olmasi.
- Ana pattern: `analysis.md`, `brainstorm.md`, `prd.md`, `ux.md`, `stories.md`, `tasks.json`, `run-state.json`.
- `implementation-runner` mantigi zaten "bir task al, uygula, test et, state guncelle" dongusune cok yakin.
- Bu nedenle ViberMode iyi bir `contract layer` gibi davraniyor.
- Zayif tarafi, su an daha cok framework/prompt-contract repo olmasi; tam runtime/workflow engine degil.

## OpenClaw Hakkinda Cikardigimiz Sonuclar

- OpenClaw basit bir agent degil; channel gateway, tools, mobile node, web UI, subagent, skill ve automation katmanlari olan bir platform.
- Asil gucu `workflow runtime / orchestration shell` olmaya daha yakin.
- Sadece tek repo uzerinde task sirali kodlatmak icin sart degil.
- Ama multi-worker, background run, session yonetimi, ileride `cron` ve farkli worker tipleri istiyorsan anlamli hale geliyor.

## OpenClaw'in Guclu Oldugu Alanlar

- Birden fazla agent/worker'i yonetebilme
- Session ve background execution mantigi
- Workflow'u platform seviyesinde kurgulama
- Ileride automation/cron ile baglama ihtimali
- Farkli worker sistemlerini tek cati altinda kosturabilme

## OpenClaw'in Sinirlari

- "Tek prompt ver, 30 taski kusursuz bitirsin" seviyesi native degil.
- Native subagent modeli coding loop icin tek basina yeterince guvenilir degil.
- Subagent context'i dar; child agent'a tum ViberMode rol dosyalari otomatik tasinmiyor.
- Orchestration mantigini acik kurmak gerekiyor; sistem bunu sihirli bicimde kendisi cozmuyor.

## Subagent Konusunda Net Sonuc

- `sessions_spawn` gibi yapi taslari var ama bunlar workflow engine degil, primitive.
- Subagent spawn non-blocking; orchestrator'in bekleme, takip ve toparlama mantigini ayrica kurmasi gerekiyor.
- Yani "specialist child spawn et, ben arkada kendi kendine cozulsun" her zaman yeterli degil.
- Native subagent'lar arastirma, ozet ve kucuk uzmanlasmis adimlar icin mantikli.
- Uzun, stateful, `compile-test-review-fix` dongusunde daha saglam bir worker modeli gerekiyor.

## OpenProse Nedir ve Neden Onemli

- Normal markdown workflow dosyasi bir `instruction doc`.
- OpenProse ise `instruction + execution model`.
- Explicit control flow veriyor.
- Repeatable workflow mantigina daha uygun.
- State ve run mantigini dosya tabanli yonetebiliyor.
- Bu yuzden `product-to-spec` gibi akislarda sirf prompta guvenmekten daha saglam.

## ACP Nedir

- ACP, OpenClaw icinden dis coding harness'leri kosturma katmani.
- Yani Codex, Claude Code, Gemini CLI gibi seyleri OpenClaw worker'i gibi kullanabiliyorsun.
- Buyuk avantaji: persistent session, resume, `cwd`, dis runtime kullanimi.
- Kod yazma kalitesi acisindan asil isi yapan hala Codex/Claude gibi worker oluyor.
- OpenClaw burada `orchestrator/shell` oluyor.

## ACP ile Codex App Iliskisi

- ACP uzerinden Codex kullanmak mumkun ve mantikli.
- Ama bu, dogrudan Codex app deneyimiyle birebir ayni degil.
- Codex app'in kendi worktree/background/agent deneyimi daha entegre ve olgun.
- ACP daha cok bridge/orchestration katmani gibi.
- Kod kalitesi yakin olabilir, ama toplam UX birebir ayni olmaz.

## Codex Tek Basina Ne Kadar Yeterli

- Eger hedef sadece tek repo uzerinde `tasks.json` okuyup sirayla task implement etmekse, dogrudan Codex daha sade yol.
- `20` ya da `30` task icin bile temel model hala calisir.
- Ama bunu "tek dev prompt" degil, stateful loop olarak dusunmek lazim.
- Yani `tasks.json + run-state.json + implementation supervisor` mantigiyla Codex cok is gorur.
- Sadece coding loop icin OpenClaw eklemek bazen gereksiz karmasiklik olur.

## Ne Zaman OpenClaw Gercekten Mantikli

- Coding disinda ara worker'lar istiyorsan
- `implement -> compile/test -> review -> fix -> next` gibi multi-step pipeline kuracaksan
- Birden fazla worker tipi kullanacaksan
- Workflow'u degistirip tekrar tekrar denemek istiyorsan
- Ileride `cron`, automation, scheduled retries, background continuation istiyorsan

## Ralph Loop Benzeri Akis Hakkinda Sonuc

- OpenClaw'da bunun adiyla built-in bir ozellik yok.
- Ama ViberMode'daki `implementation-runner` mantigi zaten Ralph-loop benzeri bir model.
- Bu loop OpenClaw uzerinde kurulabilir.
- Ama native hazir ozellik degil; sen orchestrator ile kuruyorsun.
- En mantikli hali `task pick -> implement -> validate -> mark done -> next task`.

## En Onemli Mimari Karar

- `product-to-spec` ile `spec-to-code` ayni problem degil.
- `product-to-spec` daha cok orchestration ve specialist agent problemi.
- `spec-to-code` daha cok stateful coding/runtime problemi.
- O yuzden bunlari ayni aracla cozmeye calismak yerine bolmek daha mantikli.

## Onerdigimiz Hibrit Mimari

### Part 1: OpenClaw

- `idea -> brainstorm -> prd -> ux -> stories -> tasks.json`

### Part 2: Codex App veya ACP-Codex

- `tasks.json -> implement -> compile/test -> review -> next`

- Artifact'ler source of truth olarak repo icinde kalsin.
- `run-state.json` ilerleme bellegi olsun.

## En Pragmatik Ilk Surum

- OpenClaw sadece `product-to-spec` ve `task-planner` tarafini yapsin.
- Ciktilar repo icine commitlensin.
- Codex app ayni repo/branch ustunde implementation loop'u yurutusun.
- Ilk surumde tek implementation supervisor thread yeterli.
- Review step'i her task sonrasi degil, ilk asamada her `3-5` task sonrasi da olabilir.

## Daha Ileri Seviye Hedef Mimari

- OpenClaw orchestrator task secsin.
- ACP/Codex implementer worker kodu yazsin.
- Ayrı build/test worker `compile/lint/test` kostursun.
- Ayrı reviewer worker diff'i ve artifact uyumunu denetlesin.
- Failure varsa fixer worker geri donsun.
- Sonra state guncellenip siradaki taska gecilsin.

## Bu Worker Graph'in Step'leri

1. `pick-task`
2. `implement`
3. `compile-and-test`
4. `review`
5. `fix-if-needed`
6. `mark-done`
7. `next-task`

## State Yonetimi Icin Ana Fikir

- `tasks.json` gorev tanimi ve dependency kaynagi olsun.
- `run-state.json` execution history ve current progress tutsun.
- Gerekirse build/review loglari da artifact olarak kaydedilsin.
- Boylece tek prompt bellegine bagimli kalinmaz.
- Bu yaklasim hem Codex hem OpenClaw tarafinda daha guvenilir.

## Neden Tek Prompt Yerine Stateful Loop

- Uzun run'larda context drift olur.
- Hata oldugunda nereye kadar gelindigi kaybolabilir.
- Retry logic zorlasir.
- Parallel veya staged workers yonetilemez.
- Test edilebilirlik duser.

## OpenProse'un Uzun Vadeli Rolu

- Workflow degisikliklerini prompttan cikarip surulebilir bir yapiya alma imkani verir.
- "Bu step paralel mi, sequential mi, failure'da ne olur, hangi artifact sonrakine input olur" gibi seyleri daha acik yonetirsin.
- Bu yuzden uzun vadede workflow experimentation icin guclu aday.
- Ozellikle `product-to-spec` icin cok uygun gorunuyor.
- `spec-to-code` icin de kullanilabilir ama coding runtime tarafi ACP/Codex ile desteklenmeli.

## Codex App'in Uzun Vadeli Rolu

- Gercek coding worker olarak cok mantikli.
- Repo uzerinde `compile/test/fix` dongusunu yurutmek icin guclu.
- Ozellikle tek repo ve sequential implementation loop'ta sade cozum.
- OpenClaw yerine tamamen Codex ile de baslanabilir.
- Sonradan orchestration ihtiyaci buyuyunce OpenClaw eklenebilir.

## Gercekci Yol Haritasi

- `V1`: ViberMode + Codex ile stabil `spec-to-code`
- `V2`: OpenClaw ile `product-to-spec`
- `V3`: OpenClaw orchestrator + ACP-Codex worker
- `V4`: build/review worker'lari ekleme
- `V5`: `cron/automation/retry` mantigi ekleme

## Bugune Kadarki En Net Sonuc

- Sadece coding loop icin en sade arac Codex.
- Workflow platformu kurmak icin OpenClaw mantikli.
- Hayal edilen sey bir "workflow platformu" oldugu icin uzun vadede OpenClaw dogru eksende.
- Ama ilk gunden her seyi OpenClaw'a yikmak gerekmiyor.
- Hibrit model en gercekci baslangic.

## Pratik Tasarim Karari Olarak

- Kisa vadede: OpenClaw for spec, Codex for code
- Orta vadede: OpenClaw orchestrates, Codex implements
- Uzun vadede: OpenClaw + OpenProse + ACP + cron + review/build workers

## Ozet Cumlesi

- ViberMode = contract layer
- Codex = best immediate coding worker
- OpenClaw = best long-term orchestration shell
- OpenProse = executable workflow layer
- ACP = OpenClaw icinden guclu external coding worker kullanma yolu
