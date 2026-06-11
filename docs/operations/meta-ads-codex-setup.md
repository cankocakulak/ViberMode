# Meta Ads Codex Setup

This document is for a developer or Codex agent setting up the Meta Ads operator after cloning this repository on a new computer.

## Clone-Time Flow

1. Install the bundled Codex skills.
2. Configure Meta API environment variables locally.
3. Validate read-only API access.
4. Start or open a Codex chat and ask it to use `$meta-ads-operator`.
5. Run read-only reporting first. Do not perform write actions until explicitly approved.

## 1. Install The Skills

From the repository root:

```bash
npm run install:codex
```

This copies all Codex skills under:

```text
adapters/codex/skills/
```

to:

```text
${CODEX_HOME:-$HOME/.codex}/skills/
```

The Meta Ads skill source is:

```text
adapters/codex/skills/meta-ads-operator/
```

## 2. Configure Local Secrets

Do not commit secrets. Configure these in the shell, Codex local environment, or another local secrets manager:

```bash
export META_ACCESS_TOKEN="..."
export META_AD_ACCOUNT_ID="act_..."
export META_API_VERSION="v21.0"
export META_APP_ID="..."
export META_APP_SECRET="..."
```

Required for normal reports:

```text
META_ACCESS_TOKEN
META_AD_ACCOUNT_ID
```

Optional for token debugging:

```text
META_APP_ID
META_APP_SECRET
```

## 3. Validate Without Printing Secrets

```bash
printf 'TOKEN_LEN=%s\nACCOUNT=%s\nAPI=%s\n' "${#META_ACCESS_TOKEN}" "$META_AD_ACCOUNT_ID" "${META_API_VERSION:-v21.0}"
node --check ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs
```

Read ad accounts:

```bash
curl -sS -G "https://graph.facebook.com/${META_API_VERSION:-v21.0}/me/adaccounts" \
  --data-urlencode "fields=name,account_id,id" \
  --data-urlencode "access_token=$META_ACCESS_TOKEN"
```

Run the default weekly report:

```bash
node ~/.codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs \
  --date-preset last_7d \
  --min-spend 100 \
  --format markdown
```

## 4. Codex Bootstrap Prompt

Paste this into a new Codex chat after installing the skill and configuring env vars:

```text
Use $meta-ads-operator. Validate the local Meta Ads environment without printing secrets, then run a read-only last_7d report for META_AD_ACCOUNT_ID in Markdown format. Include account totals, campaign table, creative winners, lead/sales signals, waste watchlist, placement table, and concrete next actions. Do not perform any write actions.
```

For a dedicated ongoing chat, use this:

```text
This thread is the Meta Ads Weekly Operator surface. Use $meta-ads-operator for Meta/Facebook/Instagram Ads requests. Default to read-only weekly reporting for last_7d, Markdown table output, campaign/ad/creative/placement analysis, creative winners, waste watchlist, and concrete next actions. Never print access tokens or app secrets. Do not create, activate, pause, or change budgets without explicit current-turn approval. For write plans, default to PAUSED drafts and read created objects back before summarizing.
```

## Safety Rules

- Reporting is read-only.
- Never print full tokens, app secrets, or signed media URLs.
- Create campaigns, ad sets, ads, and creatives in `PAUSED` status unless activation is explicitly approved.
- Require explicit approval before activation, budget increase, active targeting change, pausing active delivery, or deletion.
- After any write, read changed objects back and report ids/statuses.

## Expected Repo Contents

```text
adapters/codex/skills/meta-ads-operator/SKILL.md
adapters/codex/skills/meta-ads-operator/agents/openai.yaml
adapters/codex/skills/meta-ads-operator/scripts/meta_ads_report.mjs
adapters/codex/skills/meta-ads-operator/references/workflows.md
adapters/codex/skills/meta-ads-operator/references/write-safety.md
adapters/codex/skills/meta-ads-operator/references/portable-setup.md
docs/operations/meta-ads-codex-setup.md
```
