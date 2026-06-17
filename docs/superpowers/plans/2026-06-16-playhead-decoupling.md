# Playhead Decoupling (P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the audio playhead from re-rendering the entire React tree ~60×/second, while preserving every visual and interactive behavior exactly.

**Architecture:** Move the high-frequency `playheadTime` out of React state into a `useRef` + a tiny pub/sub store inside `AudioProvider`. Consumers that genuinely need per-frame updates (the Pixi playhead line, the transport clock/slider) subscribe and update imperatively or in an isolated leaf. Consumers that only need *which* line/word is current derive a low-frequency id that changes ~2–4×/sec, not 60fps. Consumers that don't use time at all (drum grid/glyphs) drop the subscription entirely.

**Tech Stack:** React 18 + Vite, `@pixi/react` v8, Vitest (unit), chrome-devtools-mcp (browser/perf verification).

**Scope:** This is Plan A of a 4-part overhaul. Plans B (context memoization/splitting), C (selection-compute caching), and D (virtualization/DOM weight) are written separately once Plan A's baseline confirms the approach. See "Roadmap" at the end.

---

## Pre-flight: branch + baseline (Task 0)

This task is a hard gate. Do not start Task 1 until the baseline artifacts exist, because "preserve functionality" is only verifiable against a recorded before-state.

**Files:**
- Create: `docs/superpowers/baselines/2026-06-16/` (screenshots, trace notes)

- [ ] **Step 1: Confirm chrome-devtools-mcp is attached**

The tools `mcp__chrome-devtools__*` (or similar) must be available. If not, run in a terminal:
`claude mcp add -s user chrome-devtools -- npx chrome-devtools-mcp@latest` and restart.
Expected: browser tools appear in the tool list.

- [ ] **Step 2: Create the work branch**

Run:
```bash
git -C /Users/gregorygold/Desktop/Rap-Tapestry/my-tapestry-refactor checkout claude/codebase-improvements
git -C /Users/gregorygold/Desktop/Rap-Tapestry/my-tapestry-refactor checkout -b claude/perf-playhead-decoupling
```
Expected: on new branch `claude/perf-playhead-decoupling`.

- [ ] **Step 3: Start the dev server (background)**

Run: `npm run dev` (background) in `my-tapestry-refactor/`. Note the localhost URL.
Expected: Vite serves the app (typically http://localhost:5173).

- [ ] **Step 4: Capture the visual + behavior baseline**

Using chrome-devtools-mcp, for song **93Til** (the largest — switch via the header `<select>`):
1. Screenshot both panes at rest.
2. Record a performance trace while: pressing Space to play for ~8s, then Space to pause.
3. Note from the trace: scripting time %, longest task (ms), and dropped-frame count during playback.
4. Repeat the play/pause trace for **Amen** (default).
5. Screenshot after: select a word (click its text), Cmd+click a rhyme match, Alt+click to remove, press S then D then B.

Save screenshots + a short `baseline.md` (the three trace numbers per song, plus a one-line description of each interaction's observed result) under `docs/superpowers/baselines/2026-06-16/`.
Expected: a recorded before-state. **The playback trace should show the whole tapestry/lyrics repainting every frame** — this is the F1 confirmation.

- [ ] **Step 5: Commit the baseline**

```bash
git add docs/superpowers/baselines/2026-06-16
git commit -m "chore(perf): capture pre-overhaul baseline (screenshots + traces)"
```

---

## Task 1: Playhead store in AudioProvider (ref + pub/sub)

**Files:**
- Create: `src/utils/__tests__/findCurrentIndex.test.js`
- Create: `src/utils/findCurrentIndex.js`
- Modify: `src/contexts/AudioContext.jsx` (full rewrite of the time path)

- [ ] **Step 1: Write the failing test for the current-index helper**

This pure helper is what replaces the per-frame `isCurrent` comparisons. It returns the index of the interval `[starts[i], ends[i])` containing `t`, or `-1`.

Create `src/utils/__tests__/findCurrentIndex.test.js`:
```js
import { describe, it, expect } from "vitest";
import { findCurrentIndex } from "../findCurrentIndex";

describe("findCurrentIndex", () => {
  const starts = [0, 1, 2, 4];
  const ends   = [1, 2, 3, 5];

  it("returns -1 before the first start", () => {
    expect(findCurrentIndex(starts, ends, -0.5)).toBe(-1);
  });
  it("returns the containing interval", () => {
    expect(findCurrentIndex(starts, ends, 0.0)).toBe(0);
    expect(findCurrentIndex(starts, ends, 1.5)).toBe(1);
    expect(findCurrentIndex(starts, ends, 2.9)).toBe(2);
    expect(findCurrentIndex(starts, ends, 4.2)).toBe(3);
  });
  it("returns -1 inside a gap between intervals", () => {
    expect(findCurrentIndex(starts, ends, 3.5)).toBe(-1);
  });
  it("treats end as exclusive", () => {
    expect(findCurrentIndex(starts, ends, 1.0)).toBe(1);
  });
  it("handles empty input", () => {
    expect(findCurrentIndex([], [], 1)).toBe(-1);
  });
});
```

- [ ] **Step 2: Run it to verify failure**

Run: `npx vitest run src/utils/__tests__/findCurrentIndex.test.js`
Expected: FAIL ("findCurrentIndex is not a function" / module not found).

- [ ] **Step 3: Implement the helper**

Create `src/utils/findCurrentIndex.js`:
```js
/**
 * Binary-search the index of the interval [starts[i], ends[i]) containing t.
 * `starts` must be ascending. Returns -1 if t is before all intervals or in a gap.
 * O(log n) — safe to call every animation frame.
 */
export function findCurrentIndex(starts, ends, t) {
  const n = starts.length;
  if (!n) return -1;
  let lo = 0;
  let hi = n - 1;
  // largest i with starts[i] <= t
  while (lo < hi) {
    const mid = (lo + hi + 1) >>> 1;
    if (starts[mid] <= t) lo = mid;
    else hi = mid - 1;
  }
  if (t < starts[lo]) return -1;
  return t < ends[lo] ? lo : -1;
}
```

- [ ] **Step 4: Run it to verify pass**

Run: `npx vitest run src/utils/__tests__/findCurrentIndex.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Rewrite AudioContext's time path to ref + pub/sub**

Replace the entire contents of `src/contexts/AudioContext.jsx` with:
```jsx
// src/contexts/AudioContext.jsx
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

const AudioContext = createContext();

export function AudioProvider({ audioFiles, children }) {
  const audioRefs = useRef({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(null);

  // High-frequency playhead time lives OUTSIDE React state.
  const playheadRef = useRef(0);
  const subscribersRef = useRef(new Set());

  // Notify all subscribers with the current playhead time.
  const emitPlayhead = useCallback((t) => {
    playheadRef.current = t;
    subscribersRef.current.forEach((cb) => cb(t));
  }, []);

  /** Subscribe to per-frame playhead updates. Returns an unsubscribe fn. */
  const subscribePlayhead = useCallback((cb) => {
    subscribersRef.current.add(cb);
    cb(playheadRef.current); // prime with current value
    return () => subscribersRef.current.delete(cb);
  }, []);

  /** Read the latest playhead time imperatively (no re-render). */
  const getPlayheadTime = useCallback(() => playheadRef.current, []);

  // Create <audio> elements from passed-in file paths
  useEffect(() => {
    const refs = {};
    for (let [key, src] of Object.entries(audioFiles)) {
      refs[key] = new Audio(src);
    }
    audioRefs.current = refs;

    const onMeta = () => setDuration(refs.vocals?.duration || 0);
    refs.vocals?.addEventListener("loadedmetadata", onMeta);
    return () => refs.vocals?.removeEventListener("loadedmetadata", onMeta);
  }, [audioFiles]);

  // rAF loop: update ref + emit to subscribers. NO setState here.
  useEffect(() => {
    if (!isPlaying) return;
    let frameId;
    const tick = () => {
      const current = audioRefs.current.vocals?.currentTime || 0;
      emitPlayhead(current);
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isPlaying, emitPlayhead]);

  // Controls
  const playAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => a.play());
    setIsPlaying(true);
  }, []);

  const pauseAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => a.pause());
    setIsPlaying(false);
  }, []);

  const stopAll = useCallback(() => {
    Object.values(audioRefs.current).forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setIsPlaying(false);
    emitPlayhead(0);
  }, [emitPlayhead]);

  const seekAll = useCallback(
    (time) => {
      Object.values(audioRefs.current).forEach((a) => {
        a.currentTime = time;
      });
      emitPlayhead(time);
    },
    [emitPlayhead]
  );

  // Memoized value — identity now changes only on isPlaying/duration changes,
  // NOT every frame. (All functions are stable via useCallback.)
  const value = useMemo(
    () => ({
      audioRefs,
      isPlaying,
      duration,
      playAll,
      pauseAll,
      stopAll,
      seekAll,
      subscribePlayhead,
      getPlayheadTime,
    }),
    [
      isPlaying,
      duration,
      playAll,
      pauseAll,
      stopAll,
      seekAll,
      subscribePlayhead,
      getPlayheadTime,
    ]
  );

  return (
    <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
  );
}

export function useAudioEngine() {
  return useContext(AudioContext);
}

/**
 * Subscribe to per-frame playhead time and run an imperative callback.
 * The callback does NOT trigger React re-renders — use it to mutate refs/DOM.
 * `cb` should be stable (wrap in useCallback) or include in deps.
 */
export function usePlayheadSubscription(cb, deps = []) {
  const { subscribePlayhead } = useAudioEngine();
  useEffect(() => {
    return subscribePlayhead(cb);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribePlayhead, ...deps]);
}
```

NOTE: this removes `playheadTime` and `setPlayheadTime` from the context value. Tasks 2–5 migrate every consumer; the app will not compile cleanly until those are done. Do Tasks 2–5 before running the browser.

- [ ] **Step 6: Run the unit suite (no regressions in pure logic)**

Run: `npx vitest run`
Expected: existing 84 tests + 5 new = PASS. (Component compile errors don't affect vitest unit runs of util files.)

- [ ] **Step 7: Commit**

```bash
git add src/utils/findCurrentIndex.js src/utils/__tests__/findCurrentIndex.test.js src/contexts/AudioContext.jsx
git commit -m "feat(perf): move playhead to ref+pubsub store in AudioProvider"
```

---

## Task 2: Pixi playhead line subscribes imperatively

**Files:**
- Modify: `src/components/TapestryView/global/pixiPlayheadOverlay.jsx:12-40`

- [ ] **Step 1: Update the import line (line 2)**

```jsx
import React, { useRef, useEffect, useCallback } from "react";
```

- [ ] **Step 2: Rewrite `PlayheadLine` to draw from a subscription, not state**

Replace the `PlayheadLine` function (lines 12–40) with:
```jsx
export function PlayheadLine() {
  const { subscribePlayhead, getPlayheadTime } = useAudioEngine();
  const { layout } = useTapestryLayout();
  const graphicsRef = useRef(null);

  // Keep the latest layout in a ref so the subscription closure stays stable.
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const draw = useCallback((t) => {
    const lay = layoutRef.current;
    const g = graphicsRef.current;
    if (!lay || !g) return;
    const { rowHeight, timeToPixels } = lay;
    const { x: currentX, y: currentY } = timeToPixels(t);
    g.clear();
    g.setStrokeStyle({ width: 3, color: 0xff0000, alpha: 1 });
    g.moveTo(currentX, currentY);
    g.lineTo(currentX, currentY + rowHeight);
    g.stroke();
  }, []);

  // Per-frame imperative redraw (no React re-render).
  useEffect(() => subscribePlayhead(draw), [subscribePlayhead, draw]);

  // Redraw at the current playhead position when layout changes (resize / row reflow).
  useEffect(() => {
    draw(getPlayheadTime());
  }, [
    layout?.rowHeight,
    layout?.width,
    layout?.contentHeight,
    layout?.timeToPixels,
    draw,
    getPlayheadTime,
  ]);

  return <pixiGraphics ref={graphicsRef} />;
}
```

(The default export `PixiPlayheadOverlay`, lines 42–82, is unchanged.)

- [ ] **Step 2: Verify in browser**

With dev server running, play audio for one song. The red playhead line must sweep smoothly across the tapestry exactly as in the baseline screenshot/trace.
Expected: line moves; no console errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/TapestryView/global/pixiPlayheadOverlay.jsx
git commit -m "feat(perf): drive Pixi playhead via subscription, no React state"
```

---

## Task 3: AudioControlsView — remove duplicate rAF, isolate the clock

**Files:**
- Create: `src/components/AudioControlsView/UIElements/TransportClock.jsx`
- Modify: `src/components/AudioControlsView/index.jsx`

- [ ] **Step 1: Create an isolated leaf that owns the per-frame time**

Only this tiny component re-renders per frame; the transport buttons do not.

Create `src/components/AudioControlsView/UIElements/TransportClock.jsx`:
```jsx
import React, { useState } from "react";
import { usePlayheadSubscription } from "../../../contexts/AudioContext";
import { ScrubSlider } from "./ScrubSlider";

function fmtTime(sec = 0) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Owns the 60fps current-time state in isolation so the transport buttons
 * (which don't change with time) never re-render during playback.
 */
export function TransportClock({ duration, onSeek }) {
  const [t, setT] = useState(0);
  usePlayheadSubscription(setT, []);

  return (
    <>
      <div className="ac-scrub-row">
        <ScrubSlider value={t} max={duration || 0} onChange={onSeek} />
      </div>
      <div className="ac-time-row">
        <span className="ac-time ac-time-current">{fmtTime(t)}</span>
        <span className="ac-time ac-time-total">{fmtTime(duration)}</span>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Replace the local rAF + time state in AudioControlsView**

In `src/components/AudioControlsView/index.jsx`:

(a) Update imports (line 2 and the UIElements imports) — remove the now-unused `ScrubSlider` import (it moves into TransportClock), add TransportClock:
```jsx
import React, { useState, useEffect } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { PlayPauseButton } from "./UIElements/PlayPauseButton";
import { StopButton } from "./UIElements/StopButton";
import { VolumeControl } from "./UIElements/VolumeControl";
import { TransportClock } from "./UIElements/TransportClock";
import "./AudioControlsView.css";
```

(b) Delete the `fmtTime` helper (lines 10–16) — it now lives in TransportClock.

(c) In the component body, delete `const [currentTime, setCurrentTime] = useState(0);` and the entire `// ── Time (RAF) ──` effect (lines 33–42).

(d) Replace the scrub + time rows JSX (lines 87–100) with a single:
```jsx
        <TransportClock duration={duration} onSeek={seekAll} />
```

The `isPlaying`, `playAll`, `pauseAll`, `stopAll`, `seekAll`, `duration`, `audioRefs`, volume state, and spacebar effect all stay.

- [ ] **Step 3: Verify in browser**

The current-time label updates and the scrub thumb tracks playback. Play/Pause/Stop work. Dragging the scrubber seeks. Spacebar toggles play. Crucially: confirm via a render-highlight or trace that the play/stop buttons no longer repaint every frame (only TransportClock does).
Expected: behavior identical to baseline; per-frame render scope shrunk to the clock.

- [ ] **Step 4: Commit**

```bash
git add src/components/AudioControlsView/index.jsx src/components/AudioControlsView/UIElements/TransportClock.jsx
git commit -m "feat(perf): kill duplicate rAF; isolate transport clock to a leaf"
```

---

## Task 4: Drop the dead audio subscription in drum components

**Files:**
- Modify: `src/components/TapestryView/drums/DrumGrid.jsx`
- Modify: `src/components/TapestryView/drums/DrumsGlyphs.jsx`

- [ ] **Step 1: DrumGrid — remove `useAudioEngine` and dead `isActive`**

In `src/components/TapestryView/drums/DrumGrid.jsx`:
- Delete the import line 4: `import { useAudioEngine } from "../../../contexts/AudioContext";`
- Delete line 9: `const { playheadTime } = useAudioEngine();`
- Delete the now-dead `const isActive = Math.abs(t - playheadTime) <= tolerance;` lines (line 77 and line 119). `isActive` is never used in the emitted `<line>` (opacity is the constant `0.2`).
- Delete the unused `const tolerance = 0.08;` on line 71.

- [ ] **Step 2: DrumsGlyphs — remove `useAudioEngine`**

In `src/components/TapestryView/drums/DrumsGlyphs.jsx`:
- Delete the import line 3: `import { useAudioEngine } from "../../../contexts/AudioContext";`
- Delete line 32: `const { playheadTime } = useAudioEngine();` (it is never referenced in the body).

(Do NOT touch the conditional-hook ordering here — that is a separate, deliberate fix in Plan B Task for glyph memoization. Keep this commit minimal.)

- [ ] **Step 3: Verify in browser**

Drum grid lines and drum glyphs render identically to the baseline screenshot and no longer participate in per-frame playback renders.
Expected: visually identical; no console errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/TapestryView/drums/DrumGrid.jsx src/components/TapestryView/drums/DrumsGlyphs.jsx
git commit -m "perf: drums no longer subscribe to playhead (value was unused)"
```

---

## Task 5: LyricsView current-line/word via low-frequency ids

**Files:**
- Create: `src/components/LyricsView/hooks/useCurrentPlayheadIds.js`
- Modify: `src/components/LyricsView/index.jsx`
- Modify: `src/components/LyricsView/WordLine.jsx`
- Modify: `src/components/LyricsView/WordBlock.jsx`

- [ ] **Step 1: Create the hook that derives line/word ids and re-renders only on change**

Create `src/components/LyricsView/hooks/useCurrentPlayheadIds.js`:
```js
import { useMemo, useRef, useState } from "react";
import { usePlayheadSubscription } from "../../../contexts/AudioContext";
import { findCurrentIndex } from "../../../utils/findCurrentIndex";

/**
 * Subscribes to the playhead and exposes the CURRENT line index and word id.
 * setState fires only when the line index or word id actually changes
 * (~per-line / per-word granularity), not every frame.
 */
export function useCurrentPlayheadIds(lines) {
  // Precompute sorted boundary arrays once per song.
  const lineBounds = useMemo(() => {
    const starts = lines.map((l) => l?.start ?? l?.words?.[0]?.start ?? Infinity);
    const ends = lines.map(
      (l) => l?.end ?? l?.words?.[l.words.length - 1]?.end ?? -Infinity
    );
    return { starts, ends };
  }, [lines]);

  const wordBounds = useMemo(() => {
    const starts = [];
    const ends = [];
    const ids = [];
    lines.forEach((line, i) => {
      (line.words || []).forEach((w, j) => {
        if (typeof w.start === "number" && typeof w.end === "number") {
          starts.push(w.start);
          ends.push(w.end);
          ids.push(`${i}-${j}`);
        }
      });
    });
    return { starts, ends, ids };
  }, [lines]);

  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [currentWordId, setCurrentWordId] = useState(null);
  const lineRef = useRef(-1);
  const wordRef = useRef(null);

  const onTick = useMemo(
    () => (t) => {
      const li = findCurrentIndex(lineBounds.starts, lineBounds.ends, t);
      if (li !== lineRef.current) {
        lineRef.current = li;
        setCurrentLineIndex(li);
      }
      const wi = findCurrentIndex(wordBounds.starts, wordBounds.ends, t);
      const wid = wi === -1 ? null : wordBounds.ids[wi];
      if (wid !== wordRef.current) {
        wordRef.current = wid;
        setCurrentWordId(wid);
      }
    },
    [lineBounds, wordBounds]
  );

  usePlayheadSubscription(onTick, [onTick]);

  return { currentLineIndex, currentWordId };
}
```

NOTE on line bounds: `WordLine` currently computes `isCurrent` as `playheadTime >= line.start && < line.end`. If `line.start`/`line.end` are absent, the hook falls back to first-word start / last-word end, preserving the same window. Verify the data has `line.start`/`line.end`; if not, the fallback covers it.

- [ ] **Step 2: Wire the hook into LyricsView and stop prop-drilling `playheadTime`**

In `src/components/LyricsView/index.jsx`:

(a) Replace the audio import (line 11) usage: remove `const { playheadTime } = useAudioEngine();` (line 21). Remove the `useAudioEngine` import (line 11) if `playheadTime` was its only use — check; it is. Add the hook import:
```js
import { useCurrentPlayheadIds } from "./hooks/useCurrentPlayheadIds";
```

(b) Delete the `lineStarts` memo (lines 43–45) and the `currentLineIndex` binary-search memo (lines 48–58). Replace with:
```js
  const { currentLineIndex, currentWordId } = useCurrentPlayheadIds(lines);
```
(Place it after `const lines = ...` on line 25, before `useFitTextToLines`.)

(c) In the `lines.map(...)` (lines 122–135), remove the `playheadTime={playheadTime}` prop and add `currentWordId`:
```jsx
        {lines.map((line, idx) => (
          <WordLine
            key={idx}
            line={line}
            lineIdx={idx}
            isCurrent={idx === currentLineIndex}
            currentWordId={currentWordId}
            hoverData={hoverData}
            onWordHover={setWordHover}
            onSyllableHover={setSyllableHover}
            onHoverEnd={clearHover}
            dataLineIdx={idx}
          />
        ))}
```

`scrollToCurrentLine` / follow effects already depend on `currentLineIndex` and continue to work unchanged.

- [ ] **Step 3: Update WordLine to use `isCurrent` prop + pass `currentWordId` down**

In `src/components/LyricsView/WordLine.jsx`:
- Change the signature (lines 17–26) to accept `isCurrent` and `currentWordId` instead of `playheadTime`:
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
- Delete line 41: `const isCurrent = playheadTime >= line.start && playheadTime < line.end;` (now a prop).
- In the `line.words?.map(...)` (lines 101–113), replace `playheadTime={playheadTime}` with `isCurrent={\`${lineIdx}-${wordIdx}\` === currentWordId}`:
```jsx
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            isCurrent={`${lineIdx}-${wordIdx}` === currentWordId}
            hoverData={hoverData}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
```

- [ ] **Step 4: Update WordBlock to consume `isCurrent` prop**

In `src/components/LyricsView/WordBlock.jsx`:
- Change the signature (lines 18–27) to accept `isCurrent` instead of `playheadTime`:
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
- Delete line 32: `const isCurrent = playheadTime >= word.start && playheadTime < word.end;` (now a prop). The `<span className={\`word ${isCurrent ? "current" : ""}\`}>` usage stays.

- [ ] **Step 5: Verify in browser (the most behavior-sensitive task)**

Play 93Til and Amen. Confirm against baseline:
- The "current" line highlight tracks the playhead exactly as before.
- The "current" word highlight (the `.word.current` style) advances word-by-word as before.
- Auto-follow scrolling still recenters; user scroll still disables following; Recenter re-enables.
- No console errors.

Then re-record a playback performance trace. Compare to baseline: per-frame render scope should now exclude the lyric rows except at line/word transitions.
Expected: identical behavior; dramatically fewer renders during playback.

- [ ] **Step 6: Commit**

```bash
git add src/components/LyricsView/hooks/useCurrentPlayheadIds.js src/components/LyricsView/index.jsx src/components/LyricsView/WordLine.jsx src/components/LyricsView/WordBlock.jsx
git commit -m "feat(perf): lyrics derive current line/word ids, no per-frame prop drill"
```

---

## Task 6: Remove dead SVGPlayhead

**Files:**
- Delete: `src/components/TapestryView/global/SVGPlayhead.jsx`

- [ ] **Step 1: Confirm it is unused**

Run: `grep -rn "SVGPlayhead" src` (exclude its own file).
Expected: no importers. If any importer exists, STOP and migrate it to a subscription instead of deleting.

- [ ] **Step 2: Delete and commit**

```bash
git rm src/components/TapestryView/global/SVGPlayhead.jsx
git commit -m "chore: remove unused SVGPlayhead (dead per-frame setState component)"
```

---

## Task 7: Final verification against baseline

- [ ] **Step 1: Full unit suite**

Run: `npx vitest run`
Expected: all tests PASS (84 prior + 5 new).

- [ ] **Step 2: Full interaction pass in browser (both songs)**

Repeat every interaction from the Task 0 baseline: play/pause/stop, scrub, spacebar, select word, Cmd+click rhyme, Alt+click remove, S/D/B randomize, switch songs. Screenshot and compare to baseline screenshots.
Expected: visually and behaviorally identical.

- [ ] **Step 3: Compare playback traces**

Record the same 8s play trace for 93Til. Compare scripting-time % and dropped frames to the baseline numbers from Task 0.
Expected: large reduction in scripting time / dropped frames during playback. Record the before/after numbers in `docs/superpowers/baselines/2026-06-16/results.md`.

- [ ] **Step 4: Commit results + open for review**

```bash
git add docs/superpowers/baselines/2026-06-16/results.md
git commit -m "docs(perf): record P0 before/after measurements"
```

Then summarize the numbers to the user before deciding whether to merge or continue to Plan B.

---

## Self-review notes (author)

- **Spec coverage:** F1 (Task 1+5+2), F2 (Task 3), F3 (Task 4), F4 (Task 2), F16/dead SVGPlayhead (Task 6). The 60fps `useAudioEngine` consumers that only read stable fields (WordGlyphs/SyllableGlyphs/LineGlyphs via `seekAll`, ActiveQueryPanel, ChannelStrip, anchors panels) are fixed *for free* by Task 1: once `playheadTime` leaves the value and the value is memoized, the provider no longer re-renders 60fps, so those consumers stop re-rendering during playback without code changes. Verify this in Task 7's trace.
- **Type consistency:** `subscribePlayhead(cb) → unsubscribe`, `getPlayheadTime() → number`, `usePlayheadSubscription(cb, deps)`, `findCurrentIndex(starts, ends, t) → number`. Used consistently across Tasks 1–5.
- **Risk:** `useMemo`-wrapped `onTick` in Task 5 must stay stable; it depends only on precomputed bounds (per-song), so it is. If `line.start`/`line.end` are missing in the data, the fallback in `lineBounds` preserves the prior window — verify during Task 5.

---

## Roadmap (subsequent plans, written when we reach them)

- **Plan B — Context memoization & splitting (P1, F5–F8).** Memoize/split `ParamsContext` (27 consumers) and the 3 selection-context provider values; wrap glyph builders in `useMemo` + `React.memo`; fix conditional-hook ordering in `DrumsGlyphs`/`SyllableGlyphs`; move static inline styles to CSS. Write after Plan A's trace confirms the playhead win, since memo only helps once context churn is gone.
- **Plan C — Selection-compute caching (P2, F9–F12).** Precompute per-word phoneme decomposition once per song; cache per-selection match sets so one change ≠ recompute all; have `anchorOrAdopt` reuse the memo; hoist `flatVowels`.
- **Plan D — DOM weight / virtualization (P3, F13–F15).** Window the lyrics list; cull off-screen tapestry glyphs; de-duplicate `<mask>` defs; push hover state into a leaf. Evaluate canvas/WebGL glyph layer only if still needed after B+C.
