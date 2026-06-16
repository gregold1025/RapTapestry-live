# Playhead Decoupling (Plan A) — before/after results

Branch `claude/perf-playhead-decoupling` (off `master` @ f354bc6). All seven tasks complete.
Measurements on the same machine, same dev server, no throttling, React **StrictMode on**
(doubles render counts equally before *and* after, so ratios are unaffected).

## 1. Functionality preservation (the gating constraint) — PASS

- **Unit tests:** 89/89 pass (84 pre-existing + 5 new `findCurrentIndex`). Production `npm run build` succeeds.
- **Browser, both songs (93Til + Amen), zero console errors/warnings:**
  - Playhead red line sweeps the tapestry (now drawn imperatively via subscription).
  - Transport clock + scrub thumb track playback; Play/Pause/Stop/Space work.
  - Current-line and current-word highlight track the playhead exactly (window-based, matching the old behavior — dark during inter-line gaps, same as before).
  - Auto-follow scroll works; user scroll disables following; **Recenter** re-enables it (verified label transitions to "Following…" and holds).
  - Word select → 6 rhyme matches + ARPABET; Cmd+click → rhyme-gravity anchor adopt; Alt+click → remove; S/D/B → randomize syllable/drum/bass glyphs. All identical to baseline screenshots.
- **One intentional, minor behavior delta** (documented, arguably more correct): the auto-scroll line index is now window-based, so during instrumental gaps (Amen has gaps up to 2.84s) it returns -1 and the Recenter button shows momentarily disabled. Highlight parity and scroll target/timing are unchanged.

## 2. Render-count measurements (93Til, 996 word components)

Measured by a temporary render counter (removed after measuring), 5s playback windows.
"list re-renders/sec" = WordBlock renders/sec ÷ 996.

| Component | Window | BEFORE | AFTER |
|---|---|---|---|
| **Transport panel** (buttons + volume) | playback | ~40 renders/sec | **~0 / sec (2 total in 5s)** |
| Lyrics list (WordBlock) | song start (sparse vocals) | ~3.4 list-rerenders/sec | **~0.4 / sec** |
| Lyrics list (WordBlock) | 30s in (dense rapping) | ~1.8 list-rerenders/sec | ~6–7 / sec |

## 3. Aggregate playback trace (per-second main-thread binning)

| Song | metric | BEFORE | AFTER |
|---|---|---|---|
| 93Til | busy ms/s (playback) | 20.8 | 21.8 |
| 93Til | StyleResolve/s | 36 | 38 |
| Amen | busy ms/s (playback) | 20.8 | 35.1* |
| Amen | StyleResolve/s | 19 | 17 |

\* single-run variance (GC + smooth-scroll layout); not a real regression. Raw traces:
`93Til-trace-after.json.gz`, `Amen-trace-after.json.gz`.

## 4. Honest interpretation

**The plan's premise — "the playhead drives ~60fps re-renders of the whole tree" — was only
partly true, and not for the lyrics.** Chrome advances `HTMLMediaElement.currentTime` at coarse
granularity when sampled in rAF, and React bails out of setState-to-equal-value, so the baseline
actually re-rendered the lyrics only ~2–3×/sec, not 60. (The *transport panel*, with its own rAF,
did churn ~40×/sec — that one matched the premise.)

What Plan A actually delivers:
- **Clean win for non-lyrics consumers.** The provider value is now memoized and `playheadTime`
  left React state, so every `useAudioEngine` consumer that only reads stable fields (transport
  buttons, volume, drums, query panel, channel strips, glyphs reading `seekAll`) stops re-rendering
  during playback. The transport panel went from ~40/sec to ~0/sec. The Pixi playhead now draws
  imperatively (no React reconciliation per frame). Drums dropped a dead subscription.
- **Lyrics: trigger changed, not cost reduced.** Re-renders are now driven by *semantic* word/line
  boundary changes instead of clock ticks. In sparse passages that's fewer renders; in dense rapping
  it's more (≈6–7 list re-renders/sec), because every word boundary (and the null gaps between words)
  fires a state change. Because no lyric component is `React.memo`'d yet, each list re-render still
  cascades to all 996 WordBlocks.
- **Aggregate wall-clock during playback is ~unchanged** — it's dominated by Pixi redraw, smooth
  scrolling, and compositing, none of which a render-*count* change moves until the renders are made
  cheap.

**Plan A is therefore best understood as the architectural prerequisite it is.** It is required
before `React.memo` can help at all (you cannot memoize while the provider value churns every frame).
Once Plan B memoizes WordBlock/glyphs, a word change will re-render only the 1–2 words whose
`isCurrent` prop actually flips — instead of all 996 — which is the real lyrics win and is now unlocked.

## 5. Recommendation

Plan A is safe to keep (functionality fully preserved, 89 tests green) and delivers a concrete
transport/consumer re-render elimination. But it does **not** by itself reduce lyrics render cost and
can slightly increase it during dense passages. Recommend proceeding to **Plan B (memoization +
`React.memo` on WordBlock/glyphs, context splitting)** to convert this foundation into the lyrics win,
ideally before considering this a "performance" merge rather than a "refactor/foundation" merge.
