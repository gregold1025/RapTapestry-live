# Lyrics Render-Path Memoization (Plan B, focused) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make a word/line change during playback re-render only the ~2 affected `WordLine`s and ~2 affected `WordBlock`s instead of all 144 + 996 (93Til), with all functionality preserved.

**Architecture:** `React.memo` the two lyric components, after making their props referentially stable: stabilize the hover callbacks (`useCallback`), drop the dead `hoverData` prop, and replace the global `currentWordId` prop (which changes for every line on every word change) with a per-line `currentWordIdx` that changes only for the 1–2 transitioning lines. This is the payoff of Plan A (which removed the per-frame provider churn that previously made memoization useless).

**Tech Stack:** React 18 + Vite, Vitest (unit), chrome-devtools-mcp (browser/render-count verification).

**Branch:** Continue on the existing `claude/perf-playhead-decoupling` (Plan A is unmerged there; Plan A + B land together). Do NOT create a new branch.

**Spec:** `docs/superpowers/specs/2026-06-16-lyrics-memoization-design.md`.

## Global Constraints

- Plain ASCII quotes only — no smart/curly quotes (the Write tool can introduce them).
- Preserve ALL functionality; verify against the Plan A baseline at `docs/superpowers/baselines/2026-06-16/`.
- `npx vitest run` must stay green (89/89) after every task.
- `npm run build` must succeed after every task.
- End every commit message body with: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- These are refactors with no new unit-testable logic; per-task verification is build + (for behavior) browser check by the coordinator. The decisive metric is React render COUNT (Task 5), NOT trace busy-time.

---

## Task 1: Stabilize the hover callbacks

**Files:**
- Modify: `src/components/LyricsView/hooks/useHoverInfo.js` (full rewrite)

**Interfaces:**
- Produces: `useHoverInfo()` returns `{ hoverData, setWordHover, setSyllableHover, clearHover }` where the three setters are now **stable across renders** (`useCallback`, `[]` deps). Same call signatures and behavior as before. `hoverData` is unchanged (`null` or `{type, ...}`).

**Why:** `setWordHover`/`setSyllableHover`/`clearHover` are currently plain functions recreated every render. They are passed down to the (soon-to-be) memoized `WordLine`/`WordBlock`; if their identity changes every `LyricsView` render, `React.memo` never bites. Stabilizing them is a prerequisite. Behavior is identical.

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `src/components/LyricsView/hooks/useHoverInfo.js` with:
```js
// src/components/LyricsView/hooks/useHoverInfo.js
import { useState, useCallback } from "react";

export function useHoverInfo() {
  const [hoverData, setHoverData] = useState(null);

  const setWordHover = useCallback((word) => {
    const phones = word?.phones?.join(" ") || "";
    setHoverData({
      type: "word",
      text: word?.text,
      phones,
    });
  }, []);

  const setSyllableHover = useCallback(
    ({ vowel, syllableIndex, totalSyllables, phones }) => {
      setHoverData({
        type: "syllable",
        vowel,
        syllableIndex,
        totalSyllables,
        phones,
      });
    },
    []
  );

  const clearHover = useCallback(() => {
    setHoverData(null);
  }, []);

  return { hoverData, setWordHover, setSyllableHover, clearHover };
}
```
(`setHoverData` from `useState` is guaranteed stable, so `[]` deps are correct. The previous commented-out `console.log` lines are dropped as dead code.)

- [ ] **Step 2: Verify build + tests**

Run: `npx vitest run` — Expected: 89 passed.
Run: `npm run build` — Expected: build succeeds (only the pre-existing >500kB chunk-size advisory).

- [ ] **Step 3: Commit**

```bash
git add src/components/LyricsView/hooks/useHoverInfo.js
git commit -m "refactor(perf): stabilize useHoverInfo callbacks with useCallback"
```
(Coordinator will browser-verify hover after later tasks; this change is behavior-identical.)

---

## Task 2: Drop the dead `hoverData` prop from the WordLine -> WordBlock chain

**Files:**
- Modify: `src/components/LyricsView/WordBlock.jsx` (signature)
- Modify: `src/components/LyricsView/WordLine.jsx` (signature + the WordBlock pass)
- Modify: `src/components/LyricsView/index.jsx` (the WordLine pass)

**Interfaces:**
- `WordBlock` no longer accepts `hoverData`. `WordLine` no longer accepts or forwards `hoverData`.
- `LyricsView` keeps `hoverData` in scope (from `useHoverInfo`) for the footer `<HoverDisplay hoverData={hoverData} />` — that is unchanged.

**Why:** `WordBlock` destructures `hoverData` but never reads it; `WordLine` only forwards it. Removing it eliminates a prop we would otherwise have to keep stable for `React.memo`.

- [ ] **Step 1: WordBlock — remove `hoverData` from the signature**

In `src/components/LyricsView/WordBlock.jsx`, the current signature is:
```jsx
export function WordBlock({
  word,
  lineIdx,
  wordIdx,
  isCurrent,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
}) {
```
Remove the `hoverData,` line so it becomes:
```jsx
export function WordBlock({
  word,
  lineIdx,
  wordIdx,
  isCurrent,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
}) {
```

- [ ] **Step 2: WordLine — remove `hoverData` from the signature and the WordBlock pass**

In `src/components/LyricsView/WordLine.jsx`, the current signature (lines 17-27) is:
```jsx
export function WordLine({
  line,
  lineIdx,
  isCurrent,
  currentWordId,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx,
}) {
```
Remove the `hoverData,` line:
```jsx
export function WordLine({
  line,
  lineIdx,
  isCurrent,
  currentWordId,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx,
}) {
```
And in the `line.words?.map(...)` (lines 100-112), remove the `hoverData={hoverData}` line from the `<WordBlock>`:
```jsx
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            isCurrent={`${lineIdx}-${wordIdx}` === currentWordId}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
```

- [ ] **Step 3: LyricsView — stop passing `hoverData` to WordLine**

In `src/components/LyricsView/index.jsx`, the `lines.map(...)` (lines 104-116) currently passes `hoverData={hoverData}` to `<WordLine>`. Remove that one line so it becomes:
```jsx
        {lines.map((line, idx) => (
          <WordLine
            key={idx}
            line={line}
            lineIdx={idx}
            isCurrent={idx === currentLineIndex}
            currentWordId={currentWordId}
            onWordHover={setWordHover}
            onSyllableHover={setSyllableHover}
            onHoverEnd={clearHover}
            dataLineIdx={idx}
          />
        ))}
```
Do NOT remove the `hoverData` destructure on line 20 — `<HoverDisplay hoverData={hoverData} />` in the footer still uses it.

- [ ] **Step 4: Verify build + tests**

Run: `npx vitest run` — Expected: 89 passed.
Run: `npm run build` — Expected: success.
Grep check: `grep -n "hoverData" src/components/LyricsView/WordLine.jsx src/components/LyricsView/WordBlock.jsx` — Expected: no matches in either file.

- [ ] **Step 5: Commit**

```bash
git add src/components/LyricsView/WordBlock.jsx src/components/LyricsView/WordLine.jsx src/components/LyricsView/index.jsx
git commit -m "refactor(perf): drop unused hoverData prop from WordLine/WordBlock"
```

---

## Task 3: Per-line current-word prop

**Files:**
- Modify: `src/components/LyricsView/index.jsx` (derive per-line value + the WordLine pass)
- Modify: `src/components/LyricsView/WordLine.jsx` (consume `currentWordIdx` instead of `currentWordId`)

**Interfaces:**
- `WordLine` now takes `currentWordIdx` (a number; the index of the current word within THIS line, or `-1`) instead of `currentWordId`. It computes each child's `isCurrent` as `wordIdx === currentWordIdx`.
- `LyricsView` derives `currentWordLineIdx` and `currentWordIdxInLine` from `currentWordId` and passes `currentWordIdx={idx === currentWordLineIdx ? currentWordIdxInLine : -1}` per line.

**Why:** Today `currentWordId` (one global value) is passed to all 144 `WordLine`s, so every word change changes a prop on every line — a memoized `WordLine` would still re-render. The per-line value is stable (`-1`) for all lines except the 1–2 holding/losing the current word.

- [ ] **Step 1: LyricsView — derive the per-line value**

In `src/components/LyricsView/index.jsx`, immediately after line 25:
```js
  const { currentLineIndex, currentWordId } = useCurrentPlayheadIds(lines);
```
add:
```js
  // currentWordId is "lineIdx-wordIdx" (or null). Split it once so each WordLine
  // gets a stable per-line value: the current word's index if the current word is
  // in THAT line, else -1. The line is derived from currentWordId itself (not from
  // currentLineIndex) so word- and line-highlights stay independently correct.
  const [currentWordLineIdx, currentWordIdxInLine] = currentWordId
    ? currentWordId.split("-").map(Number)
    : [-1, -1];
```

- [ ] **Step 2: LyricsView — pass `currentWordIdx` instead of `currentWordId`**

In the `lines.map(...)` (the `<WordLine>` from Task 2 Step 3), replace the `currentWordId={currentWordId}` line with `currentWordIdx={...}`:
```jsx
        {lines.map((line, idx) => (
          <WordLine
            key={idx}
            line={line}
            lineIdx={idx}
            isCurrent={idx === currentLineIndex}
            currentWordIdx={idx === currentWordLineIdx ? currentWordIdxInLine : -1}
            onWordHover={setWordHover}
            onSyllableHover={setSyllableHover}
            onHoverEnd={clearHover}
            dataLineIdx={idx}
          />
        ))}
```

- [ ] **Step 3: WordLine — consume `currentWordIdx`**

In `src/components/LyricsView/WordLine.jsx`, change the signature: replace `currentWordId,` with `currentWordIdx,`:
```jsx
export function WordLine({
  line,
  lineIdx,
  isCurrent,
  currentWordIdx,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx,
}) {
```
And in the `line.words?.map(...)`, change the `isCurrent` computation on the `<WordBlock>` from `isCurrent={`${lineIdx}-${wordIdx}` === currentWordId}` to `isCurrent={wordIdx === currentWordIdx}`:
```jsx
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            isCurrent={wordIdx === currentWordIdx}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
```

- [ ] **Step 4: Verify build + tests**

Run: `npx vitest run` — Expected: 89 passed.
Run: `npm run build` — Expected: success.
Grep check: `grep -n "currentWordId" src/components/LyricsView/WordLine.jsx` — Expected: no matches (it now uses `currentWordIdx`).

- [ ] **Step 5: Commit**

```bash
git add src/components/LyricsView/index.jsx src/components/LyricsView/WordLine.jsx
git commit -m "refactor(perf): per-line currentWordIdx prop (stable for non-current lines)"
```

(Coordinator browser-verifies in Task 5 that the current-word highlight still tracks identically.)

---

## Task 4: React.memo WordBlock and WordLine

**Files:**
- Modify: `src/components/LyricsView/WordBlock.jsx` (wrap export in `React.memo`)
- Modify: `src/components/LyricsView/WordLine.jsx` (import `memo`, wrap export)

**Interfaces:**
- `WordBlock` and `WordLine` remain named exports with identical props; they are now memoized so they skip re-render when their props are shallow-equal. Context-driven re-renders (selection/params changes) still occur correctly because `React.memo` does not block context updates.

- [ ] **Step 1: WordBlock — wrap in React.memo**

In `src/components/LyricsView/WordBlock.jsx`, `React` is already imported (`import React, { useMemo } from "react";`). Change the declaration from:
```jsx
export function WordBlock({
```
to:
```jsx
export const WordBlock = React.memo(function WordBlock({
```
and change the final closing of the component from:
```jsx
  );
}
```
(the last two lines of the file) to:
```jsx
  );
});
```

- [ ] **Step 2: WordLine — import `memo` and wrap**

In `src/components/LyricsView/WordLine.jsx`, change the React import (line 2) from:
```jsx
import { useState, useMemo } from "react";
```
to:
```jsx
import { useState, useMemo, memo } from "react";
```
Change the declaration from:
```jsx
export function WordLine({
```
to:
```jsx
export const WordLine = memo(function WordLine({
```
and change the final closing of the component from:
```jsx
    </div>
  );
}
```
(the last lines of the file) to:
```jsx
    </div>
  );
});
```

- [ ] **Step 3: Verify build + tests**

Run: `npx vitest run` — Expected: 89 passed.
Run: `npm run build` — Expected: success.

- [ ] **Step 4: Commit**

```bash
git add src/components/LyricsView/WordBlock.jsx src/components/LyricsView/WordLine.jsx
git commit -m "perf: React.memo WordLine and WordBlock (lyrics render-path)"
```

---

## Task 5: Render-count verification + full functionality pass (coordinator)

This task is performed by the coordinator (needs the dev server + chrome-devtools-mcp). It adds temporary instrumentation, measures, removes it, and runs the functional regression.

**Files:**
- Temporary (added then reverted): `src/components/LyricsView/WordBlock.jsx`, `src/components/LyricsView/WordLine.jsx`
- Create: `docs/superpowers/baselines/2026-06-16/results-planB.md`

- [ ] **Step 1: Add temporary render counters**

At the very top of the `WordBlock` function body, add:
```jsx
  if (typeof window !== "undefined") window.__wbRenders = (window.__wbRenders || 0) + 1;
```
At the very top of the `WordLine` function body, add:
```jsx
  if (typeof window !== "undefined") window.__wlRenders = (window.__wlRenders || 0) + 1;
```

- [ ] **Step 2: Measure after-render counts**

Start the dev server (`npm --prefix <repo> run dev`). In the browser (chrome-devtools-mcp), load 93Til, then run a 5s playback window while resetting and reading `window.__wbRenders` and `window.__wlRenders` (both at song start and at a dense section ~30s). StrictMode is on, so counts are doubled — that is consistent with the Plan A "before" numbers.

Expected: per word change, only ~2 `WordBlock` and ~2 `WordLine` renders (vs Plan A's ~996 WordBlock per word change). Concretely, over a dense ~5s window expect the WordBlock render rate to drop by ~1–2 orders of magnitude versus the Plan A `results.md` dense figure (~6000/sec). If it does NOT drop, a prop is still unstable — inspect which (likely a callback or an inline object) before proceeding.

- [ ] **Step 3: Remove the instrumentation**

Revert both temporary counter lines: `git checkout -- src/components/LyricsView/WordBlock.jsx src/components/LyricsView/WordLine.jsx` (only the counters are uncommitted at this point). Confirm: `grep -rn "__wbRenders\|__wlRenders" src` — Expected: no matches.

- [ ] **Step 4: Full functional regression (both songs)**

Reload the clean build. For 93Til and Amen, verify against the Plan A baseline screenshots/notes, with ZERO console errors:
- Current line + current word highlight track the playhead.
- Hover a word / a syllable -> footer `HoverDisplay` shows the info; clears on mouse-leave.
- Click a word -> selection + rhyme/allit/assonance matches + query panel.
- Cmd+click a match -> anchor adopt (rhyme gravity). Alt+click -> remove.
- S / D / B -> randomize syllable / drum / bass glyphs.
- Follow-scroll recenters; user scroll disables; Recenter re-enables.

- [ ] **Step 5: Full unit suite + build**

Run: `npx vitest run` — Expected: 89 passed.
Run: `npm run build` — Expected: success.

- [ ] **Step 6: Record results + commit**

Write `docs/superpowers/baselines/2026-06-16/results-planB.md` with the before (Plan A) vs after WordBlock/WordLine render counts and a one-line confirmation of each interaction. Then:
```bash
git add docs/superpowers/baselines/2026-06-16/results-planB.md
git commit -m "docs(perf): record Plan B lyrics-memoization before/after render counts"
```

---

## Self-review notes (author)

- **Spec coverage:** Change 1 -> Task 1; Change 2 -> Task 2; Change 3 -> Task 3; Change 4 -> Task 4; Change 5 (verification) -> Task 5. All covered.
- **Type/name consistency:** `currentWordIdx` (number, -1 default) introduced in Task 3 and consumed in the same task's WordLine edit; `currentWordId` fully removed from WordLine by end of Task 3. `useHoverInfo` setters keep identical signatures (Task 1). `React.memo`/`memo` wrapping keeps the named exports `WordLine`/`WordBlock` (Task 4) so importers are unchanged.
- **Ordering rationale:** 1 (stable callbacks) and 2 (drop dead prop) and 3 (per-line prop) must precede 4 (memo) or the memo would not bite. Each of 1–3 is independently behavior-preserving and reviewable. 5 measures the payoff.
- **Out of scope (per spec):** context-value memoization, the DrumsGlyphs/SyllableGlyphs conditional-hook fix, glyph memoization, inline-styles->CSS.
