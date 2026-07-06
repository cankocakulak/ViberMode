# Game Reference Benchmark

> Required benchmark contract for judging whether a ViberMode game looks and feels commercially plausible instead of merely functional.

## Purpose

Use this before concept approval, design-character passes, full-production handoff, and quality scorecards. The benchmark turns "this looks cheap/generic" into inspectable evidence by comparing the prototype against current public mobile game references and recent in-repo outputs.

This is not an instruction to clone chart games. It is a way to measure production floor, first-screen clarity, object appeal, feedback spectacle, and level/progression expectations.

## Required Sources

For a new full-production game, collect at least five references:

- at least three current public App Store, Google Play, or reputable market/report references
- at least one mechanic-adjacent game reference
- at least one visual/UX-quality reference even if the mechanic differs
- at least two recent in-repo prototype screenshots or docs for sameness comparison

For design-character, grow-best, and quality-scorecard passes, collect at least three public references plus two in-repo comparisons.

Start from current sources whenever network access is available:

- App Store game charts: `https://apps.apple.com/us/iphone/charts/6014`
- App Store pages for mechanic-adjacent games
- Google Play pages when they expose screenshots, ratings, installs, or update notes
- reputable public reports such as Sensor Tower, AppMagic, Business of Apps, PocketGamer.biz, Liftoff, GameAnalytics, or publisher pages
- gameplay videos only when store screenshots are unavailable or the motion pattern is the relevant benchmark

If current public research is blocked, record the exact blocker and apply the score caps in `game-production-quality-gate.md`.

Seed references live at:

```text
packs/vibermode/patterns/game-public-reference-seeds.json
docs/reference/game-public-reference-seeds.md
```

Use them only as a starting point. A serious run must refresh or extend them with current public research for the target mechanic.

To create a benchmark scaffold from the seed catalog:

```bash
node /Users/mcan/.codex/skills/viber-mode/packs/vibermode/scripts/game-reference-benchmark-seed.mjs \
  --docs docs/game-with-water \
  --prototype-id <prototype-id> \
  --prototype-name "<Prototype Name>" \
  --workflow game-design-character
```

After scaffold creation, replace TODOs with actual target screenshot observations, in-repo comparisons, reference-fit scores, and required remediation.

The artifact gate fails benchmarks that still contain `TODO` placeholders or `Status: BLOCKED` / `Status: REMEDIATE`. A seed scaffold is a starting point, not acceptance evidence.

## Evidence To Capture

For each public reference, record:

- source URL and access date
- why it qualifies: chart/rating/install/report signal or clear mechanic adjacency
- core verb and first 10-second read
- pressure model: timer, opponent, scarcity, precision, score chase, hazard, or fail state
- visual hook: signature object, camera/framing, material, character/world cue, color role map
- feedback hook: what happens on success, fail, combo, upgrade, or completion
- level/progression expectation
- what must not be copied

When practical, capture or link screenshots/video observations. A benchmark with only prose and no store/runtime visual evidence cannot support a high design score.

## Reference-Fit Scoring

Score each item from 0 to 10, then average:

| Dimension | What 8-10 Looks Like |
| --- | --- |
| First-screen commercial read | Goal, toy, and input are visible without reading a paragraph. |
| Core verb legibility | The verb can be guessed from the screenshot or first interaction. |
| Signature object/silhouette | The main object is recognizable if the title is removed. |
| Material and polish | Objects have depth, texture, custom marks, or purposeful 3D/2D treatment. |
| UI chrome restraint | HUD supports the toy instead of dominating the screen. |
| Feedback spectacle | Success/failure produces a visible event, not only text or a score number. |
| Pressure readability | The player sees what makes the round harder. |
| Progression promise | The game implies new spaces, levels, upgrades, enemies, constraints, or mastery. |
| Store-screenshot power | A single screenshot could plausibly sell the game idea. |
| Distinctness without cloning | The prototype borrows quality patterns without copying IP, art, or exact mechanics. |

Interpretation:

- `8.0+`: commercially plausible prototype direction.
- `6.0-7.9`: usable prototype, but design or progression needs one remediation loop.
- `<6.0`: do not call design/full-production complete; route to design-character, feature-experiment, or level-pack.

## Cheap/Generic Red Flags

Flag these explicitly. If two or more remain unresolved, cap the score using `game-production-quality-gate.md`.

- screenshot identity depends mostly on the title text
- generic white rounded cards are the main visual language
- the playable object is smaller than HUD/status chrome
- important states differ only by color
- effects are mostly static labels, score deltas, or SF Symbols
- the board could belong to any other prototype after swapping names
- tutorial/result/level-map shell is interchangeable with recent outputs
- levels mainly change numbers instead of player behavior
- no public reference shows why this visual or mechanic direction is competitive

## Required Artifact

Write a target-specific benchmark:

```text
docs/[project-name]/[prototype-id]-reference-benchmark.md
```

Minimum structure:

```markdown
# [Prototype] Reference Benchmark

Date:
Prototype:
Workflow:

## Public References

| Reference | Source | Signal | Core Verb | First 10 Seconds | Pressure | Visual Hook | Feedback Hook | Do Not Copy |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |

## In-Repo Comparisons

| Prototype | Screenshot/Doc | Repeated Risk | What Must Differ |
| --- | --- | --- | --- |

## Prototype Screenshot Read

- screenshot(s) inspected:
- what is tappable in 3 seconds:
- what the player understands in 10 seconds:
- title-removed identity:
- cheap/generic red flags:

## Reference-Fit Score

| Dimension | Score | Evidence |
| --- | ---: | --- |

Average:
Status: PASS / REMEDIATE / BLOCKED

## Required Changes Before Acceptance

- ...
```

## Acceptance Rules

- Do not score a design or full-production pass above 65 without this artifact.
- Do not score above 72 if the artifact lacks current public references or visual observations.
- Do not score above 78 unless the prototype screenshot was compared against the references after implementation.
- Do not claim `PASS` if reference-fit average is below 6.0.
- Do not claim `PASS` if the benchmark only lists games but does not extract concrete visual, mechanic, pressure, and feedback lessons.
