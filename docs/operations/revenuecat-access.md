# RevenueCat Access Guidance

Operational guidance for using RevenueCat from this local ViberMode workspace through the official REST API.

RevenueCat currently exposes REST API v1 for customer/subscriber operations and REST API v2 for project configuration, metrics, apps, offerings, entitlements, and newer customer operations. Authentication uses a bearer token in the `Authorization` header. Secret API keys are sensitive and must stay out of Git, app code, screenshots, logs, and generated public artifacts.

Reference docs:

```text
https://www.revenuecat.com/docs/projects/authentication
https://www.revenuecat.com/docs/api-v1
https://www.revenuecat.com/docs/api-v2/overview
https://www.revenuecat.com/docs/projects/overview
```

## Scope

This runbook wires local command-line access only. It does not install an unofficial RevenueCat CLI and it does not commit any RevenueCat secret.

The repo-owned wrapper is:

```bash
node scripts/revenuecat-api.mjs
```

Convenience npm commands are:

```bash
npm run revenuecat:status
npm run revenuecat:projects
npm run revenuecat -- help
```

For factory automation that creates a fresh RevenueCat project per generated app, the wrapper also supports:

```bash
npm run revenuecat -- create-project --name "App Name" --allow-write true
```

## Storage Boundary

Allowed in ViberMode:

- command shapes
- Keychain service names
- non-secret RevenueCat project IDs and app IDs when needed
- public operational documentation

Not allowed in ViberMode:

- RevenueCat secret API keys
- OAuth access tokens
- dashboard session cookies
- customer exports or private subscriber data
- generated reports containing user-identifiable purchase data

Secrets belong in macOS Keychain or local environment variables.

Default Keychain service:

```text
viberboyz-revenuecat-api-key
```

Per-project profile Keychain services:

```text
viberboyz-revenuecat-api-key-[profile]
```

## One-Time Local Setup

### 1. Create The Right Token

In the RevenueCat dashboard, open the project settings and create an API key under API Keys.

For full factory automation that creates new top-level RevenueCat projects, prefer a RevenueCat OAuth access token (`atk_...`) with developer-level access and the `project_configuration:projects:read_write` scope. OAuth tokens are not tied to one project.

Use a v2 secret API key (`sk_...`) for project configuration, offerings, entitlements, apps, metrics, and v2 customer reads. Grant only the permissions needed for the commands you plan to run:

- `project_configuration:projects:read` for `projects` and default `status`
- `project_configuration:projects:read_write` for `create-project`
- `project_configuration:offerings:read` for `offerings`
- `project_configuration:entitlements:read` for `entitlements`
- `project_configuration:apps:read` for `app`, `public-keys`, and `storekit-config`
- `charts_metrics:overview:read` for `metrics-overview`
- `customer_information:customers:read` for v2 `customer`

Use a public SDK API key only for SDK-style v1 reads where RevenueCat permits public-key access. Use a secret key for restricted server-side actions.

### 2. Store The Token

Preferred local storage is macOS Keychain:

```bash
printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --api-key-stdin
unset REVENUECAT_API_KEY
```

Check presence without printing the secret:

```bash
npm run revenuecat -- check-keychain
```

Environment variable fallback:

```bash
export REVENUECAT_API_KEY="sk_..."
```

For OAuth:

```bash
export REVENUECAT_ACCESS_TOKEN="atk_..."
printf '%s' "$REVENUECAT_ACCESS_TOKEN" | npm run revenuecat -- save-keychain --profile factory-admin --api-key-stdin
unset REVENUECAT_ACCESS_TOKEN
```

Use this profile for creating top-level projects:

```bash
npm run revenuecat -- create-project --profile factory-admin --name "New App Name" --allow-write true
```

### 3. Multi-Project Setup

RevenueCat secret API keys are project-specific. For more than one project, store one key per local profile:

```bash
export REVENUECAT_API_KEY="sk_project_1..."
printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --profile mood-dots --api-key-stdin
unset REVENUECAT_API_KEY

export REVENUECAT_API_KEY="sk_project_2..."
printf '%s' "$REVENUECAT_API_KEY" | npm run revenuecat -- save-keychain --profile plant-log --api-key-stdin
unset REVENUECAT_API_KEY
```

This creates Keychain items:

```text
viberboyz-revenuecat-api-key-mood-dots
viberboyz-revenuecat-api-key-plant-log
```

Check a profile without printing the key:

```bash
npm run revenuecat -- check-keychain --profile mood-dots
```

Use a profile for any command:

```bash
npm run revenuecat -- status --profile mood-dots --project-id "proj..."
npm run revenuecat -- offerings --profile mood-dots --project-id "proj..."
```

### 4. Optionally Bind A Project/App For The Shell

Project ID is visible in RevenueCat project settings and is used by API v2.

```bash
export REVENUECAT_PROJECT_ID="proj..."
export REVENUECAT_APP_ID="app..."
```

For profile-specific shell binding, use uppercase profile names with non-alphanumeric characters converted to underscores:

```bash
export REVENUECAT_PROFILE="mood-dots"
export REVENUECAT_MOOD_DOTS_PROJECT_ID="proj..."
export REVENUECAT_MOOD_DOTS_APP_ID="app..."
```

Then profile-aware commands can omit the project/app flags:

```bash
npm run revenuecat -- status --profile mood-dots
npm run revenuecat -- offerings --profile mood-dots
npm run revenuecat -- public-keys --profile mood-dots
```

Do not export customer IDs globally unless you are intentionally inspecting one customer in a private shell.

## Validation Commands

Check network, credential presence, and a minimal v2 API call:

```bash
npm run revenuecat:status
```

List accessible projects:

```bash
npm run revenuecat:projects
```

Inspect project configuration:

```bash
npm run revenuecat -- offerings --project-id "$REVENUECAT_PROJECT_ID"
npm run revenuecat -- entitlements --project-id "$REVENUECAT_PROJECT_ID"
```

Inspect a customer:

```bash
npm run revenuecat -- customer --project-id "$REVENUECAT_PROJECT_ID" --customer-id "app-user-id"
```

Use v1 subscriber status when needed:

```bash
npm run revenuecat -- customer --api-version v1 --customer-id "app-user-id"
```

Read overview metrics:

```bash
npm run revenuecat -- metrics-overview --project-id "$REVENUECAT_PROJECT_ID" --currency USD
```

Create a new top-level RevenueCat project:

```bash
npm run revenuecat -- create-project --profile factory-admin --name "New App Name" --allow-write true
```

Fetch an app's public SDK keys:

```bash
npm run revenuecat -- public-keys --project-id "$REVENUECAT_PROJECT_ID" --app-id "$REVENUECAT_APP_ID"
```

Make a read-only custom request:

```bash
npm run revenuecat -- request --path /v2/projects --method GET
```

Non-GET custom requests require an explicit write guard:

```bash
npm run revenuecat -- request --path /v2/projects/proj.../customers/user.../actions/grant_entitlement --method POST --body-file payload.json --allow-write true
```

## Current Local State

As of 2026-06-08:

- API network egress to `https://api.revenuecat.com` works.
- No official RevenueCat CLI is installed in this workspace.
- No RevenueCat token is currently visible in the process environment.
- Access remains blocked until a RevenueCat API key or OAuth access token is stored in Keychain or exported locally.

## Troubleshooting

If `status` returns `401`, the token is missing, invalid, revoked, or mismatched with the API version.

If `status` returns `403`, the token is understood but lacks the required permission for the endpoint. Create a v2 secret API key with the specific read permission listed above.

If v1 customer reads work but v2 commands fail, create a v2 secret API key. RevenueCat documents that v1 keys do not work with REST API v2.

If `create-project` returns `401` with `Invalid API key` while `projects` works, the credential is project-scoped and RevenueCat is not accepting it for account-level project creation. If it returns `403`, the credential is valid but lacks `project_configuration:projects:read_write`. Use a RevenueCat OAuth access token with the needed project configuration scope for top-level project creation.

If the dashboard project is not listed, set `REVENUECAT_PROJECT_ID` and run:

```bash
npm run revenuecat:status
```

The wrapper will check `/v2/projects/{project_id}` when `REVENUECAT_PROJECT_ID` is present.
