# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Interface (2026-11)

The shell is a fixed header, one left panel at a time, the tapestry in the center, and one right view.

- **Header:** left = the stems strip (eye / mute / solo per stem; click a stem's name to open its panel, Global for the shared layout panel; click again to close); center = song select above the transport (play/pause, stop, scrubber, `current / duration`, volume); right = the right view selector (Lyrics, Queries, Query).
- **Global panel:** links to the stem panels, layout (time Wrap or Scroll; window 2/4/8 bars; stems superimposed or separated into lanes; row height fit or fixed), appearance (background, grid lines).
- **Scroll time layout** (ported from the Line Staff prototype): the song on one row, the chosen number of bars in view. The window follows the playhead (held two thirds across) and reveals each glyph as it is played; drag the tapestry to freeze and scrub, click the background to play from there, Freeze/Follow in the corner. `src/utils/scrollWindow.js`, `computeLayout` (`singleRow`), `TapestryView/global/ScrollController.jsx`.
- **Vocals panel:** Syllables, Words and Lines as collapsible layers. Each has size or thickness, opacity, a vertical height control (one knob unpitched, a band when pitched) and its unqueried defaults (inactive color and opacity, 0 by default so the tapestry only lights up with queries). Words have unpitched, pitched (first syllable) and per-syllable (curve) modes.
- **Drums panel:** color, tilt, glyph, detection (Bands; Classes coming soon), one collapsible row per band (High / Mid / Low) with size, opacity and lane height.
- **Bass panel:** color, opacity, blur, topper (none / divider) and gap, and the pitch-class band. Provisional while the bass data is reworked.
- **Right views:** Lyrics (click a word to query it, the square to query a line), Queries (every query: color, words, match counts per type, show/hide, remove), Query (the focused query: words and phones, rhyme-type chips with counts, matches by time or type; click a match to seek).
- **Keyboard:** Space play/pause; S / D / B randomize the syllable, drum and bass glyphs.

### Queries and the rhyme engine (2026-11)

The typed rhyme engine from the prototypes lives in `src/engine/` (rules in `rhymeTypes.js`; song model, phone stream, candidate spans and `findTypedRhymes` in `songModel.js`; `computeMatches(song, anchorIds)` in `index.js`). Matching uses dictionary phones; the measured MFA file (`public/data/<Song>/lyric-transcription.measured.json`, built by `src/utils/timingModel.js`) supplies syllable onsets and F0 for placement only.

A query is a word or a contiguous run of words (`src/contexts/queryReducer.js`, `QueryContext.jsx`):

- click a word: new query, or focus it if it is already an anchor, or move the query there if it is one of its matches ("rhyme gravity")
- shift-click a nearby word: extend the focused query across words (multi-word rime)
- cmd-click: always a new query; alt-click: remove the query under the word
- a line's square queries the line's last word (the line is context, not a query type)

Color on the tapestry is the query, never the rhyme type. Forms are drawn as line style (word solid, mosaic dashed, embedded dotted); the matched syllable span uses the measured syllable times. Every layer reads the same `visualByWordId` / `visualByLineIdx`; per-word subscriptions go through `useWordVisual(id)` / `useLineVisual(idx)`. Regression cases for the rules are in `src/engine/__tests__/engine.test.js`.

Code map: `src/components/Shell` (frame, header, stems strip), `src/components/Panels` (left panels), `src/components/RightPane` (right views), `src/components/ui` (greybox primitives), `src/contexts/UIStateContext.jsx` (selectors), `src/contexts/StemMixContext.jsx` (mute / solo / visible), `src/utils/laneLayout.js` (stem lanes, pitch bands, centroid normalization). Plans: `docs/superpowers/plans/2026-11-04-interface-redesign.md`, `docs/superpowers/plans/2026-11-04-engine-fuse.md`.
