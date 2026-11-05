# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Interface (2026-11)

The shell (Greg's whiteboard, 2026-11-05): lyrics on the left, the tapestry in the center with the Line Staff under it when opened, and on the right either the parameters or the queries.

- **Header:** left = ABC (show / hide the lyrics); center = song select above the transport (play/pause, stop, loop, `bar . beat`, scrubber, `current / duration`, volume) and the treble clef (open / close the Line Staff); right = parameters | queries for the right pane.
- **Lyrics (left):** click a word to query it, shift-click to extend, cmd-click for a new query, alt-click to remove; click a line's square for a line query.
- **Clicks on the tapestry and the Line Staff:** a plain click scrubs to that point (glyph or background). Cmd-click a word to query it, cmd-shift-click to extend the focused query, alt-click to remove; cmd-click a line band for a line query. Only the lyrics view queries on a plain click.
- **Global panel:** stems (show / mute / solo; click a stem's name for its panel, `‹ Global` to come back), tapestry view width (2/4/8 bars) and row height (fit / fixed), appearance (background, beat lines), and the Line Staff's own settings (view width, show = words / spelled / syllables, text size, drum glyph scale, background, downbeat and beat lines).
- **Vocals / Bass panels:** as before (collapsible layers, size, opacity, vertical height controls, unqueried defaults at 0 opacity). The Drums panel is described below.
- **Queries view:** every query (color, its words in bold inside the line, match count, show / hide, remove) and, under the list, the focused query opened up: phones, rhyme-type chips with counts, the matches by time or type (click to seek).
- **Loop:** the loop button spans the four bars from the bar under the playhead the first time; drag the handles on the tapestry (or on the Line Staff) to move its start and end; they snap to beat lines. With the loop on, play always starts at the loop start and wraps at the end. `src/utils/loop.js`, `TapestryView/global/LoopGlyphs.jsx`.
- **Line Staff pane:** the prototype's staff under the wrap tapestry: each word is a curve through the pitch of its vowels (a dot per voiced vowel) with the text riding the curve, drums above and below, no bass. Show = words, spelled syllables (the spelling cut per syllable by `src/utils/spellSyllables.js`) or syllables (phone clusters by `src/utils/syllabify.js`, stressed in bold). Its own bars in view (2/4/8) and Freeze / Follow: the window follows the playhead two thirds across and reveals each glyph as it is played; drag to freeze and scrub, click to scrub. Color = the query's color when a word is queried or matched, gray otherwise; its text size and drum glyph scale are its own (Global, Line Staff). `src/components/StaffPane`, `TapestryView/staff/StaffVocals.jsx`, `src/utils/scrollWindow.js`, `computeLayout` (`singleRow`), `TapestryView/global/ScrollController.jsx`.
- **Keyboard:** Space is always play/pause (except while typing in a text field); Cmd-Z / Cmd-Shift-Z undo and redo query changes (also buttons in the Queries view); S / D / B shuffle the syllable, drum and bass glyphs (D gives every drum row a distinct glyph).

### Queries and the rhyme engine (2026-11)

The typed rhyme engine from the prototypes lives in `src/engine/` (rules in `rhymeTypes.js`; song model, phone stream, candidate spans and `findTypedRhymes` in `songModel.js`; `computeMatches(song, anchorIds)` in `index.js`). Matching uses dictionary phones; the measured MFA file (`public/data/<Song>/lyric-transcription.measured.json`, built by `src/utils/timingModel.js`) supplies syllable onsets and F0 for placement only.

Two kinds of query, each its own thing (`src/contexts/queryReducer.js`, `QueryContext.jsx`):

- **Word query:** a word or a contiguous run of words, drawn on words and syllables. Click a word: new query, or focus it if it is already an anchor, or move the query there if it is one of its matches ("rhyme gravity"). Shift-click a nearby word to extend the focused query across words (multi-word rime); cmd-click always starts a new query; alt-click removes the query under the word.
- **Line query:** a line, matched to other lines by end rhyme, drawn on lines only. The rhyming unit is the line's last one, two or three words (`src/engine/lineRhymes.js`: "talent show" finds "Alamo"); a line matches when a match ends on its last word. Click a line's square: new line query, focus, or move it to a matched line; alt-click removes it.

Color on the tapestry is the query, never the rhyme type. Forms are drawn as line style (word solid, mosaic dashed, embedded dotted); the matched syllable span uses the measured syllable times. A query's name is its anchor in bold inside about 40 characters of its line (`src/utils/queryLabel.js`). Every layer reads the same `visualByWordId` (word queries) / `visualByLineIdx` (line queries); per-item subscriptions go through `useWordVisual(id)` / `useLineVisual(idx)`. Regression cases for the rules are in `src/engine/__tests__/engine.test.js`.

Code map: `src/components/Shell` (frame, header), `src/components/Panels` (parameter panels, `ParamsPane`), `src/components/RightPane` (`RightPane`, `QueriesView`), `src/components/StaffPane`, `src/components/CenterStage.jsx`, `src/components/ui` (greybox primitives), `src/contexts/UIStateContext.jsx` (shell switches), `src/contexts/StemMixContext.jsx` (mute / solo / visible), `src/utils/laneLayout.js` (stem lanes, pitch bands, centroid normalization). Plans: `docs/superpowers/plans/2026-11-04-interface-redesign.md`, `2026-11-04-engine-fuse.md`, `2026-11-05-shell-v2-loop-staff.md`.
