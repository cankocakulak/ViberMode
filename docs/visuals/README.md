# Visual Sources

This folder contains deployable, code-authored visual sources.

Generated image outputs belong in `docs/assets/`. Do not hand-edit exported SVGs when a source exists under `docs/visuals/`; update the source and regenerate.

## Idea To TestFlight

Source preview:

- `docs/visuals/idea-to-testflight/index.html`

Source module:

- `docs/visuals/idea-to-testflight/diagram.mjs`

Exported assets:

- `docs/assets/idea-to-testflight-flow.svg`
- `docs/assets/idea-to-testflight-flow.png`
- `docs/assets/idea-to-testflight-compact.svg`
- `docs/assets/idea-to-testflight-compact.png`

Regenerate SVG assets:

```bash
npm run export:idea-to-testflight
```

Regenerate SVG and PNG assets:

```bash
npm run export:idea-to-testflight:all
```

PNG export uses macOS Quick Look (`qlmanage`) to render the SVG assets.
