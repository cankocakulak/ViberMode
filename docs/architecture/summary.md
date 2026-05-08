# Architecture Summary

## Goal

The target is not just code generation. The target is a full path from:

`brainstorm -> PRD -> UX -> stories -> tasks -> code -> compile/test -> review -> next task`

The long-term aim is to make this flow testable, modifiable, and eventually automatable with scheduled or recurring runs.

## Layer Summary

- `ViberMode` = contract layer
- `Codex` = strongest immediate coding worker
- `OpenClaw` = strongest long-term orchestration shell
- `OpenProse` = executable workflow layer
- `ACP` = bridge for using stronger external coding workers from OpenClaw

## Practical Conclusions

- For pure implementation loops, Codex is the simplest tool.
- For multi-step orchestration and future automation, OpenClaw is the better shell.
- `product-to-spec` and `spec-to-code` should not be treated as the same workflow problem.
- The best near-term model is hybrid:
  - `OpenClaw` for specification flow
  - `Codex` for implementation flow

## Recommended Roadmap

- `V1`: ViberMode + Codex for stable `spec-to-code`
- `V2`: OpenClaw for `product-to-spec`
- `V3`: OpenClaw orchestrator + ACP-Codex worker
- `V4`: add build/test and review workers
- `V5`: add cron, automation, and retry logic
