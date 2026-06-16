# Plan B (focused) — Lyrics render-path memoization

**Status:** Design approved 2026-06-16. Next: implementation plan (subagent-driven).
**Branch context:** continues on `claude/perf-playhead-decoupling` (Plan A complete). Plan B may
share the branch or get its own — decided at planning time.

## Background

Plan A (playhead decoupling) decoupled the high-frequency playhead from React state and proved,
by render-count measurement, that its lyrics value is **gated on memoization**: after Plan A, a
word/line change re-renders `LyricsView`, which re-creates all 144 `WordLine`s and all 996
`WordBlock`s (93Til) because none are `React.memo`'d. Plan A removed the per-frame provider churn
that previously made memoization impossible. Plan B cashes in that win.

Measured baseline to beat (93Til, per word/line change during playback): ~144 `WordLine` renders +
~996 `WordBlock` renders. Target: **~2 + ~2**.

## Goal

During playback, a word/line transition re-renders only the ~2 affected `WordLine`s and ~2
affected `WordBlock`s. **All functionality preserved** (highlight tracking, hover, selection +
rhyme/allit/assonance matching, Cmd/Alt-click, S/D/B, follow-scroll/recenter), both songs, zero
console errors, 89 unit tests still green.

## Approach (chosen: A)

`React.memo` on `WordLine` and `WordBlock`, plus a prop restructure so a single global
`currentWordId` no longer forces every `WordLine` to re-render. Rejected alternatives: B (memo
`WordBlock` only — leaves 144 cheap `WordLine` re-renders); C (imperative DOM class toggle —
bigger architectural change, bypasses React; deferred to a possible Plan D).

## Changes

### 1. Stabilize hover callbacks — `src/components/LyricsView/hooks/useHoverInfo.js`
Wrap `setWordHover`, `setSyllableHover`, `clearHover` in `useCallback` (currently plain functions
recreated every render). Without this, every `LyricsView` re-render hands memoized children new
callback identities and the memo never bites. `hoverData` state is unchanged (already stable during
playback — no hover events fire while the user isn't hovering).

### 2. Drop the dead `hoverData` prop — `WordLine.jsx`, `WordBlock.jsx`, `LyricsView/index.jsx`
`WordBlock` destructures `hoverData` but never reads it; confirm `WordLine` doesn't either. Remove
it from both component signatures and stop passing it `LyricsView → WordLine → WordBlock`.
`LyricsView` keeps `hoverData` for the footer `HoverDisplay` (unchanged).

### 3. Per-line current-word prop — `LyricsView/index.jsx`, `WordLine.jsx`
`useCurrentPlayheadIds` returns `currentWordId = `${lineIdx}-${wordIdx}``. In `LyricsView`, parse it
once into `currentWordLineIdx` and `currentWordIdxInLine` (derive the line from `currentWordId`
itself, NOT from `currentLineIndex`, so the two stay independently correct). In `lines.map`, pass
each `WordLine`:
`currentWordIdx={idx === currentWordLineIdx ? currentWordIdxInLine : -1}` (replaces the global
`currentWordId` prop). 142 lines get a stable `-1`; only the 2 transitioning lines see a change.
`WordLine` computes each child's `isCurrent` as `wordIdx === currentWordIdx`. The line-level
`isCurrent={idx === currentLineIndex}` prop is unchanged (already flips for only 2 lines).

### 4. `React.memo` on `WordLine` and `WordBlock`
Wrap both (e.g. `export const WordBlock = React.memo(function WordBlock(props){...})`). After
changes 1–3 their props are all stable or primitive:
- `WordLine`: `line`, `lineIdx`, `isCurrent`, `currentWordIdx`, `onWordHover`, `onSyllableHover`,
  `onHoverEnd`, `dataLineIdx`.
- `WordBlock`: `word`, `lineIdx`, `wordIdx`, `isCurrent`, `onWordHover`, `onSyllableHover`,
  `onHoverEnd`.
Context reads inside (`useWordSelection`/`useParams`/`useSyllableSelection`) are identity-stable
during playback (providers sit above `LyricsView` and don't re-render then), so memo holds. On real
user interactions those context values DO change, so memo'd components re-render correctly — this is
the desired behavior and must be verified, not bypassed.

### 5. Verification
- **Render counts** (temporary `window.__wbRenders` / `window.__wlRenders` counters in the
  component bodies, measured over a fixed playback window on 93Til, then removed): word change →
  ~2 `WordBlock` + ~2 `WordLine` renders (was ~996 + ~144). This measurement also confirms the
  contexts were stable (if memo bites, they were).
- **Unit tests:** 89/89 pass. **Build:** green.
- **Browser, both songs (93Til + Amen), zero console errors**, all vs the Plan A baseline
  (`docs/superpowers/baselines/2026-06-16/`): current line + word highlight track the playhead;
  hover updates `HoverDisplay`; word/line/syllable selection + rhyme/allit/assonance matching;
  Cmd+click rhyme-gravity; Alt+click remove; S/D/B randomize; follow-scroll + Recenter.

## Out of scope (deferred)
- Context-value memoization/splitting (providers don't re-render during playback — not needed for
  this win).
- `DrumsGlyphs`/`SyllableGlyphs` conditional-hook-ordering fix (a real rules-of-hooks bug, but
  unrelated to the lyrics win — flag for a separate targeted fix).
- Glyph builder memoization; inline-styles → CSS. (Original Plan B breadth, revisit after this.)

## Risks
- A memoized child silently breaking because some prop is an unstable inline object/function. After
  changes 1–3 every prop is primitive or a stable callback; the render-count measurement is the
  guard — if a count doesn't drop to ~2, a prop is still unstable.
- Interaction correctness under memo: selection/params changes must still repaint affected words.
  Verified via the browser interaction pass (context changes bypass `React.memo` by design).
- No new unit tests: memoization is behavior-preserving and not cleanly unit-testable here;
  verification is render-count + browser, consistent with Plan A.
