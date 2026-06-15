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

## GitHub Push Credentials

Browser GitHub login is not a Git CLI credential. In local Codex/headless sessions, `git push` may still ask for a username even when the operator is logged into GitHub in the browser.

For pushes to the public ViberMode framework repo, prefer the existing Git credential stored by macOS `osxkeychain` for `github.com`. Do not assume an app-factory token such as `GH_TOKEN` or a `viberboyz-*` Keychain token can push to `cankocakulak/ViberMode`; those tokens may be scoped for repo creation or generated app/state repos only.

Check whether Git has a usable GitHub credential without printing the secret:

```bash
printf 'protocol=https\nhost=github.com\n\n' \
  | git credential-osxkeychain get \
  | awk -F= '{ if ($1=="password") print "password=<set>"; else print }'
```

If plain `git push origin main` fails in a headless session with `could not read Username for 'https://github.com'`, use the stored `osxkeychain` credential as an in-process Git extraheader. This keeps the token out of remotes, files, and logs:

```bash
CRED="$(printf 'protocol=https\nhost=github.com\n\n' | git credential-osxkeychain get)"
USERNAME="$(printf '%s\n' "$CRED" | awk -F= '$1=="username"{print $2; exit}')"
PASSWORD="$(printf '%s\n' "$CRED" | awk -F= '$1=="password"{sub(/^password=/,""); print; exit}')"
BASIC="$(printf '%s:%s' "$USERNAME" "$PASSWORD" | base64)"

git -c http.https://github.com/.extraheader="AUTHORIZATION: basic $BASIC" \
  push origin main
```

If this still returns `403`, the stored Git credential lacks write access to the target repository. Fix the GitHub credential or SSH key outside the repo; never commit a token or place it in a remote URL.
