# Paint-time overhaul — 2026-09-08 results

Branch `claude/perf-playhead-decoupling`, commits `38252c7..793f95c` (6 commits on top of
Plan A). Production builds (`vite build` + `vite preview`), Chrome 148 via chrome-devtools-mcp,
1400x900 viewport, no throttling. All numbers are **medians of alternating A/B runs in one
page** (see `../../perf-harness/README.md`); absolute values drift with machine load between
sessions, ratios are stable. 89/89 unit tests pass; `npm run build` green.

## The user-facing KPI: select 93Til -> tapestry painted (production)

| session | baseline (pre-masks) | final |
|---|---|---|
| quiet (3-way run) | 2,737 ms | **704 ms** |
| noisy (4 runs)    | 3,664 ms | **1,057 ms** |

Song-data-loaded -> tapestry painted, 93Til: 2,420 -> 623 ms (quiet), 3,202 -> 858 ms (noisy).
Amen first load (standalone reload trace, nav -> tapestry painted): 1,288 -> 713 ms;
data-loaded -> painted 1,005 -> 506 ms.

## Where the time went (production, 93Til, data-loaded -> painted, pre-fix trace)

~1.95 s wall / 1.92 s main-thread busy: FunctionCall 636 (React render + DOM creation:
`setAttribute` 175, `appendChild` 123, `createElementNS` 41), style recalc 342, compositor
Commit 241, Paint 208, PrePaint 82, Layout 76. Everything scaled with the **28k-element DOM**:
23,252 SVG nodes of which 3,468 were `<mask>` defs each wrapping a CSS-filtered `<image>`.

## Changes, each measured in isolation

1. **One shared mask + symbol per glyph layer** (`4a092bf`). Syllables, drum hits and bass
   divider toppers were 5-7 nodes each; now one `<use>` each referencing a `<symbol>` whose rect
   carries a user-space `<mask>`. Chrome does not render `<image>` inside an objectBoundingBox
   mask (probed: blank), hence the symbol indirection. Pixel-diffed against the old rendering
   with a seeded glyph pick (`visual-parity-*.png`): identical (108 px of sub-pixel edge AA).
   93Til SVG nodes 23,252 -> 5,575; masks 3,468 -> 3. data->paint 1,090 -> 711 ms.
2. **No stale-song render on switch + parallel fetch** (`04f68e3`). Select change -> fetch start
   125-182 ms -> 32-44 ms (the old-song tree was remounting under the new keys); fetch 116-326 ->
   40-155 ms (JSON x3 + audio probes + duration now concurrent).
3. **Lyrics static styles -> CSS** (`4c5f42c`). ~4,700 lyric nodes carried ~15 inline style
   props; now none at rest. data->lyrics painted 639 -> 204 ms (quiet), 2,289 -> 418 (noisy).
   Pixel-identical (0 px diff in the lyrics pane).
4. **Plan B memoization + stable audio-controls context** (`0d7e8e8`). Dev, StrictMode, 93Til,
   5 s dense playback incl. the play click: WordBlock renders 72 (was ~996 per word change),
   WordLine renders 66 (312 before the context split; ~144 per change before memo).
5. **Rules-of-hooks fix** in the three glyph components (`793f95c`).

## Functionality check (dev, 93Til, zero console errors/warnings)

Word click -> anchor + 20 rhyme matches + query card; hover -> footer phones; Cmd+click on a
tapestry glyph -> anchor adopt; Alt+click -> remove; click again -> remove + panel reset;
syllable range (2 clicks) -> 5 selected + red outlines in the tapestry + 423 matched circles;
line anchor toggle; S/D/B re-randomize all three glyph masks; play/pause/stop, current line/word
highlight, Recenter. Screenshot: `93Til-interactions-after.jpeg`.

## Remaining cost / next levers

After the changes a 93Til switch spends roughly: fetch ~40-150 ms, React render of the
lyrics tree ~100 ms, lyrics layout+paint ~100-200 ms, tapestry React render ~130 ms, SVG
style+paint ~300 ms (5.5k nodes, 3 masks rasterised per `<use>`). First load adds JIT warm-up
and Pixi/WebGL init. If more is needed: (a) lyrics windowing (Plan D), (b) inline the 180
single-path syllable shapes as `<symbol><path>` + `<use fill>` to drop the mask raster entirely
(drum/divider assets use opacity/gradients, keep masks there), (c) Plan C selection caching
for click latency.
