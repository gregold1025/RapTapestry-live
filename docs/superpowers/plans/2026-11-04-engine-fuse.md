# Engine Fuse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Replace the app's three selection contexts with one query model driven by the prototypes' typed rhyme engine (new-prototypes/shared), use the MFA measured dataset for syllable timing and pitch, add the Line Staff's scroll layout, and apply Greg's header/panel adjustments.

**Architecture:** The prototype engine is vendored into `src/engine/` with its imports pointed at the app (`VOWEL_SIM` from utils, `computeLayout` from utils). `SongDataContext` builds the engine's song model once per song (dictionary phones for matching, as Greg decided 2026-10-20) and a timing model from the measured file (syllable onsets, F0). `QueryContext` holds queries (contiguous word ranges) and their matches; every layer (lines, words, syllables, lyrics, right views) reads one `visualByWordId` map. `TapestryLayoutContext` gains a `scroll` time layout: one row the width of the song, scrolled by the playhead.

**Spec:** Greg's message of 2026-11-04 (pasted in chat) + Line Staff behavior in new-prototypes/line-staff/index.html + memory `interface-redesign.md`.

## Global Constraints

- Engine rules unchanged: `rhymeTypes.js`, `querySpans.js`, `songData.js` logic are copied, not edited (only import paths and the layout dependency injection change). `RULE_OPTIONS.compoundRimes` stays true.
- Matching uses the dictionary phones (lyric-transcription.json). Timing and F0 come from lyric-transcription.measured.json when present; even split and centroid otherwise.
- Query = one word or a contiguous run of words (shift-click extends). A line query is a query on the line's last word. Syllables are data, not a query type.
- Color = query identity. Rhyme type is not color on the tapestry; form is dash style (mosaic `5 3`, embedded `1.5 3`). Rhyme types are toggled per query in the right pane.
- Header: stems strip (eye/M/S) on the left; song select top center; transport row under it with a scrubber no wider than 520 px; header 88 px.
- Left panel 20% of the window when open. Clicking a stem name in the Global panel opens that stem's panel.
- Scroll layout: N bars visible (2/4/8), playhead held at two thirds when following, Freeze/Follow toggle, drag to scrub, content revealed as the playhead passes while following.

## Review Focus

1. Shift-click with no focused query must create a query, not throw. Test in Task 3.
2. A query whose anchor word has no ARPABET (pipeline stored text) must yield no matches and not crash: phone overrides fill most; otherwise `rime` is null. Test in Task 2 (engine model builds for all four songs).
3. Clicking a word that is a match of query A adopts A (moves its anchor); clicking an anchor of A focuses A; Cmd-click always creates. Test in Task 3.
4. Scroll layout with `fixed` row height: the single row must still use the container height (row height mode ignored in scroll). Manual check Task 7.
5. Measured file missing for a song: timing falls back to even split, pitch to centroid, no errors. Test in Task 4.

---

### Task 1: Data + engine vendoring
**Files:** Create `src/engine/rhymeTypes.js`, `phoneOverrides.js`, `songModel.js` (from songData.js: `buildSongModel({ songId, lyricTranscription, drumTranscription })` returning the same shape as `loadSong` without fetching), `querySpans.js`, `index.js`. Copy `experiments/mfa-02-formants/<Song>/lyric-transcription.measured.json` to `public/data/<Song>/`. Test `src/engine/__tests__/engine.test.js` reads `public/data/93Til/*.json` with `fs` and asserts Greg's regression cases: `wage` finds `engagements` as embedded; `engagements` finds `stage went` as mosaic; multi-word `tree trunk` finds `we funk` and `weak luck` as mosaics; `handball` finds `all` (compound rime).
- [ ] RED: write the test, run, expect module missing.
- [ ] GREEN: vendor + adapt; `npx vitest run src/engine` passes. Commit.

### Task 2: Song model + timing in SongDataContext
**Files:** Modify `src/utils/fetchSongData.js` (optional `measured` file), `src/contexts/SongDataContext.jsx` (expose `songModel`, `timing`, `f0Mid`), create `src/utils/timingModel.js` + test.
**Interfaces:** `buildTiming(lyricTranscription, measured)` -> `{ words: Map<wordId, { start, end, syls: [{ k, start, end, f0, vowel, stress }], f0 }>, f0Mid }`. Syllable k start = `mfa.syllables[k].onset`, end = next onset or word end; f0 from `measured[k].f0`. Fallback: even split, f0 null.
- [ ] RED/GREEN tests: aligned word uses onsets; unaligned falls back; f0Mid is the median.
- [ ] Wire into SongDataContext. Commit.

### Task 3: QueryContext
**Files:** Create `src/contexts/QueryContext.jsx`, `src/contexts/queryReducer.js` + test; delete `src/contexts/lyricsContexts/`, `src/components/QueryPanel/`, `src/components/PhonemeMatchList/`, `src/utils/extractRhymingWords.js`, `extractLines.js`, `extractAlliterations.js`, `extractConsonance.js`, `extractVowels.js` and their tests where they only test deleted code.
**Interfaces:** `queryReducer(state, action)` with actions `click(wordId, {shift, meta, alt})`, `remove(id)`, `toggleActive(id)`, `setTypes(id, Set)`, `focus(id)`, `clear()`, given `matchesFor(anchorIds) -> matches[]` (injected). State `{ queries: [{ id, color, anchorIds, active, createdAt, types }], focusedId }`. `useQueries()` -> state + actions + `matchesByQueryId` + `visualByWordId: Map<wordId, { queryId, color, type, form, vi0, vi1, isAnchor }>` + `visualByLineIdx` (a line is tinted by the query of any anchor it contains, else of its highest-ranked match) + `lineQuery(lineIdx)`.
- [ ] RED: reducer tests for Review Focus 1 and 3, plus extend keeps contiguity (lowest..highest flat).
- [ ] GREEN. Provider computes matches with the engine (memo per query). Commit.

### Task 4: Layers on the query
**Files:** Modify `SyllableGlyphs.jsx` (timing + F0 height; matched syllables take the query color), `WordGlyphs.jsx` (query color; form dash; embedded/mosaic highlight only the matched syllable span using timing), `LineGlyphs.jsx` (tint by `visualByLineIdx`; click = line query), `LyricsView/WordBlock.jsx` + `WordLine.jsx` (click/shift/cmd/alt; line square = line query; underline by form).
- [ ] Build + browser check. Commit.

### Task 5: Right views
**Files:** Rewrite `RightPane/QueryListView.jsx` (rows: color dot, anchor text, counts per type, focus/eye/x) and `SingleQueryView.jsx` (anchor text + phones, type chips with counts toggling `types`, match list grouped by type with form, seek on click). Delete `RightPane` dependencies on QueryPanel.
- [ ] Build + browser check. Commit.

### Task 6: Header + panel adjustments
**Files:** `Shell/AppHeader.jsx`, `Shell/Shell.css`, `Panels/GlobalPanel.jsx`, `Shell/StemsStrip.jsx`.
- [ ] Two-row header (88 px): row 1 = stems strip left, song select center, selectors right; row 2 = transport centered, scrubber max 520 px. Left column 20vw. Global panel stem names are buttons that call `setLeftPanel(stem)`.
- [ ] Build + browser check. Commit.

### Task 7: Scroll time layout
**Files:** `utils/computeLayout.js` (no change), `contexts/TapestryLayoutContext.jsx` (scroll: barsPerRow = total bars, width = containerWidth * totalBars / barsVisible, rowHeight = container height), `components/TapestryView/index.jsx` + `ScrollController.jsx` (follow/freeze button, drag to scrub, translateX per frame via playhead subscription, reveal clip), `GlobalPanel` enables Scroll.
- [ ] Unit test for `scrollWindow({ playheadBar, barsVisible, totalBars, follow, win0 })` -> `win0` clamped and held at two thirds. Commit.

### Task 8: Verify, README, memory
- [ ] `npx vitest run`, `npm run build`, browser pass over all songs. Update README section. Commit.
