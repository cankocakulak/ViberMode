# OpenClaw Integration

This folder contains the first repo-local OpenClaw integration layer for ViberMode.

Current scope:

- OpenClaw integration notes
- workflow handoff guidance
- source-of-truth references for future OpenClaw adapters

This layer assumes the OpenClaw agent workspace is the ViberMode repository root so the workflows can read:

- `.agents/roles/product/*`
- `.agents/templates/*`
- `.agents/workflows/*`

## Current Status

No checked-in `.prose` files are included right now.

Reason:
- the workflow logic is trusted
- unverified OpenProse syntax should not be kept in-repo as if it were canonical

Future `.prose` files should be generated from the source-of-truth workflow docs only after they are validated against real OpenClaw/OpenProse runtime behavior.

## Design Notes

- `product-to-spec` should map to a full artifact-generation OpenProse workflow.
- `spec-to-code` should map to an iteration-shaped OpenProse workflow.
- the `implementation-runner` contract must remain one task per run.
- any future checked-in OpenProse files should be runtime-validated before being treated as usable adapters.

## Source Of Truth

These `.prose` programs are orchestration adapters. The source-of-truth contracts remain:

- `.agents/workflows/product-to-spec.md`
- `.agents/workflows/spec-to-code.md`
- `.agents/roles/product/*.md`

If the base ViberMode workflow changes, regenerate and revalidate the OpenClaw adapters from these files.
