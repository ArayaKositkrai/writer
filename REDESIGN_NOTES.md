# Novel Studio Fantasy Writing OS

## What changed

This build replaces the previous mixed dashboard styling with a single dark-fantasy design system. The application behavior remains unchanged: projects, local persistence, AI providers, workflow routing, story generation, chapter writing, review, import, and export continue to use the original logic.

## New visual architecture

- `src/components/layout/FantasyScene.tsx` — decorative multi-layer environment.
- `src/styles/design-tokens.css` — colors, spacing, radii, shadows, and typography tokens.
- `src/styles/fantasy-scene.css` — moon, castle, stars, mist, foreground desk, and animations.
- `src/styles/app-shell.css` — application layout, top navigation, quest path, workspace, and context rail.
- `src/styles/sidebar.css` — project library, AI settings, presets, and collapsed navigation.
- `src/styles/workflow.css` — shared form, card, input, editor, and table presentation.
- `src/styles/feature-compat.css` — maps the existing feature components onto the new design system without changing their behavior.
- `src/styles/responsive.css` — desktop, tablet, mobile, and reduced-motion behavior.

## Verification

- TypeScript: `npx tsc --noEmit` passes.
- Every TypeScript, TSX, and CSS file under `src` includes its full relative path comment at the top.
- The ZIP intentionally excludes `node_modules`, `dist`, `.git`, macOS metadata, and Vite log files.
