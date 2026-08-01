# Workflow: App Autopilot

> Front-door workflow for operating on a known app by name. It resolves the app, chooses the right existing ViberMode workflow, and enforces evidence gates before internal tester release.

## Fast Path

- Use this when the user names an app and asks to improve, fix, prepare, or submit it without providing every repo path and manifest detail.
- Resolve the app through an app registry first, then through local workspace discovery.
- Choose exactly one mode: `change-to-release`, `self-improve`, `growth-experiment`, `submit-only`, or `store-submit`.
- Prefer existing workflows over new behavior:
  - `change-to-release` for requested changes
  - `brainstormer` or `ux-designer` for growth/product experiment ideation when needed
  - `experience-hardening` for user-facing quality loops
  - `ios-submit-testflight` for iOS internal TestFlight
  - `android-submit-play-internal` for Android internal testing
- Do not submit to TestFlight or Google Play internal testing until release gates pass.
- Treat "test'e gonder", "teste gonder", and "internal test'e yolla" as internal tester release intent. If both iOS and Android contexts are resolved or the user says both platforms, run both platform submitters.
- Treat "submit'e gonder" and "store submit" as final store-review/public-surface intent for builds already uploaded to internal testing. Do not confuse it with internal tester upload.
- In `self-improve` and `growth-experiment`, the workflow may release only when the user requested release and the app has real screenshot or video evidence for changed user-facing flows.

## Pipeline

```text
app name + operator intent
  -> app registry resolution
  -> mode selection
  -> request, self-audit, or growth experiment intake
  -> existing implementation workflow when needed
  -> runtime validation
  -> experience hardening for user-facing surfaces
  -> final review
  -> optional platform submitter
```

## Entry Contract

Required:

- `app` - app name, alias, bundle id, package name, or repo path
- `mode` - `change-to-release`, `self-improve`, `growth-experiment`, or `submit-only`

Optional:

- `change_request` - inline notes, screenshots, bug reports, or feedback
- `change_request_path` - file containing notes
- `release_target` - `none`, `ios-testflight`, `android-play-internal`, or `all-internal-test`
- `source_ref` - optional build source such as `main`, `master`, `release/*`, a tag, or a commit SHA
- `platform_policy` - default `release-only`
- `registry_path` - private JSON app registry; default discovery uses `VIBERMODE_APP_REGISTRY`, `docs/operations/app-registry.local.json`, generated run manifests, and generated workspaces
- `max_self_improve_items` - default `3`
- `max_growth_experiments` - default `1` per pass
- `growth_goal` - downloads, activation, retention, monetization, habit, shareability, or custom
- `scope` - screens, flows, platforms, or files to constrain the run
- `submit_when_ready` - boolean; default `false` unless the user explicitly asked to release

## Natural Language Intent

The user does not need to provide machine-shaped fields. Infer `app`, `mode`, `release_target`, and `submit_when_ready` from ordinary language when confidence is high.

Examples that should resolve to `self-improve`:

```text
quiet envelope'e bak, kendin iyilestir
quiet envelope'i bi gez, kotu duran yerleri toparla
quiet envelope icin major sorunlari bulup duzelt
su appe kendin bakip test etmeye deger hale getir
```

Examples that should resolve to `growth-experiment`:

```text
quiet envelope'in intentini anla, daha cok indirme ve user icin ne lazimsa dene
quiet envelope icin kreatif growth session yap, en iyi fikri uygula
bu appi fantazyagormatik modda buyut, onboarding mi feature mi homepage mi karar ver
quiet envelope'de activation/retention artiracak bir experiment sec ve ship et
```

Examples that should resolve to `growth-experiment` with `submit_when_ready=true`:

```text
quiet envelope'e growth pass yap, iyi cikarsa testflight'a al
bu appi buyume gozuyle ele al, deneyi uygula, gate gecerse internal'a yolla
```

Examples that should resolve to `self-improve` with `submit_when_ready=true`:

```text
quiet envelope'i iyilestir, hazirsa testflight'a al
quiet envelope'e bak, ss al, sacma bir sey yoksa testflight'a gonder
bu appi kendin toparla, gate gecerse internal test'e yolla
```

Examples that should resolve to `submit-only`:

```text
quiet envelope'i testflight'a al
quiet envelope release-only
quiet envelope icin sadece test'e gonder
bu app hazirsa google play internal'a yukle
quiet envelope'i ios ve android internal test'e yolla
quiet envelope main branchinden testflight'a al
main'den build al, google play internal'a yukle
```

Examples that should resolve to `store-submit`:

```text
quiet envelope'i submit'e gonder
test'e yukledigim buildleri store submit et
ios ve android'de internal'a gonderdiklerimi submit'e al
gonderilen buildi review'a yolla
```

Examples that should resolve to `change-to-release`:

```text
quiet envelope'de onboarding generic, timer ekrani zayif; bunlari duzelt
quiet envelope icin su notlari uygula, hazirsa testflight'a al
```

Intent rules:

- App aliases are matched case-insensitively and punctuation-insensitively.
- Treat "bak", "gez", "kendin bak", "iyilestir", "toparla", "major sorunlari bul", "self improve", and "test etmeye deger hale getir" as `self-improve` signals unless explicit change notes dominate.
- Treat "intentini anla", "growth", "buyume", "daha cok indirme", "daha cok user", "activation", "retention", "kreatif session", "experiment", "deneme", "fantazyagormatik", and "ne gerekiyorsa karar ver" as `growth-experiment` signals.
- Treat "TestFlight'a al", "test'e gonder", "teste gonder", "internal test'e yolla", "Google Play internal'a yukle", "hazirsa internal'a yolla", and "release'e al" as internal tester release intent.
- Treat "sadece test", "release-only", "kod degistirme", and "yalniz yukle" as `submit-only` when the destination is TestFlight or Play internal testing.
- Treat "main branchinden build", "main'den build al", "main build'i test'e gonder", and "main'den TestFlight/Google Play internal" as `submit-only` with `source_ref=main` unless channel/repo policy names another release source.
- Treat "submit'e gonder", "submit et", "store submit", "review'a gonder", and "gonderdiklerimi submit'le" as `store-submit` when the context says a build is already uploaded to internal testing or the user explicitly asks for store review/final submit.
- If the user says only "submit" and the context does not distinguish internal tester upload from final store review submission, ask one concrete question.
- If the user says not to upload, keep `release_target=none` and `submit_when_ready=false`.
- If `growth-experiment` and `self-improve` both match, choose `growth-experiment` when the user mentions growth, downloads, users, activation, retention, creative product direction, or deciding what to build.
- If both change notes and self-improve language exist, use `change-to-release` for the notes and add a bounded self-audit only when the user explicitly asks the agent to look for more issues.
- Ask for clarification only when app resolution is ambiguous or release intent would mutate an external provider without a clear request.

## App Resolution

Portability rule:

- This workflow is public and must not assume a specific username, home directory, private workspace, or generated-products root.
- Use `npm run app:resolve` before asking the user for a repo path.
- Honor explicit `registry_path`, `VIBERMODE_APP_REGISTRY`, `VIBERMODE_WORKSPACE_ROOT`, `APP_FACTORY_STATE_ROOT`, and `VIBERMODE_GENERATED_PRODUCTS_ROOT` values when present.
- Treat `~/ViberModeWorkspaces` and docs paths containing a concrete username as local examples only.

Resolve in this order:

1. `registry_path` entry matching `app` by alias, display name, bundle id, package name, or repo path.
2. Existing workflow artifacts under a known repo, such as `docs/[project-name]/change-release-status.json`.
3. App factory run manifests under the configured private state root.
4. Generated product workspaces when the local environment has a known generated-products root.
5. Ask for the missing repo or manifest only if no safe local match exists.

Resolved context should include:

```json
{
  "app": "StudyBud",
  "aliases": ["studybud"],
  "platform": "ios",
  "target_repo": "/absolute/path/to/app/repo",
  "project_name": "studybud",
  "artifact_root": "/absolute/path/to/app/repo/docs/studybud",
  "change_request_path": "/absolute/path/to/app/repo/docs/studybud/change-request.md",
  "run_manifest_path": "/absolute/path/to/factory/runs/run-id.json",
  "bundle_id": "com.example.studybud",
  "package_name": null,
  "default_release_target": "ios-testflight",
  "release_context": {
    "app_store_connect": {
      "app_id": "1234567890",
      "bundle_id": "com.example.studybud",
      "run_manifest_path": "/absolute/path/to/factory/runs/run-id.json",
      "internal_test_command": "node scripts/ios-submit-testflight.mjs --run-manifest RUN_MANIFEST --submit --commit-state",
      "final_submit_supported": false,
      "manual_console_url": "https://appstoreconnect.apple.com/apps/1234567890/appstore"
    }
  },
  "forbid_dirty": []
}
```

Do not store secrets in the registry. Use it only for paths, app identity, release target defaults, safe scope metadata, and non-secret store routing hints.

Resolver helper:

```bash
npm run app:resolve -- --app StudyBud
```

The resolver reads `VIBERMODE_APP_REGISTRY`, `docs/operations/app-registry.local.json`, `VIBERMODE_WORKSPACE_ROOT`, `APP_FACTORY_STATE_ROOT`, `VIBERMODE_GENERATED_PRODUCTS_ROOT`, generated product workspaces, and app factory run manifests when available. It returns the resolved context object that this workflow should use.

When submission is requested and `run_manifest_path` cannot be resolved, check `release_context.*.run_manifest_path` for the requested platform. If neither path is available, block with an exact missing-manifest message unless the delegated platform submitter has another explicit supported preflight path.

## Mode Selection

### `change-to-release`

Use when the user gives explicit notes, bugs, screenshots, polish requests, or release-facing changes.

```text
resolved app
  -> change_request
  -> change-to-release
  -> optional platform submitter
```

Rules:

- If multiple notes are present, start with `change-triager`.
- Implement only the recommended batch from `change-brief.md`.
- Use `release_target=none` unless the user explicitly requested internal release or the app automation policy allows `submit_when_ready`.
- For release-bound user-facing work, require `experience-hardening` approval before platform submitter.

### `self-improve`

Use when the user wants the agent to inspect the app, find high-impact improvements, and apply a bounded batch.

```text
resolved app
  -> repo/app understanding
  -> runtime launch and flow exploration
  -> screenshot/video evidence
  -> self-audit change request
  -> change-to-release
  -> optional platform submitter
```

The self-audit must inspect real app behavior, not only source code. For UI apps, it should attempt to reach:

- onboarding or first-run flow
- first-value path
- primary/core loop
- paywall or upgrade shell when present
- empty, loading, error, disabled, retry, and small-screen states when reachable
- keyboard and focus behavior for text-entry surfaces

The self-audit writes or updates:

```text
docs/[project-name]/self-improve-audit.md
docs/[project-name]/change-request.md
```

Each finding must include:

- evidence path, screenshot path, video path, command output, or manual blocker
- user impact
- risk
- confidence
- suggested task resolution mode
- decision: `implement_now`, `needs_user_decision`, `hold`, or `out_of_scope`

Batch rule:

- Select at most `max_self_improve_items` for `implement_now`.
- Prefer obvious high-impact issues over speculative redesign.
- Do not invent a new product direction unless the user asked for product strategy.
- If the app cannot be launched or the target surfaces cannot be reached, stop with `INCOMPLETE_UNREACHED_SURFACE` unless the blocker can be routed into setup tasks.

Release rule:

- `self-improve` may proceed to TestFlight or Google Play internal testing only when all are true:
  - user explicitly asked to submit when ready
  - runtime validation passed after implementation
  - changed visual surfaces have screenshot or video evidence
  - `experience-review.md` is `APPROVED` or `SKIPPED_NOT_APPLICABLE`
  - final `review.md` is approved
  - platform submitter preflight passes

### `growth-experiment`

Use when the user wants the agent to understand the app's product intent, run a creative growth session, choose a bounded experiment, implement it, and leave the app ready for another pass.

```text
resolved app
  -> app intent and current surface analysis
  -> growth brainstorm
  -> select one experiment
  -> write experiment-backed change request
  -> change-to-release
  -> runtime validation
  -> experience hardening
  -> optional platform submitter
```

Purpose:

- improve downloads, activation, retention, habit formation, shareability, conversion, or monetization
- decide whether the best move is onboarding interactivity, a new feature, a home screen redesign, core-loop clarity, paywall framing, empty-state motivation, or store-facing polish
- run one focused product bet per pass instead of making an unfocused bundle of ideas

Inputs:

- resolved app context
- optional `growth_goal`
- optional existing analytics, store listing, reviews, user notes, screenshots, or previous experiment logs

Outputs:

```text
docs/[project-name]/growth-session.md
docs/[project-name]/growth-experiments.json
docs/[project-name]/change-request.md
```

Growth session requirements:

- state the app intent in one paragraph
- identify the likely audience and first-value promise
- inspect current app surfaces and any available store-facing metadata
- generate 5-8 buildable growth ideas across activation, retention, conversion, and differentiation
- select exactly one recommended experiment for the current pass
- define the hypothesis, target user behavior, expected impact, effort, risk, and validation evidence
- mark rejected ideas as hold/future, not lost

Implementation rule:

- Convert only the selected experiment into `change-request.md`.
- Delegate implementation through `change-to-release`.
- Keep the experiment small enough for one release pass unless the user explicitly asks for a larger product slice.
- Do not invent analytics, subscriptions, backend services, or external integrations unless the app already has the infrastructure or the user explicitly asks for that build.
- If the selected experiment needs store metadata or screenshots rather than app code, route the implementation through `mobile-storefront` where applicable and keep app code unchanged.

Loop rule:

- Each pass appends a result entry to `growth-experiments.json`.
- A later growth pass must read the previous experiment log before choosing the next experiment.
- Do not repeat the same bet unless the previous pass was blocked before users could test it.
- If no metrics exist, record evidence as heuristic/runtime review and mark measured impact as `not_measured`.

Release rule:

- `growth-experiment` may submit to TestFlight or Google Play internal testing only under the same release rule as `self-improve`.
- If the experiment is store-metadata-only, do not submit a new binary unless app code or build metadata changed.

### `submit-only`

Use when the user says release-only, submit-only, TestFlight this app, upload to Google Play internal testing, or similar.

```text
resolved app
  -> status and manifest discovery
  -> hard gate
  -> platform preflight
  -> platform submitter
```

Rules:

- Do not edit product code.
- Do not generate new implementation tasks.
- Do not relax quality gates because the user asked for a release.
- If `source_ref` is provided, build only from a clean checkout of that source. Record the exact commit SHA in the status/report before upload.
- Allowed release sources are `main`, `master`, configured `release/*` branches, tags, or explicit commit SHAs. If the request implies a random feature branch or dirty worktree build, ask for owner confirmation or block according to repo policy.
- If gate evidence is missing, stop with exact blockers and suggest `self-improve` or `change-to-release`.
- Use `ios-submit-testflight` for `ios-testflight`.
- Use `android-submit-play-internal` for `android-play-internal`.
- Use both submitters for `all-internal-test`. Run platform preflights first, then run each platform live upload whose preflight passes. Report partial success and exact per-platform blockers.
- Owner phrases such as "test'e gonder", "teste gonder", "internal test'e yolla", and "ikisini de teste gonder" authorize internal TestFlight/Play internal upload after gates pass; do not ask for another approval.

Internal tester commands:

```bash
# iOS internal TestFlight
node scripts/ios-submit-testflight.mjs \
  --run-manifest /path/to/factory/runs/ios-run.json \
  --submit \
  --commit-state

# Android Google Play internal
node scripts/android-submit-play-internal.mjs \
  --run-manifest /path/to/factory/runs/android-run.json \
  --build \
  --submit \
  --confirm-play-console-bootstrap \
  --commit-state
```

### `store-submit`

Use when the owner says submit'e gonder, store submit, review'a gonder, or asks to submit builds that were already uploaded to internal testing.

```text
resolved app/builds
  -> read latest internal upload/submission state
  -> verify final store-review adapter exists for the platform
  -> verify required legal/privacy/store declarations are already complete or explicitly confirmed
  -> execute supported final submit adapter, or block with exact unsupported/missing-declaration reason
```

Rules:

- Do not rerun internal upload just because the user said submit. If the build is not uploaded yet, ask whether they mean "test'e gonder" first.
- Use `release_context` only to locate the uploaded build/provider context and console page; it is not proof that final submit is supported.
- If the owner says "gonderilen buildi submit'e gonder", use the latest uploaded build recorded in the run manifest/provider state; do not build a new artifact.
- Do not invent final submission support. Current Stage 4 adapters cover internal TestFlight and Google Play internal testing. If no final App Store Review / Play review submit adapter exists, return `UNSUPPORTED_FINAL_SUBMIT_ADAPTER` and list the missing adapter or manual owner step.
- Final store review, public release, production track, external TestFlight review, data safety, age rating, ads, paid app setup, and privacy declarations remain truth-sensitive. Execute only when the owner command is explicit and the required declarations are already complete or confirmed.

## Evidence Requirements

For any user-facing release-bound mode:

- launch/build commands must be recorded in `validation-report.md`
- changed visual surfaces must be reached in screenshot, video, simulator, browser, or equivalent manual evidence
- launch-only screenshots are insufficient when changed surfaces sit behind onboarding, auth, tabs, modals, or in-app routes
- `experience-review.md` must explicitly list reviewed evidence and verdict
- `review.md` must approve the code and release readiness

## Status Artifact

The front door may write:

```text
docs/[project-name]/app-autopilot-status.json
```

Minimum shape:

```json
{
  "workflow": "app-autopilot",
  "app": "StudyBud",
  "mode": "self-improve",
  "targetRepo": "/absolute/path/to/app/repo",
  "projectName": "studybud",
  "releaseTarget": "ios-testflight",
  "submitWhenReady": true,
  "status": "RUNNING",
  "currentStage": "self-audit",
  "delegatedWorkflow": "change-to-release",
  "blockers": [],
  "nextAction": "Run self-audit"
}
```

Allowed statuses:

- `RUNNING`
- `COMPLETE_NO_RELEASE`
- `COMPLETE_RELEASE_READY`
- `COMPLETE_SUBMITTED`
- `INCOMPLETE_UNREACHED_SURFACE`
- `INCOMPLETE_VALIDATION_FAILED`
- `INCOMPLETE_EXPERIENCE_CHANGES_REQUESTED`
- `INCOMPLETE_RELEASE_BLOCKED`
- `INCOMPLETE_APP_RESOLUTION`
- `BLOCKED`

## Completion Rules

- `COMPLETE_NO_RELEASE` when implementation/review passes and no release was requested.
- `COMPLETE_RELEASE_READY` when all gates pass but submit was not requested.
- `COMPLETE_SUBMITTED` when the platform submitter succeeds.
- `INCOMPLETE_RELEASE_BLOCKED` when quality gates, credentials, signing, Play bootstrap, or provider state block submission.
- `INCOMPLETE_UNREACHED_SURFACE` when the app or changed surfaces cannot be reached for evidence.
- `BLOCKED` when the app cannot be resolved or the requested work is too vague to scope safely.

## Design Intent

`app-autopilot` is the natural-language operating layer above the existing ViberMode workflows. It lets a user say "improve StudyBud" or "send this app to TestFlight" while preserving the stricter implementation, experience, review, and release gates already defined by the lower-level workflows.
