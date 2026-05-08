# Simple Prompt Chain

This document shows the smallest prompt chain for running OpenClaw workflows in sequence.

## Short Answer

- **Yes**: the canonical ViberMode structure is now meaningfully modular.
- **No, not fully done**: the OpenClaw runtime projection still needs more end-to-end hardening.

The safest current usage pattern is:

- prepare the repository or target folder manually first
- then pass the same absolute path into each workflow step

## 1. Generate Specifications Only

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/product-to-spec/product-to-spec.prose \
idea:"A streak app for students to track daily study hours" \
target_repo:"/ABSOLUTE/PATH/TO/PROJECT" \
project_name:"study-chain" \
analysis_artifact:"" \
constraints:"" \
direction:"" \
audience:"students" \
product_context:"" \
platform:"mobile" \
branding_context:"" \
personas:"student"
```

Generated artifacts:

- `docs/study-chain/brainstorm.md`
- `docs/study-chain/prd.md`
- `docs/study-chain/ux.md`
- `docs/study-chain/stories.md`

## 2. Run Bootstrap

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

Generated artifact:

- `docs/study-chain/bootstrap.md`

## 3. Run Spec To Code

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/spec-to-code/spec-to-code.prose \
target_repo:"/ABSOLUTE/PATH/TO/PROJECT" \
project_name:"study-chain" \
analysis_artifact:"" \
branch_prefix:"feature"
```

Generated artifacts:

- `docs/study-chain/tasks.json`
- `docs/study-chain/run-state.json`

## 4. Run Everything In One Command

```bash
/prose run /Users/mcan/.openclaw/agents/vibermode-orchestrator/workspace/workflows/product-to-code/product-to-code.prose \
idea:"A streak app for students to track daily study hours" \
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
audience:"students" \
product_context:"" \
branding_context:"" \
personas:"student" \
branch_prefix:"feature"
```

## Simplest Operating Sequence

### Greenfield

1. Create the target folder.
2. Run `product-to-spec`.
3. Run `bootstrap`.
4. Run `spec-to-code`.

### Brownfield

1. Clone the repository.
2. Use the same local path as workflow input.
3. Run `analyzer` first if needed.
4. Run `product-to-spec`.
5. Run `bootstrap`.
6. Run `spec-to-code`.

## Practical Rule

- Use one absolute path for the whole run.
- Keep `target_repo` or `workspace_path` stable across the flow.
- For now, manual repository preparation is still the safest setup.
