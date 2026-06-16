# Pre-overhaul baseline — 2026-06-16

Branch: `claude/perf-playhead-decoupling` (off `master` @ f354bc6).
Captured with chrome-devtools-mcp at 1200×846 @2x DPR. Dev server: Vite @ http://localhost:5173.
No CPU/network throttling. Unit suite: **84/84 passing** before any changes.

## Scene scale (per song)

| Song   | SVG nodes | `<mask>` defs | `.word` spans | Pixi canvas |
|--------|-----------|---------------|---------------|-------------|
| 93Til  | 23,252    | 3,468         | 996           | 1           |
| Amen   | 10,207    | 1,523         | 547           | 1           |

## Playback performance trace (F1 confirmation)

Method: start trace (no reload), play via transport, ~8s+ of playback, pause, stop.
Per-second binning of main-thread `RunTask` busy time and `StyleResolver::ResolveStyle`
counts; "playback" = buckets with >5ms busy, "idle" = buckets with ≤1ms busy.

| Song   | State    | Main-thread busy | StyleResolve/s | Longest task | Tasks >16.7ms |
|--------|----------|------------------|----------------|--------------|---------------|
| 93Til  | idle     | ~0.0 ms/s        | 0              | —            | 0             |
| 93Til  | playback | **~20.8 ms/s**   | **~36/s**      | 10.4 ms      | 0             |
| Amen   | idle     | ~0.0 ms/s        | 0              | —            | 0             |
| Amen   | playback | **~20.8 ms/s**   | **~19/s**      | 2.0 ms       | 0             |

**F1 confirmed.** During playback the main thread does continuous work (~20 ms/s) with
style recalculation firing every second (more on the larger song, 93Til), while at idle
both are ~0. The work is broad-but-shallow — no single task exceeds 16.7ms; instead many
small renders recur ~60×/s. This is the signature of the whole lyrics/transport subtree
re-rendering each animation frame because `playheadTime` lives in React state and the
`AudioContext` provider value is an un-memoized object literal.

### Metric note (important for the after-comparison)
`DroppedFrame` trace events fire at ~59/s **whether playing or paused**, so they are a
compositor idle/no-new-frame artifact here, **not** a jank metric. Do NOT use dropped-frame
count as the before/after KPI. The valid KPIs are **main-thread busy ms/s during playback**
and **StyleResolver::ResolveStyle/s during playback**, both of which should drop sharply
toward their idle (~0) values after the overhaul.

Raw traces: `93Til-trace.json`, `Amen-trace.json` (same dir).

## Visual + interaction baseline (screenshots in this dir)

- `93Til-rest.png` — 93Til at rest (tapestry + lyrics).
- `Amen-rest.png` — Amen at rest (default song).
- `Amen-word-selected.png` — clicked word **"Amen?"** → query card shows `EY0 M EH1 N`,
  Rhyme/Allit/Ason tabs, **6 rhyming-word matches**; matches highlighted green
  (pen, men, Amen?×2, when, When).
- `Amen-cmdclick-rhyme.png` — Cmd+clicked match **"pen"** → anchor moved (rhyme gravity /
  `anchorOrAdopt`); active card becomes `pen P EH1 N`, R:6 A:27.
- `Amen-glyphs-randomized-SDB.png` — pressed **S / D / B** (real keys): syllable, drum, and
  bass glyphs each re-randomized (preview srcs and tapestry pattern all changed). Note: the
  syllable button is *labeled* "(R)" but the **`s`** key also randomizes it.

Interaction results (all behaved correctly, **zero console errors/warnings** the whole session):
- Click word → selection + rhyme matching + query panel populate. ✔
- Cmd+click match → anchor adopts clicked word (rhyme gravity). ✔
- Alt+click → selection removed; panel resets to "Click any word…". ✔
- S / D / B → randomize syllable / drum / bass glyphs. ✔
- Play / Pause / Stop transport + time/scrub readout. ✔

This file is the regression reference for every subsequent task in the playhead-decoupling
plan: after each task, behavior must match these screenshots/notes, and the final trace
(Task 7) must show playback busy ms/s + StyleResolve/s collapsing toward idle.
