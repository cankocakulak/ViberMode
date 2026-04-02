# Simple Prompt Chain

Bu dosya OpenClaw tarafında workflow'ları sırayla çalıştırmak için en sade prompt zincirini verir.

## Kısa Karar

- **Evet**: kanonik yapı artık anlamlı ve modüler.
- **Hayır, tamamen bitmedi**: OpenClaw runtime projection tarafı hâlâ güncellenmeli.

Bugün için en güvenli kullanım:
- repo veya hedef klasörü önce manuel hazırla
- sonra workflow'lara aynı absolute path'i ver

## 1. Sadece Spec Üretmek

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/product-to-spec/product-to-spec.prose \
idea:"Öğrencinin çalıştığı saatleri günden güne takip edebileceği zincir uygulaması" \
target_repo:"/ABSOLUTE/PATH/TO/PROJECT" \
project_name:"study-chain" \
analysis_artifact:"" \
constraints:"" \
direction:"" \
audience:"öğrenciler" \
product_context:"" \
platform:"mobile" \
branding_context:"" \
personas:"öğrenci"
```

Üretilenler:
- `docs/study-chain/brainstorm.md`
- `docs/study-chain/prd.md`
- `docs/study-chain/ux.md`
- `docs/study-chain/stories.md`

## 2. Bootstrap Çalıştırmak

Bu workflow OpenClaw'a projection edildiğinde sade kullanım şöyle olmalı:

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/bootstrap/bootstrap.prose \
workspace_path:"/ABSOLUTE/PATH/TO/PROJECT" \
repo_mode:"greenfield" \
repo_url:"" \
base_branch:"main" \
working_branch:"feature/study-chain" \
project_name:"study-chain" \
stack:"swiftui-ios" \
platform:"mobile" \
analysis_artifact:"" \
constraints:""
```

Üretilen:
- `docs/study-chain/bootstrap.md`

## 3. Spec To Code Çalıştırmak

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/spec-to-code/spec-to-code.prose \
target_repo:"/ABSOLUTE/PATH/TO/PROJECT" \
project_name:"study-chain" \
analysis_artifact:"" \
branch_prefix:"feature"
```

Üretilenler:
- `docs/study-chain/tasks.json`
- `docs/study-chain/run-state.json`

## 4. Tek Komutta Hepsi

Bu workflow OpenClaw'a projection edildiğinde sade kullanım şöyle olmalı:

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/product-to-code/product-to-code.prose \
idea:"Öğrencinin çalıştığı saatleri günden güne takip edebileceği zincir uygulaması" \
workspace_path:"/ABSOLUTE/PATH/TO/PROJECT" \
repo_mode:"greenfield" \
repo_url:"" \
base_branch:"main" \
working_branch:"feature/study-chain" \
project_name:"study-chain" \
stack:"swiftui-ios" \
platform:"mobile" \
analysis_artifact:"" \
constraints:"" \
direction:"" \
audience:"öğrenciler" \
product_context:"" \
branding_context:"" \
personas:"öğrenci" \
branch_prefix:"feature"
```

## En Sade Operasyon Sırası

### Greenfield

1. Hedef klasörü oluştur.
2. `product-to-spec` çalıştır.
3. `bootstrap` çalıştır.
4. `spec-to-code` çalıştır.

### Brownfield

1. Repo'yu clone et.
2. Aynı local path'i workflow input'u olarak kullan.
3. Gerekirse önce `analyzer` çalıştır.
4. `product-to-spec` çalıştır.
5. `bootstrap` çalıştır.
6. `spec-to-code` çalıştır.

## En Pratik Kural

- Aynı run boyunca **tek bir absolute path** kullan.
- `target_repo` veya `workspace_path` ne verdinse bütün akış onun üstünde kalsın.
- Bugün için repo hazırlığını manuel yapmak daha güvenli.
