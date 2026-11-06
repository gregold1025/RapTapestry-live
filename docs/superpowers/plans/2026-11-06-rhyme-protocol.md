# Rhyme Protocol Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the weakest-link rhyme hierarchy with the protocol engine (feet, one- and two-syllable protocols, assonance as a second pass) on the branch `claude/rhyme-protocol`, keeping every interaction of the interface working.

**Architecture:** A pure protocol module (`protocol.js`: consonant axes, per-foot rows) under a rewritten matcher (`syllableMatch.js`: feet from the query, right-to-left recursion, tail cases with the 4-bar guard, assonance pass). The match record keeps `type` / `form` / `links` so the layers keep working, and adds `tags` and `feet`. The type table shrinks to five identities; the Queries view's pills, counts and labels read that table.

**Tech Stack:** React + Vite, Vitest. Worktree `/Users/gregory-gold/Desktop/Rap-Tapestry/my-tapestry-protocol` (branch `claude/rhyme-protocol`; dev server on port 5174). The folder `my-tapestry-refactor` (Greg's running app, port 5173) is never touched.

**Spec:** `docs/superpowers/specs/2026-11-06-rhyme-protocol-design.md`

## Global Constraints

- Never push. Never touch `my-tapestry-refactor/`. Commit on `claude/rhyme-protocol` with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Working type keys: `identical`, `perfect`, `loosened`, `shifted`, `assonance`; `anchor` stays for the anchors. Forms unchanged: `word`, `embedded`, `mosaic`, `semirhyme`.
- American spelling in every string and comment.
- Every rule change is judged on the yardstick: `node experiments/yardstick-01/score-app.mjs 93Til <label>` run from `/Users/gregory-gold/Desktop/Rap-Tapestry` after pointing its `APP` constant at the worktree (edit a copy in scratch, not the original).

## Review Focus

1. A query that is all function words ("in the") must not crash and must return anchors only.
2. A candidate word with no phones (text stored in `phones`) is skipped, never throws.
3. A word query whose anchor is the song's first or last word: no index underflow at the chain's left edge, no overflow at the right.
4. Line queries (`lineEndMatches`) still rank by syllables linked then by `TYPE_RANK`, with the new keys.
5. Undo / redo over `setTypes` with the new keys; saved queries from the old branch do not exist, so no migration.

---

### Task 1: The protocol module

**Files:**
- Create: `src/engine/protocol.js`
- Test: `src/engine/__tests__/protocol.test.js`

**Interfaces:**
- Produces: `consAxis(a: string[], b: string[]) -> '1'|'F'|'A'|'FA'|'W'`; `sameVowel(va, sa, vb, sb) -> boolean` (sa/sb = stress digits; weak rule); `footRow(q: Step[], c: Step[]) -> { row: 1|2|3, axes: { v1, internal, v2, mid, coda }, tags: string[] } | null` where `Step = { v, stress, on: string[], coda: string[], weak: boolean }` and the arrays are the query foot and the same number of candidate steps; `TAGS_OF_AXIS` mapping `'F' -> 'family'`, `'A' -> 'additive'`, `'FA' -> 'family+additive'`, `'W' -> 'wildcard'`.
- Consumes: `consonantRelation`, `REDUCED` from `rhymeTypes.js`.

- [ ] **Step 1: Write the failing tests** (one `it` per row of the spec's one-syllable and two-syllable tables, plus): `consAxis(['T','S'],['D'])` is `'FA'`; `consAxis(['T'],['K','S'])` is `'FA'` (hot / rocks); `consAxis(['T'],['S','T'])` is `'A'` (mat / mast); `consAxis(['K','S'],['SH'])` is `'FA'` but `consAxis([],['K','S'])` is `'W'`; `consAxis(['JH'],['K'])` is `'F'`; `footRow` on digits ~ frigid is row 2 with tag `family+additive`; reason ~ demons row 2 (internal W, coda A); midget ~ gotta null; cooler ~ later null; Cali ~ Maui row 3 (internal A, coda 1); ever ~ over row 3; famous ~ Hey miss row 1 (final vowel AH0 ~ IH1 weak); digits ~ pigeon null (coda W); hot ~ rocks one step row 2 tag `family+additive`; cat ~ cash null; a three-step foot cinema ~ minimum row 2.
- [ ] **Step 2: Run** `npx vitest run src/engine/__tests__/protocol.test.js` — Expected: FAIL, module not found.
- [ ] **Step 3: Implement `protocol.js`** per the spec tables. `consAxis`: same → `1`; same length and all pairs same-or-family → `F`; length differs by one: for each drop position, identical rest → `A`, family rest → `FA` (keep the best); else `W`. `footRow`: steps of equal count (1 to 3); stressed vowel equal → v1 `1` else `W`; internal = `consAxis(q0.coda + q1.on, c0.coda + c1.on)`; mid (3 steps) = vowel equal/weak and `consAxis(q1.coda + q2.on, c1.coda + c2.on)` not `W`; final vowel equal or weak-interchangeable; coda = `consAxis(qLast.coda, cLast.coda)`. Rows as in the spec; at most one `W`; tags from the non-`1` axes (deduplicated).
- [ ] **Step 4: Run the test file** — Expected: PASS.
- [ ] **Step 5: Commit** `feat(engine): protocol module (consonant axes, per-foot rows)`.

### Task 2: Syllables, feet and data

**Files:**
- Modify: `src/engine/syllableMatch.js` (`wordSyllables`: drop the -ire merge; expose `on`/`coda` per reading from `syllabify`), `src/engine/phoneOverrides.js` (add `READINGS`), `src/engine/songModel.js` (apply `READINGS`)
- Test: `src/engine/__tests__/engine.test.js` (song model), `src/engine/__tests__/syllableMatch.test.js`

**Interfaces:**
- Produces: `READINGS = { admire: 'AE0 D M AY1 ER0', perspire: 'P ER0 S P AY1 ER0' }` applied by text in `buildSongModel` (replaces the dictionary readings); `songSyllables(song)` entries `{ w, k, kEnd, stress, weak, final, i, alts: [{ v, stress, on, coda, follow }] }` with `kEnd === k` always (no merge).
- Consumes: `syllabify`, `bare`.

- [ ] **Step 1: Failing tests**: admire has 2 syllables and phones `AE0 D M AY1 ER0` in the 93 Til model; `desire` keeps 3; `songSyllables` gives flyer two entries.
- [ ] **Step 2: Run** `npx vitest run src/engine/__tests__/engine.test.js` — Expected: FAIL on the admire count.
- [ ] **Step 3: Implement**: `READINGS` export; in `buildSongModel`, after `variants` are collected, if `READINGS[cleanText(w.text)]` exists set `variants = [reading]` and `n` to its vowel count; remove the merge block in `wordSyllables` and the `R -> ER0` rewrite in `parseRime` (keep `parseRime` otherwise; it still feeds `rime`/`rimes` for display).
- [ ] **Step 4: Run** the two test files — Expected: the new tests PASS; the `-ire` test ("desire ~ admire perfect") now FAILS: delete it (superseded; the semirhyme/embedded rule covers desire ~ admire as a same-shape 2-step foot now that both are AY ER).
- [ ] **Step 5: Commit** `feat(engine): two-syllable readings for admire and perspire; -ire merge removed`.

### Task 3: The matcher

**Files:**
- Rewrite: `src/engine/syllableMatch.js` (`matchAt`, `semirhymes`, `matchQuery`)
- Modify: `src/engine/rhymeTypes.js` (`RHYME_TYPES` → five identities with labels, colors, descriptions; keep `FORMS`, `consonantRelation`, `parseRime`, `classifyRhyme` for `lineRhymes`/display), `src/engine/index.js` (`TYPE_RANK = anchor, identical, perfect, loosened, shifted, assonance`)
- Test: `src/engine/__tests__/syllableMatch.test.js` (rewrite to the rulings), `src/engine/__tests__/engine.test.js`, `src/engine/__tests__/lineRhymes.test.js`

**Interfaces:**
- Produces: `matchQuery(song, anchorIds) -> Match[]`, `Match = { type, form, tags: string[], feet: [{ row, axes, i0, i1 }], words, word, text, start, end, vi0, vi1, links: [{ wordId, k, kEnd, type, counted: true, pickup }] }`. `computeMatches` unchanged in shape.
- Consumes: Task 1 `footRow`, `sameVowel`; Task 2 syllables.

- [ ] **Step 1: Failing tests** (real songs via `load`, made-up pairs via the `tiny` helper already in the test file): famous ~ Hey miss perfect mosaic; digits ~ frigid `loosened` word with tag `family+additive`; reason ~ demons (Amen) `loosened`; vibrations finds no makes / females; logic ~ Spock semirhyme (any row) within 4 bars, clock too; wage ~ engagements embedded perfect; chill ~ chillin' perfect embedded (tiny); master ~ fast perfect (tiny, master as the candidate with a tail); hot ~ rocks loosened (tiny); midget ~ gotta no match; Cali ~ Maui `shifted` (tiny: Cali K AE1 L IY0 ~ Maui M AW1 IY0); "ever, later" ~ "over, greater" (tiny) two feet, type perfect, links[0].type `shifted`; close range ~ most strange perfect mosaic; so- so ~ solo / so low perfect; we just chill ~ '93 until perfect three syllables; until ~ the thrill pickup; dizziness ~ silly bitch `assonance` 3 links (tiny, with the rhyme pass unable to match: use "in the cut" and "kiss me with" as negatives); a query of function words only returns []; no two matches share a word; semirhyme candidates are content words within 4 bars.
- [ ] **Step 2: Run** `npx vitest run src/engine` — Expected: FAIL (old labels, old semirhyme rule, assonance missing).
- [ ] **Step 3: Implement** per the spec's "A match" and "Assonance" sections. Keep `songSyllables`; new helpers: `queryFeet(Q)` (feet right to left + pickups), `stepsOf(syl, alt)`, `footAt(S, e, nSteps)`, `compareFoot(qFoot, cSyls, { tail: 'none'|'query'|'candidate' })` trying all alt pairs and returning the best `footRow` result (lowest row, then fewest tags), credit-where-due for the tailed side, `withinBars(song, a, b, 4)`, `assonancePass(S, Q, taken)` (rule D). Identity = final foot row → `perfect`/`loosened`/`shifted`; `identical` via `isIdentical`. `links[i].type` = its foot's identity, `pickup` for pickups, `assonance` for the second pass.
- [ ] **Step 4: Run** `npx vitest run src/engine` — Expected: PASS; fix `engine.test.js` regression expectations (handball ~ man's all: assert a match exists and its form; tree trunk ~ we funk / weak luck: assert found, type `loosened` or `shifted`, whichever the protocol gives, and record the value in the test name).
- [ ] **Step 5: Commit** `feat(engine): the protocol matcher (feet, rows, tail cases, assonance pass)`.

### Task 4: The interface reads the new record

**Files:**
- Modify: `src/contexts/queryReducer.js` (`DEFAULT_TYPES` from the new table: all five on), `src/components/RightPane/QueriesView.jsx` (pills from `RHYME_TYPES`; tags as `sq-match-meta` text; strip colors by link type; hover phones unchanged), `src/utils/phoneMarks.js` (`assonantSyllables` unchanged: links of type `assonance`), `src/components/LyricsView/WordBlock.jsx`, `src/components/TapestryView/vocals/WordGlyphs.jsx`, `src/components/TapestryView/staff/StaffVocals.jsx` (labels: append tags, e.g. "loosened (family+additive) mosaic"), `README.md` (engine section rewritten to the protocol), `src/components/RightPane/RightPane.css` (a `.sq-tags` style if needed)
- Test: `src/contexts/__tests__/queryReducer.test.js`, `src/utils/__tests__/phoneMarks.test.js`

**Interfaces:**
- Consumes: `RHYME_TYPES`, `TYPE_RANK`, `Match.tags`.

- [ ] **Step 1: Failing test**: `DEFAULT_TYPES` equals the five new keys; a `setTypes` action with `['perfect']` filters.
- [ ] **Step 2: Run** `npx vitest run src/contexts src/utils` — Expected: FAIL on the keys.
- [ ] **Step 3: Implement** the edits above; `visualByWordId` entries gain `tags`.
- [ ] **Step 4: Run** `npx vitest run` (whole suite) — Expected: PASS. Then `npm run build` — Expected: green.
- [ ] **Step 5: Chrome check** on `http://localhost:5174` (start `npx vite --port 5174` in the worktree, background): query "famous" shows Hey miss perfect; "digits" shows frigid loosened with its tag; pills hide/show; radius slider works; cmd-click, shift-click, alt-click, line square, play, loop, Cmd-Z; no console errors. Close the tab afterwards; never touch tab 1230727637.
- [ ] **Step 6: Commit** `feat(ui): queries read the protocol record (identities, tags)`.

### Task 5: Score, document, record

**Files:**
- Create: `experiments/yardstick-01/results-app-93Til-protocol.json` (via the scorer pointed at the worktree)
- Modify: `research/tapestry-vault/rhyme-engine/Rhyme engine - history.md` (stage 5: built on `claude/rhyme-protocol`, date, yardstick number), `Rhyme engine - experiments.md` (experiment 29: the protocol build, before/after), `Rhyme engine - tests.md` (the "expected now" column where the protocol changed an answer), the ledger `.superpowers/sdd/2026-11-05-shell-v2-loop-staff/progress.md` (follow-up 23), memory `interface-redesign.md` and `MEMORY.md` (branch list: `claude/rhyme-protocol`, worktree, tests count).

- [ ] **Step 1:** Copy `score-app.mjs` to the scratchpad with `APP` pointing at the worktree; run with label `protocol`; compare with `union-off` (78.6%) per family; list gained and lost families.
- [ ] **Step 2:** Write the numbers into the vault notes and the ledger; note any ruling made during the build as `Ruling:` lines.
- [ ] **Step 3:** Commit `docs: protocol engine scored and recorded` (vault files live outside the repo; only README and the ledger are in it).
