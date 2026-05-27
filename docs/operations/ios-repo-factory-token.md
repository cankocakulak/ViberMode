# iOS Repo Factory Token Setup

This document explains how to create, store, and use the GitHub token required by `scripts/github-create-template-repo.mjs`.

ViberMode is intended to be public framework material. Do not store live tokens in this repository, in git remotes, in workflow files, or in logs. Store the token only in the runtime that executes the automation.

## Create the GitHub Token

Use a fine-grained personal access token.

GitHub path:

```text
GitHub -> Settings -> Developer settings -> Personal access tokens -> Fine-grained tokens -> Generate new token
```

Recommended token settings:

```text
Token name:
ios-repo-factory

Resource owner:
the target organization that will receive generated repos

Repository access:
All repositories

Repository permissions:
Administration: Read and write
Contents: Read-only
```

For creating private repositories from a template, the GitHub REST API requires repository `Administration` write permission and `Contents` read permission. If the target organization requires approval for fine-grained tokens, wait for approval before running the automation.

GitHub shows the token value only once, immediately after creation. If it is lost, create a new token and replace the stored local secret.

## Store the Token on macOS

Use macOS Keychain for local Codex or shell-driven automation.

Replace `<service-name>` with a stable local name such as `ios-repo-factory-gh-token`, and replace `<token>` with the new GitHub token value.

```bash
security add-generic-password \
  -a "$USER" \
  -s "<service-name>" \
  -w "<token>" \
  -U
```

Verify that the token exists without printing it:

```bash
security find-generic-password -a "$USER" -s "<service-name>" >/dev/null && echo "token stored"
```

Read it into `GH_TOKEN` for one command:

```bash
GH_TOKEN="$(security find-generic-password -a "$USER" -s "<service-name>" -w)" \
node scripts/github-create-template-repo.mjs
```

## Run a Dry-Run Check

Dry-run validates token access, template visibility, and destination repo-name availability. It does not create a repository.

```bash
TOKEN_SERVICE="<service-name>"

GH_TOKEN="$(security find-generic-password -a "$USER" -s "$TOKEN_SERVICE" -w)" \
TEMPLATE_OWNER="KantAkademi2" \
TEMPLATE_REPO="ios-boilerplate" \
DESTINATION_OWNER="<target-org>" \
NEW_REPO_NAME="ios-app-$(TZ=Europe/Istanbul date +%F)" \
REPO_PRIVATE=true \
INCLUDE_ALL_BRANCHES=false \
DRY_RUN=true \
DESCRIPTION="Generated from KantAkademi2 ios-boilerplate" \
node scripts/github-create-template-repo.mjs
```

Expected success shape:

```json
{
  "status": "dry_run",
  "full_name": "<target-org>/ios-app-YYYY-MM-DD",
  "private": true,
  "template": "KantAkademi2/ios-boilerplate",
  "name_available": true
}
```

## Create the Repository

Run the same command without `DRY_RUN=true`.

```bash
TOKEN_SERVICE="<service-name>"

GH_TOKEN="$(security find-generic-password -a "$USER" -s "$TOKEN_SERVICE" -w)" \
TEMPLATE_OWNER="KantAkademi2" \
TEMPLATE_REPO="ios-boilerplate" \
DESTINATION_OWNER="<target-org>" \
NEW_REPO_NAME="ios-app-$(TZ=Europe/Istanbul date +%F)" \
REPO_PRIVATE=true \
INCLUDE_ALL_BRANCHES=false \
MAX_NAME_ATTEMPTS=50 \
DESCRIPTION="Generated from KantAkademi2 ios-boilerplate" \
node scripts/github-create-template-repo.mjs
```

The script prints the generated repo URL. If the base name already exists, it tries suffixes such as `-2`, `-3`, up to `MAX_NAME_ATTEMPTS`.

## Acquire the Generated Repository

Use `scripts/acquire-workspace.mjs` before running `product-to-code` when the repo exists on GitHub but is not yet cloned locally.

```bash
TOKEN_SERVICE="<service-name>"

GH_TOKEN="$(security find-generic-password -a "$USER" -s "$TOKEN_SERVICE" -w)" \
REPO_URL="https://github.com/<target-org>/ios-app-$(TZ=Europe/Istanbul date +%F).git" \
WORKSPACE_PARENT="/absolute/path/to/generated-ios-apps" \
PROJECT_NAME="ios-app-$(TZ=Europe/Istanbul date +%F)" \
node scripts/acquire-workspace.mjs
```

Expected success shape:

```json
{
  "status": "cloned",
  "repo_url": "https://github.com/<target-org>/ios-app-YYYY-MM-DD.git",
  "workspace_path": "/absolute/path/to/generated-ios-apps/ios-app-YYYY-MM-DD",
  "branch": "main"
}
```

Pass the returned `workspace_path` into `product-to-code`. If the workspace already exists and is a git repo, the script returns `status: "reused"` instead of cloning again.

## Private Automation Hosts

If this runs from a private GitHub Actions host instead of local Keychain, store the token as an Actions secret named `GH_TOKEN` in that private host. Do not add the live secret to the public ViberMode repository.

The example workflow is here:

```text
docs/examples/github-actions/daily-ios-repo-factory.yml
```

Copy it into a private automation host only when that host owns the live secret and schedule.

## Failure Messages

Common failures:

- `Missing required value: GH_TOKEN` - the token was not injected into the process.
- `GitHub API 404 on /repos/...` - the template repo is not visible to the token, or the template path is wrong.
- `GitHub API 403 ...` - the token lacks permission, the token is pending organization approval, or the authenticated user cannot create repos in the target organization.
- `GitHub API 422 ...` - the destination name is invalid or unavailable. The script automatically handles normal name conflicts when the existing repo is visible to the token.
