# Local Environment

ViberMode is a public framework repo. Do not assume a contributor has the same username, home directory, workspace root, private state checkout, generated app paths, or credentials as another operator.

## Path Rules

- Treat hardcoded paths in docs as local examples, not public defaults.
- Prefer repo-relative paths for public ViberMode files.
- Prefer explicit CLI flags in automation prompts when a path can differ by machine.
- Prefer environment variables for private state, generated products, and shared local services.
- Never commit machine-specific app registries, credentials, signing files, `.env` files, or generated private app repos.

## Common Variables

| Variable | Purpose |
|----------|---------|
| `VIBERMODE_WORKSPACE_ROOT` | Parent directory for private state and generated products |
| `APP_FACTORY_STATE_ROOT` | Private app-factory state repo path |
| `VIBERMODE_GENERATED_PRODUCTS_ROOT` | Generated app bundle root |
| `VIBERMODE_APP_REGISTRY` | Private JSON app registry for `app-autopilot` |
| `VIBERMODE_AI_SERVICES_PATH` | Optional shared `ai-services` repo path |
| `AI_SERVICES_PATH` | Compatibility alias for shared `ai-services` |
| `GH_TOKEN` | GitHub token for private repo operations |

Default scripts may use `~/ViberModeWorkspaces` as a convenience when no variables are set. Public docs and reusable prompts should still name the variable or CLI override so another operator can substitute their own layout.

## App Resolution

Use the resolver before asking the user for a repo path:

```bash
npm run app:resolve -- --app "Quiet Envelope"
```

Portable discovery order:

1. `--registry` or `VIBERMODE_APP_REGISTRY`
2. `docs/operations/app-registry.local.json`
3. `docs/operations/app-registry.json`
4. factory run manifests under `--state-root`, `APP_FACTORY_STATE_ROOT`, or `VIBERMODE_WORKSPACE_ROOT/app-factory-state`
5. generated app bundles under `--generated-products-root`, `VIBERMODE_GENERATED_PRODUCTS_ROOT`, or `VIBERMODE_WORKSPACE_ROOT/generated-products`

`docs/operations/app-registry.local.json` is gitignored and is the right place for one operator's private app aliases.

## Automation Prompts

Public automation docs should describe path inputs like this:

```text
Use VIBERMODE_WORKSPACE_ROOT when set.
Otherwise use the automation operator's configured local workspace root.
Resolve the app with npm run app:resolve before asking for a repo path.
```

Avoid baking personal paths into reusable prompts unless the prompt is explicitly documenting one local operator's paused automation.

## Secrets

Secrets must stay outside public docs and committed state. Automation may load credentials from a local env file or OS credential store, but prompts and logs must not print token values.
