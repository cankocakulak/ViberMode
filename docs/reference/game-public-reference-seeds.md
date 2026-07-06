# Game Public Reference Seeds

Last refreshed: 2026-07-05

This is a starter reference catalog for ViberMode game workflows. It does not replace current App Store/Google Play research during a run. It gives agents a known starting set and a consistent way to extract lessons from popular mobile games.

Do not copy IP, exact art, level layouts, store copy, or economy tuning. Use these as quality-floor references for first-screen read, core verb clarity, feedback energy, progression promise, and "does this look cheap?" judgment.

Source data also exists as structured JSON:

```text
packs/vibermode/patterns/game-public-reference-seeds.json
```

## Reference Table

| Reference | Source Signal Observed | Core Verb | First 10 Seconds | Pressure | Visual Hook | Feedback Hook | Do Not Copy |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Snake Clash! | App Store: 724K ratings, 4.7, Chart #17 Simulation. Google Play: 100M+ downloads, 4.3 star. | Slither, eat, grow, survive. | Move snake, collect food, avoid/eat rivals. | Bigger rivals, arena competition, boss/milestone pressure. | Readable snake body, growth scale, skins, arena field. | Eating makes the body visibly larger and more powerful. | Snake IP, fake multiplayer presentation, ad pressure, exact arena/skin treatment. |
| Block Blast! | App Store: 2.6M ratings, 4.9, Chart #5 Casual. Official site: 70M DAU, 300M MAU claims. | Drag blocks, place, clear, score. | See grid, draggable pieces, row/column clear affordance. | Spatial scarcity, future-piece planning, no-move fail state. | Bright cube materials, 8x8 board, color crush. | Clears explode/cascade and reinforce mastery. | Exact board art, shapes, branding, or puzzle layouts. |
| Pizza Ready! | App Store: 325K ratings, 4.6, Chart #22 Simulation. | Cook, serve, clean, upgrade. | See station, customer queue, serving route, upgrade path. | Service speed, demand, staff capacity, expansion. | Restaurant stations, food line, customers, staff. | Serving converts to cash/progress; upgrades visibly expand or speed up. | Pizza theme/assets, store layout, idle economy tuning. |
| Hole.io | App Store: 2M ratings, 4.6. | Glide, swallow, grow, clear. | See controllable hole, small objects, size-gated targets. | Object size gating, timer/map clear, rival scale. | Black hole silhouette, city/object scale contrast. | Objects disappear/crunch; hole grows and unlocks larger targets. | Black-hole theme, city maps, exact swallow mechanic. |
| Going Balls | App Store listing describes fast rolling-ball track play. Refresh chart/rating data when used. | Guide a rolling ball to finish. | See ball, track, finish direction, fall risk. | Narrow tracks, obstacles, speed, physics precision. | Shiny ball, elevated track, forward camera momentum. | Rolling, collision, fall/retry, finish celebration. | Track layouts, ball skins, exact physics presentation. |

## How Agents Should Use This

1. Start with these seeds only as a baseline.
2. Browse current store/chart pages during each serious new/design/quality run.
3. Add at least one mechanic-adjacent reference and one visual-quality reference for the target game.
4. Capture the target prototype screenshot and compare it against the references.
5. Write the target-specific artifact:

```text
docs/[project-name]/[prototype-id]-reference-benchmark.md
```

## Screenshot Policy

Store screenshots are copyrighted storefront material. Do not vendor them into this repo by default. Link to source pages and record visual observations. For internal analysis, agents may capture browser/store screenshots when practical, but the required durable artifact is the URL-backed benchmark plus the prototype's own simulator screenshots.
