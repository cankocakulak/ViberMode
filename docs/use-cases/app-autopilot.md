# Use Case: App Autopilot

## Outcome

Operate on a known app by name or alias, then improve, change, prepare, or submit it through the existing ViberMode gates.

## When To Use

Use this when the user says things like:

- "Improve StudyBud and get it ready."
- "StudyBud'u self-improve calistir."
- "Plant Routine'u TestFlight'a al."
- "This app is ready; release-only run it."
- "Quiet Envelope'e bak, kendin toparla, hazirsa TestFlight'a al."
- "Quiet Envelope icin sadece submit dene."
- "Quiet Envelope'in intentini anla, daha cok indirme/user icin kreatif bir experiment sec ve uygula."
- "Quiet Envelope'i fantazyagormatik modda buyut, hazirsa TestFlight'a al."

Do not use this for a raw product idea with no repo. Use `product-to-code` or the app factory pipeline instead.

## Chain

```text
app alias + intent
  -> app-autopilot
  -> app registry / manifest / workspace resolution
  -> self-audit or change request intake
  -> change-to-release when code changes are needed
  -> experience-hardening for user-facing surfaces
  -> ios-submit-testflight or android-submit-play-internal when release is requested and gates pass
```

## Modes

| Mode | Use When | Code Changes | Release |
|------|----------|--------------|---------|
| `change-to-release` | User provides concrete notes, bugs, or feedback | yes | optional |
| `self-improve` | User wants the agent to inspect and choose improvements | yes | only if explicitly requested and gates pass |
| `growth-experiment` | User wants a creative product/growth pass to improve downloads, activation, retention, or conversion | yes, usually one experiment | only if explicitly requested and gates pass |
| `submit-only` | User only wants TestFlight or Google Play internal submission | no | yes, if gates and preflight pass |

## Repo Surfaces

Workflow:

- `packs/vibermode/workflows/app-autopilot.md`

Delegated workflows:

- `packs/vibermode/workflows/change-to-release.md`
- `packs/vibermode/workflows/experience-hardening.md`
- `packs/vibermode/workflows/ios-submit-testflight.md`
- `packs/vibermode/workflows/android-submit-play-internal.md`

Codex skills:

- `viber-app-autopilot`
- `viber-change-to-release`
- `viber-ios-submitter`
- `viber-android-submitter`

## Automation

No standalone automation is required. A manual app-specific automation may call this workflow with natural language or structured fields. It should resolve the app first instead of baking a personal repo path into the prompt.

```text
app=[alias]
mode=self-improve
submit_when_ready=true
release_target=ios-testflight
```

Portable prompt shape:

```text
Use app-autopilot for [app alias]. Resolve the app with npm run app:resolve, honoring VIBERMODE_APP_REGISTRY, VIBERMODE_WORKSPACE_ROOT, APP_FACTORY_STATE_ROOT, and VIBERMODE_GENERATED_PRODUCTS_ROOT. Run mode=self-improve. If release gates pass, submit to ios-testflight.
```

Natural prompt shape:

```text
[app alias]'e bak, kendin toparla, major sorun yoksa TestFlight'a al.
```

## State Boundaries

Reads:

- public ViberMode source
- app registry entry or generated-product workspace
- target app repo
- existing workflow artifacts
- release manifest when submission is requested

Writes:

- target app code only when mode is `change-to-release` or `self-improve`
- target app workflow artifacts under `docs/[project-name]/`
- platform release state only after gates pass

Must not write:

- unrelated app repos
- app factory backlog unless the delegated factory workflow explicitly owns the run
- secrets into docs, prompts, logs, commits, or registry files
- product code during `submit-only`

## Success

- app alias resolves to one target repo and platform
- the selected mode is explicit
- self-improve evidence includes real screenshots, videos, simulator/browser evidence, or exact blockers
- implementation, validation, experience review, and final review pass when code changes are made
- platform submitter runs only after hard gates and preflight pass
- blockers are exact and actionable when submission cannot proceed

## Blockers

Stop when:

- app alias cannot be resolved safely
- multiple candidate repos match and no registry entry disambiguates them
- the app cannot be launched or core changed surfaces cannot be reached
- validation, experience review, or final review fails
- TestFlight or Google Play credentials, signing, Play Console bootstrap, or provider state blocks release
