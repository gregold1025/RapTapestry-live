# Interface Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Rap Tapestry shell around the Figma redesign (file ZT8iKitg31xb41eDuy4ava, 2026-11-04): a fixed header with transport and two selectors, one stem/global panel at a time on the left, the tapestry in the center with layout controls, and one of three views on the right (lyrics, query list, single query). The rhyme engine and selection contexts stay exactly as they are.

**Architecture:** A `UIStateContext` holds the two header selectors. A `StemMixContext` owns mute/solo/visible per stem (lifted out of the old channel strips). `ParamsContext` gains the new visual params (layout, per-layer modes, bands, inactive opacities, per-band drum params). `TapestryLayoutContext` adds `laneFor(stem)` so glyph layers draw inside a stem lane (superimposed = whole row, separated = stacked lanes). Panels are built from a small set of greybox UI primitives in `src/components/ui/`.

**Tech Stack:** React 19, Vite 7, vitest, plain CSS. No new dependencies.

**Spec:** The Figma file and the memory file `interface-redesign.md` (decisions dated 2026-11-04). Summary of the decided design is in the Global Constraints below.

## Global Constraints

- American spellings in all UI text and code (color, center, gray).
- Rhyme logic untouched: `WordSelectionContext`, `LineSelectionContext`, `SyllableSelectionContext`, `utils/extract*`, `utils/phonemeSimilarity.js` are not modified.
- Header holds: song select, transport (play/pause, stop, scrubber, current time / duration, volume), left panel selector `[Global | Vocals | Drums | Bass | Other]` (click active again = close), right view selector `[Lyrics | Queries | Query]` (exclusive, always one open).
- Left panel width 240 px; right pane 315 px minimum, flexible; center = remaining width.
- Stem panel header row: title + eye (visible) + M + S. Mute/solo are shared (one playhead); visibility is per stem.
- Global panel = Stems list (name, eye, M, S) then Layout: time `[Wrap | Scroll | Fold]` (Scroll, Fold disabled "soon"), view width `[2 | 4 | 8 bar]`, stems `[superimposed | separated]`, row height `[fit | fixed]` + px slider when fixed, then Appearance: background color, downbeats, beat lines, row lines.
- Vocals panel = header, three collapsible layer rows (chevron, glyph, name, eye). Syllables: glyph picker, size, opacity, `[unpitched | pitched]`, vertical height (one knob unpitched, two knobs = band pitched), defaults (inactive color, inactive opacity). Words: thickness, opacity, `[unpitched | pitched | pitched per syllable]`, vertical height (one knob unpitched, band otherwise), defaults. Lines: opacity, drop shadow, vertical band, defaults.
- Drums panel = header, color, detection `[Bands | Classes]` (Classes disabled "soon"), three collapsible rows High / Mid / Low: glyph picker, eye, hit count, size, opacity, vertical height (one knob). Tilt stays as a shared slider.
- Bass panel = header, color, Notes row: topper picker, thickness (gap), opacity, blur, topper `[none | divider]`, vertical band (pitch class 0 lands at the low knob, 11 at the high knob).
- Other panel = "Params coming soon".
- Lyrics view: no syllable circles above words. Word click and line square keep their current behavior.
- Keyboard: Space play/pause, S/D/B randomize glyphs stay.
- Height sliders are vertical and read 0 to 100 percent of the lane, bottom to top.

## Review Focus

1. Hidden stem under `separated`: lanes must redistribute to visible stems only, and a row with all stems hidden must not divide by zero. Test in Task 5.
2. `fixed` row height with 2 bars per row on 93 Til makes a tall scroll; the playhead overlay must still size to `contentHeight`. Covered by existing PixiPlayheadOverlay; manual check in Task 10.
3. Pitched word mode on a word whose `centroid` array is empty must fall back to the unpitched center. Test in Task 5.
4. Solo then mute on another stem must clear solo (old channel-strip rule). Test in Task 2.
5. Switching songs remounts providers; the left/right selectors must survive (they live above the song-keyed providers). Manual check in Task 10.

---

### Task 1: Shell and header

**Files:**
- Create: `src/contexts/UIStateContext.jsx`
- Create: `src/components/Shell/AppShell.jsx`, `src/components/Shell/AppHeader.jsx`, `src/components/Shell/Shell.css`
- Modify: `src/App.jsx` (compose providers, render AppShell), `src/App.css` (replace frame rules)
- Modify: `src/components/AudioControlsView/*` (inline header variant: play/pause, stop, scrub, time, volume in one row)

**Interfaces:**
- Produces: `useUIState()` -> `{ leftPanel: null|'global'|'vocals'|'drums'|'bass'|'other', setLeftPanel(p), toggleLeftPanel(p), rightView: 'lyrics'|'queries'|'query', setRightView(v) }`. Default leftPanel `'vocals'`, rightView `'lyrics'`.
- `AppShell` props: `{ header, left, center, right }` render slots.

- [ ] Step 1: `UIStateContext` with the state above; `toggleLeftPanel(p)` sets `null` when `p === leftPanel`.
- [ ] Step 2: `AppHeader` with song `<select>`, `AudioControlsView`, `PanelSelector` (segmented, uses toggleLeftPanel), `RightViewSelector` (three icon buttons).
- [ ] Step 3: `AppShell` CSS grid: header 56 px, then `[left 240px | center 1fr | right minmax(315px, 28%)]`; left column collapses to 0 when `leftPanel` is null.
- [ ] Step 4: App.jsx renders the shell with placeholder left/right content; remove GlyphControlsView, ChannelStripsPanel, HeaderSettingsMenu, GlobalMasterStrip from App.jsx.
- [ ] Step 5: `npm run build` passes. Commit `feat(shell): header with transport and panel/view selectors`.

### Task 2: StemMixContext

**Files:**
- Create: `src/contexts/StemMixContext.jsx`, `src/contexts/__tests__/stemMix.test.js` (pure reducer tests)
- Delete: `src/components/ChannelStripView/` (after Task 6 consumes its logic)

**Interfaces:**
- Produces: `useStemMix()` -> `{ muted: {vocals,drums,bass,other}, soloed: string|null, visible: {...}, effectiveMuted: {...}, toggleMute(stem), toggleSolo(stem), setVisible(stem, bool) }`. Pure reducer `stemMixReducer(state, action)` exported for tests.
- Applies `audio.muted` to `audioRefs` on every change; mirrors `visible` into `setShowVocals/setShowDrums/setShowBass`.

- [ ] Step 1: Write tests: solo A then mute B clears solo and leaves B muted; toggling the active solo clears solo and unmutes all; effectiveMuted under solo mutes everyone else.
- [ ] Step 2: Run tests, expect failure (module missing).
- [ ] Step 3: Implement reducer + provider; mount in App.jsx inside AudioProvider.
- [ ] Step 4: Tests pass. Commit `feat(stems): shared mute/solo/visible context`.

### Task 3: UI primitives

**Files:**
- Create: `src/components/ui/Segmented.jsx`, `Slider.jsx`, `VSlider.jsx`, `IconButtons.jsx` (EyeButton, MuteButton, SoloButton, Chevron), `GlyphPicker.jsx`, `CollapsibleRow.jsx`, `ColorField.jsx`, `SectionLabel.jsx`, `ui.css`

**Interfaces:**
- `Segmented({ options: [{value,label,disabled?}], value, onChange, size?: 'sm'|'md' })`
- `Slider({ label, value, min, max, step, unit, onChange, format? })`
- `VSlider({ knobs: [v] | [lo, hi], onChange(knobs), height?: number, preview?: ReactNode })` values 0..100
- `GlyphPicker({ urls, value, onChange, onRandom, label })` shows current glyph thumbnail; click opens popover grid.
- `CollapsibleRow({ open, onToggle, glyph, title, right, children })`
- `ColorField({ label, value, onChange })`

- [ ] Step 1: Build each primitive with the greybox styles from the Figma columns (panel #f6f6f7, card #fff, ink #1a1a1a, muted #777a80, line #d6d6db, accent = ink).
- [ ] Step 2: Build passes. Commit `feat(ui): greybox panel primitives`.

### Task 4: Params additions

**Files:**
- Modify: `src/contexts/ParamsContext.jsx`
- Create: `src/utils/__tests__/laneLayout.test.js` (see Task 5; params defaults asserted there)

**Interfaces (new params, with defaults):**
- Layout: `barsPerRow` 8; `timeLayout` 'wrap'; `stemsLayout` 'superimposed'; `rowHeightMode` 'fit'|'fixed' (replace 'auto' with 'fit' everywhere); `fixedRowHeightPx` 120.
- Syllables: `syllableMode` 'pitched'; `syllableBand` {lo:30, hi:85}; `syllableFixedHeight` 60; `syllableInactiveOpacity` 0; `inactiveSyllableColor` '#9e9ea2'.
- Words: `wordMode` 'unpitched'; `wordThicknessPx` 10; `wordCenter` 50; `wordBand` {lo:30, hi:85}; `wordInactiveOpacity` 0; `wordInactiveColor` '#9e9ea2'.
- Lines: `lineBand` {lo:5, hi:95}; `lineShadow` 0; `lineInactiveOpacity` 0; `lineInactiveColor` '#9e9ea2'.
- Drums: `drumBands` { high:{visible:true,size:10,opacity:1,height:80}, mid:{visible:true,size:14,opacity:1,height:55}, low:{visible:true,size:16,opacity:1,height:20} }; `drumParams` keeps fillColor, tilt. `drumDetection` 'bands'.
- Bass: `bassParams` adds `band:{lo:10, hi:60}`, `topper:'divider'|'none'`; keeps rectHeight (gap), fillColor, opacity, blur.
- Setters: `setSyllableMode`, `setSyllableBand`, ... one per param; `setDrumBand(key, patch)`.

- [ ] Step 1: Add state + setters + provider value entries. Keep every existing param name so untouched components compile.
- [ ] Step 2: Build passes. Commit `feat(params): layout, layer mode, band and drum-band params`.

### Task 5: Lanes and glyph layers

**Files:**
- Create: `src/utils/laneLayout.js`, `src/utils/__tests__/laneLayout.test.js`
- Modify: `src/contexts/TapestryLayoutContext.jsx` (pass `barsPerRow` from params; expose `laneFor`), `src/App.jsx` (drop barsPerRow prop)
- Modify: `src/components/TapestryView/vocals/SyllableGlyphs.jsx`, `WordGlyphs.jsx`, `LineGlyphs.jsx`, `drums/DrumsGlyphs.jsx`, `bass/BassGlyphs.jsx`

**Interfaces:**
- `computeLanes({ stemsLayout, order: ['drums','vocals','bass'], visible: {drums,vocals,bass} })` -> `{ drums:{top,height}, vocals:{...}, bass:{...} }` as fractions of the row (0..1). Superimposed: every lane `{top:0,height:1}`. Separated: visible stems stacked in order, equal heights; hidden stems get `{top:0,height:0}`; zero visible stems -> all `{top:0,height:1}`.
- `laneY(rowTop, rowHeight, lane, pct)` -> y pixel for `pct` percent (0 bottom, 100 top) inside the lane.
- `wordPitchCenter(word, mode, band, center)` -> pct for the word rectangle: unpitched -> `center`; pitched -> band mapped from `centroid[0]` (fallback `center` when no centroid).

- [ ] Step 1: Tests for computeLanes (three cases above), laneY (pct 0 = lane bottom, 100 = lane top), wordPitchCenter fallback.
- [ ] Step 2: Run, expect failure.
- [ ] Step 3: Implement `laneLayout.js`; add `laneFor(stem)` to the layout context value (memo on stemsLayout + visibility).
- [ ] Step 4: SyllableGlyphs: y from `syllableMode` (pitched: centroid mapped into `syllableBand`; unpitched: `syllableFixedHeight`), size = `syllableRadius`, inactive fill uses `inactiveSyllableColor` at `syllableInactiveOpacity`; active keeps `syllableOpacity`.
- [ ] Step 5: WordGlyphs: thickness `wordThicknessPx`; y from `wordPitchCenter`; `perSyllable` mode draws a `<path>` (Catmull-Rom through syllable points, stroke = thickness) instead of the rect for matched/anchor words and a straight hit rect for interaction; inactive words use `wordInactiveColor` at `wordInactiveOpacity`.
- [ ] Step 6: LineGlyphs: rect spans the `lineBand` inside the vocals lane; `lineShadow > 0` applies an SVG drop-shadow filter with stdDeviation `lineShadow * 6`; inactive uses `lineInactiveColor` at `lineInactiveOpacity`.
- [ ] Step 7: DrumsGlyphs: per-band visible/size/opacity/height from `drumBands`, y via `laneY(..., drums lane, height)`.
- [ ] Step 8: BassGlyphs: pitch class maps into `bassParams.band` inside the bass lane; topper drawn only when `topper === 'divider'`.
- [ ] Step 9: Tests pass, build passes. Commit `feat(tapestry): stem lanes, layer modes, bands`.

### Task 6: Left panels

**Files:**
- Create: `src/components/Panels/GlobalPanel.jsx`, `VocalsPanel.jsx`, `DrumsPanel.jsx`, `BassPanel.jsx`, `OtherPanel.jsx`, `StemHeader.jsx`, `LeftPanel.jsx`, `Panels.css`
- Modify: `src/App.jsx` (left slot = `<LeftPanel/>`)
- Delete: `src/components/ChannelStripView/`, `src/components/GlyphControlsView/`, `src/components/HeaderSettingsMenu/`

**Interfaces:**
- `LeftPanel` reads `useUIState().leftPanel` and renders the matching panel or nothing.
- `StemHeader({ stem, title, subtitle })` renders eye/M/S from `useStemMix()`.
- Drum hit counts come from `useSongData().drumTranscription.drum_hits` grouped by category.

- [ ] Step 1: GlobalPanel per Global Constraints; row height `fixed` reveals the slider.
- [ ] Step 2: VocalsPanel with the three collapsible layer rows and their controls wired to params; glyph picker uses `glyphAssets.syllableGlyphUrls` + `setSyllableGlyphUrl` + `randomizeSyllableGlyph`.
- [ ] Step 3: DrumsPanel with color, detection, tilt, three band rows; glyph picker uses `drumGlyphUrls` (shared glyph for all bands).
- [ ] Step 4: BassPanel; OtherPanel placeholder.
- [ ] Step 5: Delete the three old component folders; `grep` confirms no imports remain. Build passes. Commit `feat(panels): global, vocals, drums, bass, other`.

### Task 7: Right views

**Files:**
- Create: `src/components/RightPane/RightPane.jsx`, `QueryListView.jsx`, `SingleQueryView.jsx`, `RightPane.css`
- Modify: `src/components/LyricsView/WordBlock.jsx` (remove syllable row), `LyricsView/index.jsx` (drop syllable hover), `LyricsView.css`
- Modify: `src/components/QueryPanel/ActiveQueryPanel.jsx` (export `FocusedQueryCard` without the selection strip), `ActiveQueryPanel.css` + `SelectionList.css` (light greybox colors)

**Interfaces:**
- `RightPane` reads `useUIState().rightView`: `lyrics` -> `<LyricsView/>`; `queries` -> `<QueryListView/>` (GlobalMasterStrip toggles on top, full-height `SelectionList`, "no queries yet" empty state); `query` -> `<SingleQueryView/>` (focused card, empty state "Click a word or line").
- Clicking a row in the query list keeps the list view (focus only). A small "open" button on the focused row switches `rightView` to `query`.

- [ ] Step 1: WordBlock without the syllable row; keep `useSyllableWordState` import out (remove), keep word anchor click.
- [ ] Step 2: QueryListView, SingleQueryView, RightPane.
- [ ] Step 3: Re-skin the query CSS to the greybox palette (backgrounds #fff/#f6f6f7, text #1a1a1a/#777a80, borders #d6d6db).
- [ ] Step 4: Build passes. Commit `feat(right): lyrics without syllables, query list, single query views`.

### Task 8: Transport polish and keyboard

**Files:**
- Modify: `src/components/AudioControlsView/*`

- [ ] Step 1: Song title shown as the select's label; current time and duration as `m:ss / m:ss`; volume as a small slider (no hover popover).
- [ ] Step 2: Build passes. Commit `feat(header): transport layout`.

### Task 9: Verification in the browser

- [ ] Step 1: `npm test`, `npm run build`, `npm run lint` (lint warnings in untouched files tolerated).
- [ ] Step 2: Open http://localhost:5173 in Chrome; screenshot each left panel and each right view; verify: panel toggles closed on second click; separated lanes stack drums/vocals/bass; 2/4/8 bars change the grid; fixed row height scrolls; pitched/unpitched switch moves syllables; word per-syllable mode draws curves; mute/solo audible state via `audio.muted` in console.
- [ ] Step 3: Fix what the screenshots show. Commit `fix: ...` as needed.

### Task 10: Hand-off

- [ ] Step 1: Update `README.md` section "Interface (2026-11)" with the panel map and keyboard shortcuts.
- [ ] Step 2: Final commit. Do not push.
