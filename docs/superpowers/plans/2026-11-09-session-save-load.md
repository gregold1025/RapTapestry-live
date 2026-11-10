# Session Save and Load Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two header buttons: Download saves the whole session for the current song as JSON; Upload loads one (Load demo, or Choose file…) and restores everything except the playhead.

**Architecture:** A pure session-file module (`src/session/`) builds and parses the file, encoding glyph URLs as names and Sets as arrays. Each state owner exposes a snapshot and an apply function, built from pure helpers that are tested on their own. A `SessionProvider` at the app root holds the pending session. A `SessionBridge` mounted inside the per-song providers collects snapshots for Download and applies a pending session once its song has loaded.

**Tech Stack:** React 18 + Vite, Vitest (node environment: tests use pure functions and `react-dom/server`, no DOM).

**Spec:** `docs/superpowers/specs/2026-11-09-session-save-load-design.md`

## Global Constraints

- File: `{ format: "rap-tapestry-session", version: 1, savedAt, song, params, ui, mix, loop, queries }`; JSON, 2-space indent.
- File name: `<song>-session-<YYYY-MM-DD>.json` (e.g. `Amen-session-2026-11-09.json`).
- Glyph values are stored as `asset:<folder>/<name>` (folders `svg_shapes`, `svg_lines`, `svg_dividers`); unknown names fall back to the key's default.
- Replace, not merge: a key the file lacks returns to its default (the value at provider mount).
- Not saved: playhead (starts at 0), undo history (starts empty), Follow/Freeze (both panes start in Follow), hover, open pop-ups and menus, the Drums/Vocals panels' row accordions.
- No unsaved-changes warning (Greg 2026-11-09).
- A bad file applies nothing and shows why.
- Demo: `public/data/demo-session.json`, fetched at `${import.meta.env.BASE_URL}data/demo-session.json`; missing → "No demo session yet".
- Workflow per task: failing test first, `npx vitest run`, `npm run build`; a Chrome check in your own tab for UI tasks. American spelling. Commit message ends with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push.

## Review Focus

1. A file saved, then loaded on another build: glyph assets must resolve by name (test in Task 1: an encoded URL decodes through a different url map).
2. Loading a file for another song while one is playing: the song switches, then queries, mix and loop apply only after the new song's providers mount, exactly once (Task 5: `shouldApply` test).
3. A file from a newer app version, or with unknown keys: loads what it knows and notes it (Task 1 test).
4. A query referencing words missing from the song data: dropped and counted, never crashes the reducer (Task 4 test).
5. A non-JSON or foreign JSON file: `{ ok: false, error }`, nothing applied (Task 1 test).

---

### Task 1: The session file (pure)

**Files:**
- Create: `src/session/sessionFile.js`
- Test: `src/session/__tests__/sessionFile.test.js`

**Interfaces:**
- Produces:
  - `SESSION_FORMAT = "rap-tapestry-session"`, `SESSION_VERSION = 1`
  - `sessionFileName(song: string, date: Date) -> string`
  - `toFileValue(value, assetNameOf: (url) => string|null) -> any`: deep copy; a `Set` becomes `{ $set: [...] }`; a string that `assetNameOf` names becomes `"asset:<folder>/<name>"`.
  - `fromFileValue(value, assetUrlOf: (ref) => string|null) -> any`: the inverse; an unknown asset ref becomes `null`.
  - `buildSessionFile(parts: { song, params, ui, mix, loop, queries }, { now: Date, assetNameOf }) -> string` (JSON text)
  - `parseSessionFile(text: string, { assetUrlOf }) -> { ok: true, session: { song, params, ui, mix, loop, queries }, notes: string[] } | { ok: false, error: string }`

- [ ] **Step 1: Write the failing tests** (`sessionFile.test.js`):
  - `sessionFileName("Amen", new Date("2026-11-09T12:00:00"))` is `"Amen-session-2026-11-09.json"`.
  - Round trip: `parseSessionFile(buildSessionFile(parts, ...), ...)` gives back `parts` (with a `Set(["perfect","loosened"])` inside `queries.queries[0].types` and a glyph URL in `params.glyphStyle.syllableGlyphUrl`).
  - Across builds: encode with `assetNameOf = (u) => ({ "/a/x-123.svg": "svg_shapes/x" })[u] ?? null`, decode with `assetUrlOf = (r) => ({ "svg_shapes/x": "/b/x-999.svg" })[r] ?? null`: the value is `"/b/x-999.svg"`.
  - Unknown asset ref → `null`.
  - `parseSessionFile("not json")` → `ok: false`, error mentions "not a session file". `parseSessionFile('{"a":1}')` → `ok: false` (wrong format). A missing `song` → `ok: false`.
  - `version: 2` → `ok: true`, `notes` contains `"saved by a newer version"`. An unknown top-level key is ignored.
- [ ] **Step 2: Run** `npx vitest run src/session/__tests__/sessionFile.test.js`. Expected: FAIL (module missing).
- [ ] **Step 3: Implement** `src/session/sessionFile.js` as specified.
- [ ] **Step 4: Run** the same. Expected: PASS.
- [ ] **Step 5: Commit** `feat(session): session file format (build, parse, assets by name)`.

### Task 2: Parameters snapshot

**Files:**
- Create: `src/session/paramKeys.js`
- Modify: `src/contexts/ParamsContext.jsx` (capture the defaults at mount in a ref; expose `getParamsSnapshot`, `applyParamsSnapshot`, `assetNameOf`, `assetUrlOf`)
- Test: `src/session/__tests__/paramKeys.test.jsx`

**Interfaces:**
- Produces:
  - `PARAM_KEYS: string[]`: every state value in ParamsContext (the `useState` list, e.g. `rowHeightMode`, …, `clockShowDrums`, `drumBands`, `drumClasses`, `glyphStyle`); each has a setter `set<Key>` in the context value.
  - `paramsToApply(snapshot: object, defaults: object, keys = PARAM_KEYS) -> object`: for every key, the snapshot's value if present, else the default. Plain-object values (e.g. `drumClasses`) are taken whole from the snapshot; a row missing from it gets the default row.
  - Context value adds `getParamsSnapshot() -> object` (the keys' current values), `applyParamsSnapshot(snapshot)` (calls each `set<Key>` with `paramsToApply`), and `assetNameOf(url)`, `assetUrlOf(ref)` over the three glyph folders (`svg_shapes`, `svg_lines`, `svg_dividers`).

- [ ] **Step 1: Write the failing tests:**
  - Render `<ParamsProvider><Probe /></ParamsProvider>` with `renderToStaticMarkup`, where `Probe` stores `useParams()` in a variable. Every `PARAM_KEYS` key is defined in the value, and `typeof value["set" + Key] === "function"`. No key in the value that holds React state is missing from `PARAM_KEYS`: compare against an explicit list of non-state keys (setters, `glyphAssets`, randomize functions, `setDrumBand`, `setDrumClass`, the snapshot functions).
  - `paramsToApply({ staffTextPx: 20 }, { staffTextPx: 12, gridLevel: 2 }, ["staffTextPx", "gridLevel"])` → `{ staffTextPx: 20, gridLevel: 2 }`.
  - `paramsToApply({ drumClasses: { kick: K } }, { drumClasses: { kick: K0, snare: S0 } }, ["drumClasses"])` → `{ drumClasses: { kick: K, snare: S0 } }`.
  - `assetUrlOf(assetNameOf(url))` returns `url` for one URL from each folder.
- [ ] **Step 2: Run** `npx vitest run src/session/__tests__/paramKeys.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** The defaults are the first render's values: `useRef` set once from the state values.
- [ ] **Step 4: Run.** Expected: PASS. Then run the whole suite: `npx vitest run`.
- [ ] **Step 5: Commit** `feat(session): parameters snapshot and apply`.

### Task 3: View state in one place

**Files:**
- Modify: `src/contexts/UIStateContext.jsx` (add `clockFull`/`setClockFull` default `false`, `matchGroupBy`/`setMatchGroupBy` default `"time"`; expose `getUISnapshot`, `applyUISnapshot`)
- Modify: `src/components/ClockPane/ClockPane.jsx` (use `clockFull` from UIState instead of its local `full`)
- Modify: `src/components/RightPane/QueriesView.jsx` (use `matchGroupBy` instead of local `groupBy`)
- Modify: `src/contexts/AudioContext.jsx` (add `volume`, `setVolume`; apply to every audio element on change and when the elements mount)
- Modify: `src/components/AudioControlsView/index.jsx` (use the context's volume)
- Create: `src/session/uiKeys.js`
- Test: `src/session/__tests__/uiKeys.test.jsx`

**Interfaces:**
- Produces:
  - `UI_KEYS = ["lyricsOpen", "rightOpen", "rightView", "paramsPanel", "staffOpen", "staffBars", "staffMode", "clockOpen", "clockFull", "globalSections", "matchGroupBy"]`
  - `uiToApply(snapshot, defaults) -> object` (same rule as `paramsToApply`).
  - UIState value: `getUISnapshot() -> object`, `applyUISnapshot(snapshot)`.
  - Audio context value: `volume: number`, `setVolume(v: number)`.

- [ ] **Step 1: Write the failing tests:** SSR-render `UIStateProvider` with a probe: every `UI_KEYS` key is defined and has `set<Key>`. `uiToApply({ staffOpen: true }, { staffOpen: false, staffBars: 4 })` → `{ staffOpen: true, staffBars: 4 }`.
- [ ] **Step 2: Run** `npx vitest run src/session/__tests__/uiKeys.test.jsx`. Expected: FAIL.
- [ ] **Step 3: Implement**, moving the three local states.
- [ ] **Step 4: Run** the suite and `npm run build`. Expected: PASS, green. Check in Chrome: clock expand and shrink, the match grouping toggle and the volume still work.
- [ ] **Step 5: Commit** `feat(session): clock size, match grouping and volume in shared state; UI snapshot`.

### Task 4: Per-song state: queries, stem mix, loop

**Files:**
- Modify: `src/contexts/undoable.js` (add `RESET = "history/reset"`: `{ type: RESET, present }` → a fresh history with that present)
- Modify: `src/contexts/queryReducer.js` (add `restorableQueries(queries, hasWord: (id) => boolean, lineCount: number) -> { queries, dropped: number }`)
- Modify: `src/contexts/QueryContext.jsx` (expose `getQuerySnapshot() -> { queries, focusedId, solo }`, `applyQuerySnapshot(snap) -> { dropped }`)
- Modify: `src/contexts/stemMixReducer.js` (action `{ type: "restore", state }` → `{ muted, soloed, visible }` taken from `state`, defaults for missing parts) and `src/contexts/StemMixContext.jsx` (expose `getMixSnapshot`, `applyMixSnapshot`)
- Test: `src/contexts/__tests__/sessionRestore.test.js`

**Interfaces:**
- Consumes: `fromFileValue` has already turned `types` back into Sets (Task 1).
- Produces: `RESET`, `restorableQueries`, the stem mix `restore` action, and the four context functions above. The loop uses the existing `setLoop` (AudioContext).

- [ ] **Step 1: Write the failing tests:**
  - `undoable`: after two steps, `{ type: RESET, present: P }` → `present === P`, `canUndo === false`, `canRedo === false`.
  - `restorableQueries`: a word query whose `anchorIds` include an id `hasWord` rejects is dropped (`dropped: 1`); a line query with `lineIdx >= lineCount` is dropped; the rest keep their order and fields.
  - `stemMixReducer(initialStemMix, { type: "restore", state: { muted: { vocals: true }, soloed: "drums" } })` → `muted.vocals === true`, `muted.bass === false`, `soloed === "drums"`, `visible` all true.
- [ ] **Step 2: Run** `npx vitest run src/contexts/__tests__/sessionRestore.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.** `applyQuerySnapshot` dispatches `RESET` with `{ queries, focusedId (kept only if it survives, else the last query's id or null), highlight: null }` and sets `solo`.
- [ ] **Step 4: Run** the suite. Expected: PASS.
- [ ] **Step 5: Commit** `feat(session): restore queries, stem mix and loop per song`.

### Task 5: Save and load orchestration

**Files:**
- Create: `src/session/SessionContext.jsx`
- Create: `src/session/loadPlan.js`
- Modify: `src/App.jsx` (wrap in `SessionProvider`; mount `<SessionBridge songId={selectedSong} />` inside `QueryProvider`; `SessionProvider` gets `onSwitchSong={setSelectedSong}`)
- Test: `src/session/__tests__/loadPlan.test.js`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - `loadPlan(currentSong, session) -> { switchSong: boolean }`; `shouldApply(pending, mountedSong) -> boolean` (true when pending's song equals the mounted song and it has not been applied yet).
  - `useSession() -> { saveSession(), loadSession(session), status: string|null }`.
  - `loadSession` applies params and UI at once, stores the session as pending, stops playback, seeks to 0, and switches songs if needed. `SessionBridge` applies queries, mix, loop and volume when `shouldApply` holds, then clears the pending session and sets the status ("Loaded Amen session", plus notes).
  - `saveSession()` collects every snapshot, calls `buildSessionFile`, and downloads it through a Blob URL and an `<a download>`.
  - `sessionEpoch: number` (in `useSession()`), incremented on every load. `CenterStage` includes it in the `key` of the Line Staff and the Rhyme Clock, so a load for the song already open still starts both in Follow.

- [ ] **Step 1: Write the failing tests:** `loadPlan("Amen", { song: "93Til" })` → `{ switchSong: true }`; same song → `false`. `shouldApply({ song: "Amen", applied: false }, "Amen")` → `true`; mounted `"93Til"` → `false`; `applied: true` → `false`; `null` → `false`.
- [ ] **Step 2: Run** `npx vitest run src/session/__tests__/loadPlan.test.js`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the suite and `npm run build`. Expected: PASS, green.
- [ ] **Step 5: Commit** `feat(session): save and load orchestration`.

### Task 6: Header buttons

**Files:**
- Create: `src/components/Shell/SessionButtons.jsx` (+ styles in `Shell.css`)
- Modify: `src/components/Shell/AppHeader.jsx` (place `SessionButtons` before the params/queries toggles; hidden while the song is loading)
- Test: `src/components/Shell/__tests__/SessionButtons.test.jsx`

**Interfaces:**
- Consumes: `useSession()` (Task 5), `parseSessionFile` (Task 1).
- Produces: Download (icon button, title "Save this session"); Upload (icon button, title "Load a session") opening a menu with "Load demo" and "Choose file…" (a hidden `<input type="file" accept=".json,application/json">`). Esc and an outside click close the menu. A status line under the buttons shows `status` or an error for a few seconds.

- [ ] **Step 1: Write the failing test:** SSR-render `SessionButtons` with the menu open (prop `initialOpen`): two header buttons with those titles, and menu items exactly `["Load demo", "Choose file…"]`.
- [ ] **Step 2: Run.** Expected: FAIL.
- [ ] **Step 3: Implement.** Load demo fetches the demo URL (Global Constraints). On 404 the status is "No demo session yet"; on a bad file it shows the parse error.
- [ ] **Step 4: Run** the suite and `npm run build`. Then check in Chrome:
  1. Make two queries, change a color, open the clock full size.
  2. Download.
  3. Change things, then load the file: everything is back and the playhead is at 0.
  4. Load it while on another song: the song switches and the queries come back.
  5. Load demo: "No demo session yet".
  6. Load a non-JSON file: an error, and nothing changes.
- [ ] **Step 5: Commit** `feat(session): download and upload buttons in the header`. Update README (Interface: "Sessions"), the ledger and memory.
