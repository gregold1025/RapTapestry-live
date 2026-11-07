# Rhyme Clock: design

Date: 2026-11-06. Branch `claude/rhyme-clock`. Decisions are Greg's unless marked **(builder's call)**.

## Intent

A new view of the song next to the tapestry and the Line Staff. Time wraps around a circle,
so rhymes that land at the same place in the bar line up at the same angle, across many bars
at once. It is a reading tool for rhyme placement against the groove. Most work will happen
in Freeze, studying a fixed stretch of the song.

## What it shows

- **Cycle:** one turn of the circle is one cycle, which is **1, 2 or 4 bars** (lever 1). Angle =
  position within the cycle. The cycle starts at 12 o'clock and runs clockwise **(builder's
  call, same as the old prototype)**. Beat spokes and bar spokes are drawn.
- **Rings:** each cycle of song time is one concentric ring. **Rings shown** (lever 2): **1 / 2 /
  4 / 8 / 16 / 32 / whole song**. Outer rings are earlier in the song and inner rings are later.
- **Current ring = the playhead's ring.** The ring whose cycle holds the playhead is the current
  ring, drawn a little thicker than the others. The drums show its cycle. Its position among the
  rings is an index from 0 (outermost) to rings − 1 (innermost). **The default is 0 (outermost)**,
  so by default every other ring is later.
  - The state is a window: the cycle on the outermost ring, W. With the playhead's cycle P, the
    index is P − W.
  - Two ways to set the index; both move the window, never the playhead. Grab the current ring
    and drag it inward or outward; it snaps one ring at a time. Or use a **Current ring** slider
    in the Global panel (0 to rings − 1).
  - With one ring there is nothing to move: the drag is off and the slider is hidden.
  - With whole song, every cycle has a fixed ring (W = 0). The current ring is whichever ring the
    playhead is in, and the drag and the slider are off.
- **Words:** each word sits on the ring of its cycle as an arc from its onset to its end, following
  the ring. **Pitch (F0) is ignored**: nothing moves radially with pitch.
  - **Vowel dots:** each vowel of a matched rhyme (the match's vowel span, `vi0`..`vi1`) gets a dot
    on the arc at the vowel's time, so you can read where the rhyme lands in the bar (Greg chose
    this).
  - **Text:** when the rings are far enough apart, the word's text follows its arc. When they are
    packed (Greg: 16 rings and up; the exact spacing threshold is the builder's call), only arcs
    and dots are drawn and hovering a word shows its text. Packed, it is an overview picture.
- **Words toggle:** "Show all words" or "Just query words".
  - Query and match words always use the query visual: color = the query, line style = the form
    (word solid, mosaic dashed, embedded dotted, semirhyme fine dots). Use the same per-word
    visuals as the other views (`useWordVisual`, `useLineVisual`).
  - With "Show all words", the other words take a new **default word color** setting.
  - With "Just query words", the other words are not drawn.
- **Drums:** glyphs on a band outside the outermost ring, **one cycle only: the current ring's
  cycle**, at their angle in the cycle. Each drum class or band keeps its glyph, size and
  visibility from the Drums panel. A class's "height" maps to a small radial offset within the
  band **(builder's call)**. Two clock settings (Greg): **drum glyphs on / off**, and **drum glyph size**
  (relative, like the staff's "drum glyphs" %).
- **No bass.** Other stems are not shown.
- **Playhead:** a hand from the center to the drum band that sweeps around with time. It shows
  only while the playhead is inside the visible rings, crossing the current ring.
- **Background:** a **background color** setting. The spokes and ring lines take their colors from
  that background through the existing `gridStrokes(background)` (`src/utils/gridStroke.js`),
  the same way bar and beat lines do on the tapestry and the Line Staff: bar spokes use `bar`,
  beat spokes and ring lines use `beat`, and the current ring uses `bar`, thicker.

## Follow and Freeze (mirrors the Line Staff)

- **Follow:** the window moves so the playhead's ring stays at the chosen index. When the playhead
  enters the next cycle, the rings shift by one. While playing, words and drum glyphs are revealed
  as the playhead passes them: earlier rings and the played part of the current ring are full; the
  unplayed part of the current ring and all later (inner) rings are shown **faintly** (Greg chose
  the faint preview).
- **Freeze:** the window stays put and everything in it is drawn in full. As the playhead moves on,
  it moves inward from ring to ring, and the current ring (and the index) moves with it. If it
  leaves the window, no ring is current and the hand is hidden until it comes back or the view is
  moved.
- **A plain click** (on the background or a word) seeks the playhead there **without moving the
  window**, so nothing jumps. The clicked ring becomes the current ring, and the index updates to
  match (Greg).
- **Drag around the circle** (anywhere except on the current ring) pans the window through the
  song: one full turn = one cycle, so cycles slide through the rings. It switches to Freeze and does
  not move the playhead, like a drag on the Line Staff **(builder's call; Greg did not object)**.
- The control is a Freeze / Follow segmented control in the clock's own header, like the staff's.
  Switching to Follow snaps the window back so the playhead's ring sits at the chosen index. In
  Freeze, the index slider holds the last index the playhead had in view.

## Interaction (shared rules)

Same as the tapestry and the Line Staff (README, "Clicks on the tapestry and the Line Staff"):
- a plain click on a word seeks to that word (the window stays put; see above);
- cmd-click a word queries it, cmd-shift-click extends the focused query, alt-click removes;
- hover shows the same tooltip as the other views;
- the selected match keeps its white border treatment.

**No line queries on the clock** (Greg). Line queries are made in the other views.

## Shell

- **Header:** a clock icon button directly right of the Line Staff (treble clef) button, toggles
  the clock. Disabled when the transport is (as the clef is).
- **Placement for now:** when it's on, the clock is an overlay pane in the dead center of the
  center stage, over the tapestry and the Line Staff. It is sized to fit (a square of about the
  smaller of the stage's width and height, with a margin) **(builder's call)**. It has a small
  header bar like the staff's: title, rings-shown control, Freeze / Follow, "settings ›" link to
  Global, close button.
- **UI state** (`UIStateContext`, following `staffOpen` / `staffBars`): `clockOpen`,
  `toggleClock`.
- **Global panel:** a new "Rhyme Clock" section after "Line Staff", holding the clock settings:
  cycle length (1 / 2 / 4 bars), rings shown, current ring (slider), words (all / just query),
  background color, default word color, text size, drum glyphs on / off, drum glyph size. Settings live in
  `ParamsContext` next to the staff's, except the pane switch, which goes in `UIStateContext`.
  The current ring index is clamped when rings shown shrinks.
- The tapestry gets **no** pane button. (Greg's longer-term idea: the clock and the Line Staff
  share the space under the tapestry. Not now.)

## Data

- Cycle boundaries come from the song's downbeats (`drumTranscription.downbeats`, the same grid
  as `gridTimes`). Cycle k starts at downbeat `k × cycleBars`. Angle within a cycle is linear
  between its downbeats per bar (each bar a 1/cycleBars sector, linear inside the bar), so a
  tempo drift doesn't skew the beats **(builder's call)**. Time before the first downbeat is
  ring "−1" and is not drawn.
- Word onsets and ends: the aligned timing the Line Staff uses (`timingModel`), with no F0.
- Drum hits: `useDrumHits()` / `useByClass()` and the Drums panel's classes, as `DrumsGlyphs` uses.
- **No edits to `src/engine/**`.** If something is missing, it goes to Greg.

## Constraints

- Code in `src/components/ClockPane/`; the geometry (time → cycle, ring, angle; ring window;
  reveal) in plain, tested functions (e.g. `src/utils/clockGeometry.js`). Edits to shared files
  (header, UI state, params, Global panel, CenterStage, README) stay small.
- Rendering: SVG, its own component, not part of `TapestryView` **(builder's call)**. The
  playhead hand and the reveal update per frame through refs (`subscribePlayhead`) without a
  React re-render per tick, as `ScrollController` does.
- Must stay smooth at 32 rings with "Show all words" on a full song.
- Greg's drum and bass defaults in `src/contexts/paramDefaults.js` are kept as they are.
- Process: test first (Vitest), full suite, `npm run build`, a check in a new Chrome tab on port
  5176, commit per step. Ledger in `.superpowers/sdd/rhyme-clock/progress.md`. README
  "Interface" gets the clock's behaviors. Never push or merge.

## Non-goals (for now)

- The final layout (sharing the bottom with the Line Staff); the overlay is temporary.
- The old prototype's rug ring of match ticks (the vowel dots take its place), similarity radius,
  saved queries, and a 1/16 grid.
- Bass and the "other" stem.
- Moving parameters out of Global (Greg dislikes reaching other stems' panels only through
  Global; noted, not redesigned here).

## Anti-goals

- Pitch moving words radially (Greg ruled it out).
- A chaotic picture: the pocket clock (rhymes and drums on one groove) was "very chaotic". Drums
  stay on their own outer band, one cycle only.
- Interaction rules that differ from the tapestry and Line Staff.

## Changes after the first build (Greg, 2026-11-06)

- Defaults: background black (`#000000`), words a light gray (`#9a9da5`).
- The current ring has a soft glow (a blurred stroke in the background pushed to 4.5:1 contrast).
- Dragging replaces both the current-ring drag and the circular pan: drag anywhere; inward = earlier in
  the song, outward = later, one cycle per ring gap, measured along the line through the center so it
  keeps going past it. It moves the rings, not the playhead, and freezes. It stops while every ring
  still holds song (first cycle on the rim, last cycle on the innermost ring) **(builder's call)**.
- Drum glyphs whose Drums-panel color would vanish on the clock's background (contrast < 2) take the
  clock's word color **(builder's call)**.

## Second round of changes (Greg, 2026-11-06)

- The playhead is one ring long, on the current ring: from just under its arc to the top of its text (packed rings: across the ring's band).
- The rings glide instead of snapping when the window moves: each ring's marks scale about the center from where their cycle was drawn to its new ring (time constant 70 ms, at most one ring behind); a margin ring on each side fades in or out past the rim and the inner ring. Ring lines stay put.
- Labels run clockwise along the ring everywhere (upside down on the lower half).
- Placement: a band under the tapestry, height = half its width (capped so the tapestry keeps at least 30% of the stage, 140 px minimum). The clock takes a square in the bottom-right corner, the Line Staff the rest; the clock keeps its corner without the Line Staff (the left half stays empty, so the tapestry does not reflow), and the Line Staff takes the whole band without the clock. A header button next to × makes the clock full size over the whole stage, and back.

## Third round (Greg, 2026-11-06)

- Follow keeps the playhead's ring in the middle: with an even count of rings, the larger (outer) of the two middle rings (index ceil(n/2) − 1). The current-ring slider is gone; Freeze still lets the current ring move, and Follow brings it back.
- The hand runs from the center through the drum band again. The ring glide is dropped (to be discussed later); labels stay clockwise along the ring.
- The band under the tapestry is the Line Staff's original 44% of the stage; the clock is a square of that height in the bottom-right corner.
- Line Staff: default background `#1c1c1c`, words white; while following, only glyph layers are revealed with the playhead (the grid and loop always show); drums that would vanish on its background take its word color.

## Fourth round (Greg, 2026-11-06)

- The rings are one spiral, a turn per cycle: radius = rOuter − (ring + frac) × (rOuter − rInner) / rings, so a turn ends where the next begins and bar lines and words run on across 12 o'clock. One ring alone stays a circle on the rim. The nearest turn under the pointer is found at its angle.
- The Line Staff and Rhyme Clock header bars are both 35 px tall.

## Line queries (Greg, 2026-11-06)

- Not made on the clock, but shown: each queried or matched line (visualByLineIdx) colors its stretch of the spiral (first word's start to last word's end; width 70% of the turn gap, 1.5–4 px, 60% opacity, under the words).
- Its rhyming end comes up as query words: the query line's last three words (engine endUnits, the extent of a line query), a matched line's matched words with the match's form dash and rhyme-vowel dots (sylRange). Word-query visuals win over line-query words.

## One ring and drums (Greg, 2026-11-06)

- One ring: starts at 0.9 × rOuter and steps in 0.05 × rOuter over its turn, so its end clears its start (not to the center).
- Drums: on / off only (the size setting is gone). Fixed size = each class's Drums-panel size × 1.2 (Greg's 150% clock setting × the Drums panel's 80%), full opacity, never faint. Centers at rOuter + 4 + size/2 + height% × 30 px. The drum band is a fixed 36 px; rOuter = side/2 − 6 − 36 so the glyphs fit in the window.

## The expanding spiral (Greg, 2026-11-06)

- Ends: one ring from 0.9 × rOuter to 2/3 × rOuter; two rings from the rim to rOuter/3; more rings from the rim to the inner hole (0.18 × rOuter).
- The window W is continuous (cycles, fractional): the song position at the spiral's outer end. A mark at song position u = cycle + frac sits at angle frac and radius r0 − (u − W) × pitch, so as W grows the spiral expands outward without turning.
- Follow: W = U(t) − (followIndex + 0.5), so the playhead stays halfway round the middle ring. Freeze holds W; a drag pans it continuously (one cycle per turn gap), never jumping from where it started.
- The ends fade over min(0.35, rings/4) turns (the spiral's line in 8 stepped pieces per end; marks by their middle), so new material fades in at the inner end and old fades out at the outer end; the ends sweep round with the playhead.
- Drawing: components render elements carrying song positions (data-u0/u1, data-u); clockDraw redraws them when W moves, every frame while following. React re-renders only when W crosses a whole cycle or the playhead enters a new cycle (drums, glow).
- The glow is the playhead's cycle P where it lies on the visible stretch; drums are P's.
