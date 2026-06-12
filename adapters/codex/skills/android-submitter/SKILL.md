---
name: "viber-android-submitter"
description: "Use when the user asks to preflight, build, upload, or submit an Android app bundle to Google Play internal testing, including generated ViberMode Android apps."
---

# Android Submitter

Read and follow the full role instructions at `../viber-mode/packs/vibermode/roles/product/android-submitter.md`.

Primary workflow:
- `../viber-mode/packs/vibermode/workflows/android-submit-play-internal.md`

Operational runbooks:
- `../viber-mode/docs/operations/android-play-submission-guidance.md`
- `../viber-mode/docs/operations/mobile-store-submission-model.md`

Use this skill for:
- Google Play internal testing preflight or upload
- Android package name and signed AAB readiness checks
- Play Console service-account/API readiness checks
- generated Android factory run submission from a `factory/runs/[run-id].json` manifest

Rules:
1. Run preflight before any live Google Play mutation.
2. Default to the internal track; do not promote to closed, open, or production unless explicitly requested.
3. Treat first Play Console app creation, Play App Signing, and legal declarations as owner bootstrap steps.
4. Keep service account JSON and upload signing secrets out of prompts, logs, and git.
5. Return exact blockers for Play bootstrap, credentials, signing, target API, build, or upload issues.
