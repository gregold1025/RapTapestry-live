# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Interface (2026-11)

The shell is a fixed header, one left panel at a time, the tapestry in the center, and one right view.

- **Header:** song select, transport (play/pause, stop, scrubber, `current / duration`, volume), the left panel selector (Global, Vocals, Drums, Bass, Other; click the active one again to close the sidebar), and the right view selector (Lyrics, Queries, Query).
- **Global panel:** stems list (visible / mute / solo per stem, shared), layout (time Wrap; view width 2/4/8 bars; stems superimposed or separated into lanes; row height fit or fixed), appearance (background, grid lines).
- **Vocals panel:** Syllables, Words and Lines as collapsible layers. Each has size or thickness, opacity, a vertical height control (one knob unpitched, a band when pitched) and its unqueried defaults (inactive color and opacity, 0 by default so the tapestry only lights up with queries). Words have unpitched, pitched (first syllable) and per-syllable (curve) modes.
- **Drums panel:** color, tilt, glyph, detection (Bands; Classes coming soon), one collapsible row per band (High / Mid / Low) with size, opacity and lane height.
- **Bass panel:** color, opacity, blur, topper (none / divider) and gap, and the pitch-class band. Provisional while the bass data is reworked.
- **Right views:** Lyrics (click a word to query it, the square to query a line), Queries (every query with per-type match toggles), Query (the focused query's parameters and matches).
- **Keyboard:** Space play/pause; S / D / B randomize the syllable, drum and bass glyphs.

Code map: `src/components/Shell` (frame + header), `src/components/Panels` (left panels), `src/components/RightPane` (right views), `src/components/ui` (greybox primitives), `src/contexts/UIStateContext.jsx` (selectors), `src/contexts/StemMixContext.jsx` (mute / solo / visible), `src/utils/laneLayout.js` (stem lanes, pitch bands, centroid normalization). Plan: `docs/superpowers/plans/2026-11-04-interface-redesign.md`.
