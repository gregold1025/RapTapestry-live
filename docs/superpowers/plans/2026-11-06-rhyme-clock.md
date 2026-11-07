# Rhyme Clock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Rhyme Clock pane: the song on concentric rings (one ring per cycle of 1 / 2 / 4 bars), words as arcs with query colors and rhyme-vowel dots, one cycle of drum glyphs on the rim, a sweeping playhead, Follow / Freeze, and the shared click rules. It is toggled from the header and floats over the center stage.

**Architecture:** All the math is in plain, tested functions in `src/components/ClockPane/` (`clockCycles.js` for time to cycle and angle, `clockGeometry.js` for rings, window, paths and pointer, `clockMarks.js` for what to draw per word). The React components there are thin SVG renderers on top of those functions. The per-frame work (hand, reveal, window shifts) runs through `subscribePlayhead` and refs, as `ScrollController` does. Settings are in `ParamsContext`, the pane switch is in `UIStateContext`, and a "Rhyme Clock" section goes in `GlobalPanel`.

**Tech Stack:** React 19, SVG, Vitest 4 (node environment: pure-function tests only; components are checked in Chrome).

**Spec:** `docs/superpowers/specs/2026-11-06-rhyme-clock-design.md`

## Global Constraints

- The clock's code lives in `src/components/ClockPane/`. Edits to shared files (`UIStateContext.jsx`, `ParamsContext.jsx`, `AppHeader.jsx`, `CenterStage.jsx`, `GlobalPanel.jsx`, `README.md`) stay small.
- Do not edit `src/engine/**`. Keep `src/contexts/paramDefaults.js` (Greg's drum and bass defaults) as it is.
- Pitch (F0) is never used for position.
- No bass, no "other" stem, no line queries on the clock.
- Line style by form: word solid, mosaic dashed, embedded dotted, semirhyme fine dots. Use the same dash arrays as `StaffVocals.jsx`: mosaic `"7 4"`, embedded `"1.5 4"`, semirhyme `"0.5 3"`.
- Spoke and ring colors come from `gridStrokes(background)` in `src/utils/gridStroke.js`.
- Every task: failing test first, then `npx vitest run` (whole suite green), then `npm run build`. Check in a new Chrome tab at `http://localhost:5176` (`npx vite --port 5176 --strictPort`) and close the tab afterward. Never touch Greg's tabs. Commit with a message ending `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push or merge.
- Ledger: `.superpowers/sdd/rhyme-clock/progress.md` (git-ignored). One line per task, plus a `Ruling:` line for each decision made on Greg's behalf.
- American spelling, no emojis in UI copy.

## Review Focus

1. **A song with no or few downbeats** (missing drum transcription): the clock shows a short note ("No bar grid for this song") and doesn't crash. Pinned in Task 1 (`makeCycles([], …)`).
2. **A word that crosses a cycle boundary** is drawn as two arcs: the end of one ring and the start of the next. Pinned in Task 2 (`wordSegments`).
3. **Shrinking "rings shown" below the current index** clamps the index. Pinned in Task 2 (`clampIndex`).
4. **The playhead in the intro** (before the first downbeat): no current ring, the hand is hidden, and Follow anchors on cycle 0. Pinned in Task 2 (`syncWindow` with P = −1).
5. **The song's tail past the last downbeat:** the last cycles still exist up to `duration` (extrapolated bars), so the final words get drawn. Pinned in Task 1.

---

### Task 1: Time to cycle and angle (`clockCycles.js`)

**Files:**
- Create: `src/components/ClockPane/clockCycles.js`
- Test: `src/components/ClockPane/__tests__/clockCycles.test.js`

**Interfaces:**
- Produces: `makeCycles(downbeats: number[], cycleBars: 1|2|4, duration: number) -> { count: number, cycleOf(t): number, fracOf(t): number, timeAt(cycle: number, frac: number): number, start(cycle): number }`
  - Bars are the intervals between downbeats. Past the last downbeat, bars are extrapolated with the median bar length until they cover `duration`.
  - Cycle k = bars `[k·cycleBars, (k+1)·cycleBars)`.
  - `fracOf(t)` in [0, 1): `((bar mod cycleBars) + phaseInBar) / cycleBars`, linear inside each bar.
  - `cycleOf(t) = -1` before the first downbeat or when there are fewer than 2 downbeats. `count = 0` in the second case.
  - `timeAt` is the inverse of (`cycleOf`, `fracOf`).

- [ ] **Step 1: Write the failing tests.** Fixture: `db = [1, 3, 5, 7, 9]` (2 s bars), duration 12.
  - `makeCycles(db, 1, 12).count === 6` (bars 1–3, 3–5, 5–7, 7–9, 9–11, 11–13 extrapolated).
  - `cycleOf(4) === 1`, `fracOf(4)` ≈ 0.5.
  - With `cycleBars = 2`: `cycleOf(4) === 0`, `fracOf(4)` ≈ 0.75, `count === 3`.
  - With `cycleBars = 4`: `fracOf(5)` ≈ 0.5, `cycleOf(11.5) === 1` (tail extrapolation).
  - `cycleOf(0.5) === -1` (intro).
  - Uneven bars `[0, 2, 5]`, cycleBars 2: `fracOf(3.5)` ≈ 0.75 (bar 2 at phase 0.5).
  - `timeAt(1, 0.5)` with cycleBars 1 ≈ 4. Round trip: `timeAt(cycleOf(t), fracOf(t)) ≈ t` for t in {1.2, 6.6, 11.9}.
  - `makeCycles([], 1, 10).count === 0`, `cycleOf(3) === -1`. `makeCycles([2], 1, 10).count === 0`.
- [ ] **Step 2:** `npx vitest run src/components/ClockPane/__tests__/clockCycles.test.js`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `makeCycles` as specified. Find the bar with a binary search over the extended downbeat array.
- [ ] **Step 4:** Run the test again; expected PASS. Then run the whole suite.
- [ ] **Step 5:** Commit `feat(clock): time to cycle and angle`. Create the ledger file and write its first line.

---

### Task 2: Ring geometry and the window (`clockGeometry.js`)

**Files:**
- Create: `src/components/ClockPane/clockGeometry.js`
- Test: `src/components/ClockPane/__tests__/clockGeometry.test.js`

**Interfaces:**
- Consumes: nothing from Task 1. Its functions take numbers.
- Produces:
  - `RINGS_OPTIONS = [1, 2, 4, 8, 16, 32, "all"]`, `CYCLE_OPTIONS = [1, 2, 4]`
  - `ringCount(ringsShown: number|"all", cycleCount: number) -> number` ("all" → `max(1, cycleCount)`)
  - `clampIndex(index, rings) -> number` (0 … rings − 1)
  - `ringRadius(i, rings, rOuter, rInner) -> number`: i = 0 is outermost. With 1 ring, `rOuter`. Otherwise linear to `rInner` at `rings − 1`.
  - `ringSpacing(rings, rOuter, rInner) -> number` (`rOuter − rInner` when rings = 1)
  - `showText(spacing, textPx) -> boolean`: `spacing >= 2 * textPx` (with a 600 px clock, 8 rings show text and 16 do not; Greg: packed from 16 up).
  - `polar(cx, cy, r, frac) -> {x, y}`: frac 0 at 12 o'clock, clockwise (angle = 2π·frac − π/2).
  - `arcPath(cx, cy, r, f0, f1) -> string`: SVG arc from frac f0 to f1 (f1 > f0, at most 1), clockwise. Uses the large-arc flag when `f1 − f0 > 0.5`.
  - `wordSegments(start, end, cycles) -> [{ cycle, f0, f1 }]`: splits at cycle boundaries. `cycles` is the Task 1 object.
  - `syncWindow({ follow, W, P, index, rings, wholeSong }) -> { W, index, current }`:
    - wholeSong: `W = 0`, `current = P` if `0 ≤ P < rings`.
    - follow: `W = max(0, P) − index`, `current = P >= 0 ? index : null`.
    - freeze: W unchanged. If `0 ≤ P − W < rings`, `index = P − W` and `current = index`; otherwise index is unchanged and `current = null`.
  - `windowForIndex(P, index) -> W` (`max(0, P) − index`): the drag and the slider use it.
  - `pointerToClock(x, y, cx, cy, rings, rOuter, rInner) -> { frac, ring, r }`: ring = the nearest ring index, clamped; frac in [0, 1).
  - `unwrapDelta(prevFrac, frac) -> number`: the change normalized to (−0.5, 0.5].

- [ ] **Step 1: Write the failing tests.**
  - `ringCount("all", 37) === 37`, `ringCount(8, 37) === 8`, `ringCount("all", 0) === 1`.
  - `clampIndex(7, 4) === 3`, `clampIndex(-1, 4) === 0`.
  - `ringRadius(0, 5, 100, 20) === 100`, `ringRadius(4, 5, 100, 20) === 20`, `ringRadius(0, 1, 100, 20) === 100`.
  - `showText(30, 12) === true`, `showText(14, 12) === false`.
  - `polar(0, 0, 10, 0)` ≈ `{x: 0, y: -10}`, `polar(0, 0, 10, 0.25)` ≈ `{x: 10, y: 0}`.
  - `arcPath(0, 0, 10, 0, 0.75)` contains ` 1 1 ` (large arc, clockwise). `arcPath(0, 0, 10, 0, 0.25)` contains ` 0 1 `.
  - `wordSegments` with `makeCycles([0, 2, 4, 6], 1, 6)`: `(1.5, 2.5)` → `[{cycle: 0, f0: 0.75, f1: 1}, {cycle: 1, f0: 0, f1: 0.25}]`, and `(0.5, 1)` → one segment.
  - `syncWindow({follow: true, W: 0, P: 10, index: 2, rings: 8})` → `{W: 8, index: 2, current: 2}`.
  - Freeze, P inside: `{follow: false, W: 8, P: 12, index: 2, rings: 8}` → `{W: 8, index: 4, current: 4}`.
  - Freeze, P outside: `{follow: false, W: 8, P: 20, index: 4, rings: 8}` → `{W: 8, index: 4, current: null}`.
  - Intro: `{follow: true, W: 0, P: -1, index: 0, rings: 8}` → `{W: 0, index: 0, current: null}`.
  - Whole song: `{wholeSong: true, P: 5, rings: 37, …}` → `{W: 0, current: 5}`.
  - `windowForIndex(12, 3) === 9`.
  - `pointerToClock(0, -100, 0, 0, 5, 100, 20)` → `{ring: 0, frac: 0}`; `pointerToClock(60, 0, 0, 0, 5, 100, 20)` → `{ring: 2, frac: 0.25}`.
  - `unwrapDelta(0.95, 0.05)` ≈ 0.1, `unwrapDelta(0.05, 0.95)` ≈ −0.1.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement the functions as specified.
- [ ] **Step 4:** Run the test and the suite; expected PASS.
- [ ] **Step 5:** Commit `feat(clock): ring geometry and the follow / freeze window`.

---

### Task 3: Settings, header button, empty pane, Global section

**Files:**
- Create: `src/components/ClockPane/clockDefaults.js`, `src/components/ClockPane/ClockPane.jsx`, `src/components/ClockPane/ClockPane.css`
- Test: `src/components/ClockPane/__tests__/clockDefaults.test.js`
- Modify: `src/contexts/UIStateContext.jsx` (add `clockOpen`, `setClockOpen`, `toggleClock`, the same way as `staffOpen`)
- Modify: `src/contexts/ParamsContext.jsx` (a `— RHYME CLOCK —` block after the Line Staff block; state initialized from `CLOCK_DEFAULTS`, exported in the context value)
- Modify: `src/components/Shell/AppHeader.jsx` (an `IconClock` export and a toggle button right after the clef button, with the same classes, `disabled={!transport}`, and titles "Open the Rhyme Clock" / "Close the Rhyme Clock")
- Modify: `src/components/CenterStage.jsx` (render `<ClockPane duration={duration} />` inside `.rt-stage` when `clockOpen`)
- Modify: `src/components/Panels/GlobalPanel.jsx` (a "Rhyme Clock" `SectionLabel` section after "Line Staff")

**Interfaces:**
- Produces:
  - `CLOCK_DEFAULTS = { cycleBars: 1, rings: 8, index: 0, words: "all", backgroundColor: "#f7f7f9", wordColor: "#6b6e76", textPx: 12, showDrums: true, drumScale: 1 }`. `rings: 8` is a **Ruling** (the prototype's default); the background and word colors match the staff's.
  - The params (all from `useParams()`): `clockCycleBars`, `clockRings`, `clockIndex`, `clockWords` (`"all"` | `"query"`), `clockBackgroundColor`, `clockWordColor`, `clockTextPx`, `clockShowDrums`, `clockDrumScale`, each with a `set…` setter. `setClockRings` also clamps `clockIndex` with `clampIndex` (Task 2) when it's a number.
  - The Global section has these controls:
    - cycle: Segmented `1 bar / 2 bar / 4 bar`
    - rings: Segmented `1 2 4 8 16 32 all`
    - current ring: Slider 0 … rings − 1, hidden when rings = 1 or "all"
    - words: Segmented `all words / query words`
    - Background: ColorField
    - Words: ColorField, note "words not in a query"
    - text: Slider 8–20 px
    - drum glyphs: on / off Segmented, and a Slider 20–150 %
    - note: "Open the clock with the clock icon in the header."
  - `ClockPane({ duration })`: an absolutely positioned square overlay, centered in `.rt-stage`, sized to `min(stage width, stage height) − 32 px` (measured with a `ResizeObserver`). It has a `.clock-bar` header with the clock icon and title "Rhyme Clock", the rings Segmented, a slot for Freeze / Follow (Task 7), a "settings ›" link (`openParamsPanel("global")`), and a close button (`toggleClock`). The body is an `<svg>` filled with `clockBackgroundColor`. `ClockPane.css` adds `.rt-stage { position: relative; }` and reuses the staff bar's dark header look.

- [ ] **Step 1: Write the failing test.** `CLOCK_DEFAULTS` equals the object above, and `Object.isFrozen(CLOCK_DEFAULTS)`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Create `clockDefaults.js` (frozen), then make the five shared-file edits and the empty pane.
- [ ] **Step 4:** Run the suite and `npm run build`; expected PASS. In Chrome, the clock icon sits right of the clef. It opens and closes an empty colored square over the tapestry and the open Line Staff. The Global section shows the controls, and the current-ring slider hides at 1 ring and at "all".
- [ ] **Step 5:** Commit `feat(clock): pane, header toggle and Global settings`.

---

### Task 4: The face: rings, spokes, colors

**Files:**
- Create: `src/components/ClockPane/ClockFace.jsx`
- Modify: `src/components/ClockPane/clockGeometry.js` (add `spokes`, `faceStrokes`)
- Test: `src/components/ClockPane/__tests__/clockGeometry.test.js`

**Interfaces:**
- Consumes: `ringRadius`, `polar` (Task 2), `gridStrokes` (`src/utils/gridStroke.js`).
- Produces:
  - `spokes(cycleBars, beatsPerBar) -> [{ frac, kind: "bar"|"beat" }]`: one per beat, and `kind: "bar"` where a bar starts.
  - `faceStrokes(background) -> { bar, beat, ring, current }`: `bar` and `current` come from `gridStrokes().bar`, `beat` and `ring` from `.beat`.
  - `<ClockFace geo={{ cx, cy, rOuter, rInner, rings }} cycleBars beatsPerBar background currentRing />`
    - It draws ring circles (`ring` color, 1 px), with the current ring at 2.5 px in `current` color, and a 6 px transparent hit stroke carrying `data-current-ring` for Task 8.
    - Spokes run from `rInner` to `rOuter` (bar 1.5 px, beat 1 px).
    - The drum band's outer boundary is a circle at `rOuter + drumBand`, with `drumBand = 0.12 · rOuter`.
    - `beatsPerBar` comes from `useSongData().songModel.beatsPerBar` (4 when missing).

- [ ] **Step 1: Write the failing tests.**
  - `spokes(2, 4)` has length 8, `[0].kind === "bar"`, `[4]` is `{frac: 0.5, kind: "bar"}`, and `[1].kind === "beat"`.
  - `faceStrokes("#ffffff").bar === gridStrokes("#ffffff").bar`.
  - `faceStrokes("#111111").beat !== faceStrokes("#ffffff").beat`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement the two functions and `ClockFace`, then mount it in `ClockPane`. Take `rOuter = size/2 − drumBand − 8` and `rInner = 0.18 · rOuter` **(Ruling)**. Fill a "No bar grid for this song" note when `cycles.count === 0`.
- [ ] **Step 4:** Run the suite and the build. In Chrome, check rings shown 1 / 8 / 32 / all and cycle 1 / 2 / 4. Then change the background to dark and to a mid gray; the lines should stay visible.
- [ ] **Step 5:** Commit `feat(clock): rings and spokes against the background`.

---

### Task 5: Words: arcs, query visuals, vowel dots, text

**Files:**
- Create: `src/components/ClockPane/clockMarks.js`, `src/components/ClockPane/ClockWords.jsx`
- Test: `src/components/ClockPane/__tests__/clockMarks.test.js`

**Interfaces:**
- Consumes: `makeCycles` (Task 1); `wordSegments`, `arcPath`, `ringRadius`, `showText`, `polar` (Task 2); `useSongData().timing.words` (`Map<id, { start, end, syls: [{ k, vStart, vEnd, start, end }] }>`); `useQueries().visualByWordId` (`{ color, form, vi0, vi1, … }`).
- Produces:
  - `FORM_DASH = { word: null, mosaic: "7 4", embedded: "1.5 4", semirhyme: "0.5 3" }`
  - `wordMarks({ timingWords, visuals, cycles, W, rings, words: "all"|"query", inkColor }) -> [{ id, color, dash, hit, segments: [{ ring, f0, f1 }], dots: [{ ring, frac }], start }]`
    - Keeps only segments whose `ring = cycle − W` is in [0, rings).
    - With `words: "query"`, drops words without a visual.
    - `dots` are the vowel middles `(vStart + vEnd) / 2` of syllables `vi0..vi1`, only for words with a visual.
  - `<ClockWords marks geo textPx showLabels onWord(e, id) onHover(e, id) onLeave />`
    - Each word is a `<g data-start={start} data-ring={ring of first segment}>` holding one `arcPath` per segment: stroke width 2.4 when hit, otherwise 1.6, with the dash from `FORM_DASH[form]`.
    - Dots have r = 2.6 and the word's color.
    - When `showLabels` is true, the text runs along the first segment through `<textPath>`, at `textPx`, 3 px outside the ring.
    - A transparent wide stroke on each arc is the hover and click target.

- [ ] **Step 1: Write the failing tests.** The fixture is cycles from `makeCycles([0, 2, 4, 6, 8], 1, 8)`, with two words:
  - `"0-0"` 0.5–1.0, one syllable, vStart 0.5, vEnd 0.9
  - `"0-1"` 3.0–3.5, two syllables

  Then assert:
  - With no visuals and `words: "all"`: two marks, both with `color === inkColor`, `dash === null`, and `dots` empty.
  - With `words: "query"`: zero marks.
  - With the visual `{color: "#e00", form: "mosaic", vi0: 1, vi1: 1}` on `"0-1"`: that mark has `dash "7 4"`, `hit true`, and one dot at `ring 1` with the frac of syllable 1's vowel middle.
  - With `W = 1, rings = 1`: only `"0-1"` remains, at `ring 0`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement `wordMarks` and `ClockWords`. In `ClockPane`, memoize the marks on `[timing, visualByWordId, cycles, W, rings, clockWords, clockWordColor]` and pass `showLabels = showText(ringSpacing, clockTextPx)`.
- [ ] **Step 4:** Run the suite and the build. In Chrome:
  - Make a query from the tapestry. The clock shows the query colors, dashes for mosaic forms, and dots on the rhyme vowels.
  - Toggling "query words" hides the gray words.
  - Text shows at 8 rings and is gone at 16.
- [ ] **Step 5:** Commit `feat(clock): words, query colors and rhyme-vowel dots`.

---

### Task 6: Drums on the rim (current cycle only)

**Files:**
- Create: `src/components/ClockPane/ClockDrums.jsx`
- Modify: `src/components/ClockPane/clockMarks.js` (add `drumMarks`)
- Test: `src/components/ClockPane/__tests__/clockMarks.test.js`

**Interfaces:**
- Consumes: `useDrumHits()`, `useByClass()` (`src/hooks/useDrumHits.js`); `drumClasses` / `drumBands` / `drumParams` / `glyphAssets` from `useParams()`; `defaultGlyphFor` (`src/utils/drumGlyphDefaults.js`). The group lookup (`rowKey`, `bandOffset`, opacity) and the mask + symbol defs are those of `DrumsGlyphs.jsx`. Copy that pattern, with the ids prefixed `clock-`.
- Produces:
  - `drumMarks({ hits, cycles, cycle, groups, byClass }) -> [{ frac, rowKey, height, time }]`
    - It returns only hits with `cycles.cycleOf(hit.time) === cycle` whose group is visible.
    - `height` is the group's `height` (0–100) plus the low / mid / high `bandOffset`.
  - `<ClockDrums marks geo scale />`
    - Each glyph sits at `polar(cx, cy, rOuter + 4 + (height/100)·(drumBand − 8), frac)` with `data-start={time}`. Height maps to the radius **(Ruling)**.
    - Size is the group size × `clockDrumScale` × `drumParams.size`.
    - The pane renders it only when `clockShowDrums` is on. Its `cycle` is the current ring's cycle (`W + current`); with no current ring, nothing is drawn.

- [ ] **Step 1: Write the failing tests.** Use the hits `[{time: 0.5, cls: "kick"}, {time: 2.5, cls: "kick"}, {time: 2.7, cls: "snare"}]` with cycles `makeCycles([0, 2, 4], 1, 4)`, `byClass: true`, and groups `{kick: {visible: true, height: 20}, snare: {visible: false, height: 60}}`.
  - `cycle = 1` gives one mark: `frac` ≈ 0.25, `rowKey "kick"`.
  - `cycle = 0` gives one mark.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement `drumMarks` and `ClockDrums`, and mount the drums in the pane.
- [ ] **Step 4:** Run the suite and the build. In Chrome:
  - Drum glyphs sit outside the outer ring, for one cycle only.
  - The on / off toggle and the size slider work.
  - Hiding a class in the Drums panel hides it on the clock.
- [ ] **Step 5:** Commit `feat(clock): one cycle of drum glyphs on the rim`.

---

### Task 7: Playhead, Follow / Freeze, reveal

**Files:**
- Create: `src/components/ClockPane/useClockWindow.js`
- Modify: `src/components/ClockPane/ClockPane.jsx`, `src/components/ClockPane/clockGeometry.js` (add `revealOpacity`)
- Test: `src/components/ClockPane/__tests__/clockGeometry.test.js`

**Interfaces:**
- Consumes: `syncWindow`, `windowForIndex`, `polar` (Task 2); `useAudioEngine()` (`subscribePlayhead`, `getPlayheadTime`, `isPlaying`); `clockIndex` / `setClockIndex`.
- Produces:
  - `revealOpacity({ follow, playing, ring, current, start, t }) -> 1 | 0.18`
    - The value is 0.18 only when `follow && playing` and either `ring > current`, or `ring === current && start > t`.
    - **Ruling:** the faint opacity is 0.18.
  - `useClockWindow({ cycles, rings, wholeSong, svgRef }) -> { W, current, follow, setFollow, setIndexFromDrag(i), panBy(cycles: number) }`
    - **W** is React state. It changes only when a cycle boundary is crossed or the user acts, so React re-renders about once per cycle.
    - **Per frame**, through `subscribePlayhead`:
      - P = `cycles.cycleOf(t)`.
      - Run `syncWindow`. If W or the index changed, set the state; in Freeze, a changed index calls `setClockIndex`.
      - Rotate the hand (`[data-hand]`) to `fracOf(t)`, hidden when `current == null`.
      - While `follow && isPlaying`, set the opacity on `[data-ring="<current>"] [data-start]` elements and on the drum glyphs with `revealOpacity`.
    - **An outside change to `clockIndex`** (the Global slider): when `clockIndex !== P − W`, set `W = windowForIndex(P, clockIndex)`.
    - **Switching to Follow** snaps the window with `syncWindow`.
  - A Freeze / Follow `Segmented` in the `.clock-bar` header, with a label "cycles a–b · following / frozen" like the staff's.
  - The hand is a `<line data-hand>` from the center to `rOuter + drumBand`, 1.5 px, `#e5484d` **(Ruling: the same red as the tapestry playhead; use the tapestry's playhead color constant if one exists)**.
  - Rings whose cycle is entirely later than the current one get the class `is-later`. While following and playing, it carries `opacity: 0.18` in the CSS.

- [ ] **Step 1: Write the failing tests.**
  - `revealOpacity({follow: true, playing: true, ring: 3, current: 2, start: 0, t: 9})` is 0.18.
  - With `ring: 2, current: 2, start: 10, t: 9`, it is 0.18.
  - With `start: 8`, it is 1.
  - With `follow: false`, it is 1 for any input.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement `revealOpacity`, `useClockWindow`, the hand, the header control and the `is-later` styling.
- [ ] **Step 4:** Run the suite and the build. In Chrome:
  - **Follow while playing at index 0:** the outer ring fills as the hand sweeps, and the inner rings are faint. At each cycle boundary, the rings shift.
  - **Index 3 in Global:** the current ring sits fourth from the outside.
  - **Freeze while playing:** the rings hold still, and the current ring steps inward each cycle. Past the innermost ring, the hand disappears.
  - **Whole song:** the current ring is wherever the playhead is.
- [ ] **Step 5:** Commit `feat(clock): playhead hand, follow and freeze, reveal`.

---

### Task 8: Clicks, hover, drags

**Files:**
- Create: `src/components/ClockPane/useClockPointer.js`
- Modify: `src/components/ClockPane/ClockPane.jsx`, `src/components/ClockPane/ClockWords.jsx`
- Modify: `src/components/ClockPane/clockGeometry.js` (add `dragMode`)
- Test: `src/components/ClockPane/__tests__/clockGeometry.test.js`

**Interfaces:**
- Consumes:
  - `pointerToClock`, `unwrapDelta`, `ringRadius`, `clampIndex` (Task 2)
  - `cycles.timeAt` (Task 1)
  - `useAudioControls().seekAll`, `useQueries().click`
  - `useCanvasHoverInfo` (`src/components/TapestryView/hooks/useCanvasHoverInfo.js`), `CanvasHoverTooltip` (`src/components/TapestryView/global/CanvasHoverToolTip.jsx`), `matchLabel` (`src/utils/matchLabel.js`)
  - `useClockWindow` (Task 7)
- Produces:
  - `dragMode({ onCurrentRing, wholeSong, rings }) -> "ring" | "pan" | null`
    - `"ring"` when the drag starts on the current ring's hit stroke, `rings > 1`, and not wholeSong.
    - `"pan"` otherwise, except `null` when wholeSong.
  - `useClockPointer({ svgRef, geo, cycles, win }) -> handlers`
    - **Plain click** (moved ≤ 4 px) on the background: `seekAll(cycles.timeAt(W + ring, frac))`. The window does not move, so the clicked ring becomes current in the next frame through `syncWindow` in Freeze. In Follow, the click also switches to Freeze, so nothing jumps (**Ruling**: a click must not move the rings, and Follow would move them).
    - **Ring drag**: snaps the index to the ring nearest the pointer and calls `win.setIndexFromDrag(i)`. The cursor is `ns-resize` while dragging and `grab` on hover over the current ring.
    - **Pan drag**: accumulates `unwrapDelta` turns. Each whole turn calls `win.panBy(±1)` (clockwise = later; the cycles move outward). It switches to Freeze and never seeks.
  - **Word handlers** (in `ClockWords`), as in `StaffVocals.onClick`:
    - alt-click: `click(id, {alt: true})`
    - cmd / ctrl: `click(id, {shift, meta: true})`
    - plain click: seek to the word's start, then `click(id, {reveal: true})`, with the same Freeze rule as the background click
    - hover: the same metadata shape as `StaffVocals`: `{type: "word", wordId, wordText, phones, match}`. `CanvasHoverTooltip` renders it.

- [ ] **Step 1: Write the failing tests.**
  - `dragMode({onCurrentRing: true, wholeSong: false, rings: 8})` is `"ring"`.
  - With `rings: 1`, it is `"pan"`.
  - With `wholeSong: true`, it is `null`.
- [ ] **Step 2:** Run; expected FAIL.
- [ ] **Step 3:** Implement `dragMode`, `useClockPointer`, and the word handlers.
- [ ] **Step 4:** Run the suite and the build. In Chrome:
  - A plain click on ring 3 seeks there; the rings don't move, and ring 3 becomes current.
  - Dragging the current ring moves it one ring at a time, and the Global slider follows.
  - A circular drag pans the cycles and switches to Freeze.
  - Cmd-click on a word makes a query (the Queries view opens), cmd-shift-click extends it, and alt-click removes it.
  - Hover shows the tooltip, which also works with packed rings.
- [ ] **Step 5:** Commit `feat(clock): clicks, hover, ring and pan drags`.

---

### Task 9: README and wrap-up

**Files:**
- Modify: `README.md` (a "Rhyme Clock" subsection in "Interface": what the rings and angle mean, the two levers, the current ring and how to move it, Follow / Freeze, the words toggle, the drums, the clicks, and no line queries on the clock)

- [ ] **Step 1:** Write the README section.
- [ ] **Step 2:** Run `npx vitest run` and `npm run build`. Expected: all green.
- [ ] **Step 3:** In Chrome, play through one song end to end at 1 / 2 / 4-bar cycles, 8 and 32 rings, and whole song, with "Show all words" on. Check that it stays smooth with no console errors. Close the tab.
- [ ] **Step 4:** Commit `docs(clock): README Interface section`. Finish the ledger with the list of Rulings for Greg.
