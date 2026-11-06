# The rhyme protocol: design (2026-11-06)

Greg's rulings from the 2026-11-05 and 2026-11-06 design talks, written as the specification the
protocol engine is built from. The story and the reasons are in the vault
(`research/tapestry-vault/rhyme-engine/Rhyme engine - history.md`, stage 5); the cases are in
`Rhyme engine - tests.md`. Where this document goes beyond what Greg said, the line is marked
**(assumption)**; Greg asked for assumptions to be made so that a working version exists when he
returns, interface preserved wherever it can be.

## Units

- **Syllable**: onset, vowel, coda, cut inside a word by `syllabify.js` (maximal onset). Dictionary
  readings (`variants`) all stay available; a comparison takes the best reading pair.
- **Stress**: dictionary stress (1 or 2); one-syllable function words count as unstressed (`weak`).
- **Weak vowels**: unstressed AH, IH, EH are interchangeable; also against a stressed AH / IH / EH
  (famous ~ Hey, miss). A stressed vowel never changes.
- **Foot**: a stressed syllable plus the unstressed syllables after it, taken from the **query**.
  Unstressed syllables before the query's first stress are **pickups**.
- **Axes** of a foot against candidate syllables of the same count:
  - 1 step: nucleus, coda.
  - 2 steps: stressed vowel, internal cluster (coda of step 1 + onset of step 2, the whole cluster
    between the vowels), final vowel, coda.
  - 3 steps **(assumption)**: as 2 steps plus a middle step: its vowel equal or both weak; its
    cluster (coda 2 + onset 3) at most F+A.
- **Consonant axis values**: `1` same; `F` same length, each pair same or in one family (plosive,
  fricative, nasal; voicing free; affricates relate through their parts; L R W Y HH in no family);
  `A` exactly one consonant added or dropped anywhere, the rest identical; `FA` one added or
  dropped and the rest within family; `W` anything else. An affricate is one consonant.

## Protocol per foot

| Steps | Row | Stressed vowel | Internal | Final vowel | Coda |
|---|---|---|---|---|---|
| 1 | 1 perfect | same | — | — | 1 |
| 1 | 2 loosened | same | — | — | F, A, FA |
| 2 (and 3) | 1 perfect | same | 1 | same / weak | 1 |
| 2 (and 3) | 2 loosened | same | 1, F, A, FA, **W** | same / weak | 1, F, A, FA |
| 2 (and 3) | 3 shifted | **W** | 1, F, A, FA | same / weak | 1 |

Anything else is not a rhyme (coda W; final vowel differs; two W; a one-step foot with coda W).
Row 1 excludes every tag; F, A and FA are tags on their axis and can coexist.

## A match

1. Every candidate syllable position is tried as the end of a match, paired with the query's last
   syllable. The candidate syllable at a foot's stressed step must be strong (stressed, not a
   function word); the tail steps have no stress requirement.
2. The **final foot** is compared first. Its row is the match's **identity**. Three shapes:
   - **same shape**: the candidate takes as many syllables as the foot has steps;
   - **query has a tail, candidate does not** (`semirhyme` form): the query foot has 2+ steps and
     the candidate syllable is the last of its word; one-step protocol on the stressed syllables;
   - **candidate has a tail, query does not** (`embedded` form when inside one word): the query
     foot has 1 step and the candidate syllable is followed by unstressed syllables in its word;
     one-step protocol on the stressed syllables.
   In the two tail cases the tailed side's coda is decided by **credit where credit is due**: its
   whole cluster up to the next vowel if that makes the coda axis `1` or `F`, otherwise its
   syllabified coda. Tail cases are allowed only within **4 bars** (whole bars, as the radius
   counts) of the query's first word, and a semirhyme candidate must be a content word.
3. **Recursion**: the next query foot to the left is compared with the candidate syllables before
   (contiguous, not inside the query); rows 1 to 3 all join; the chain stops at the first foot
   that fails. Then pickups: query leading unstressed syllables link on the vowel (weak rule).
4. **Form** by geometry: `word` (one word, to its end), `embedded` (one word, before its end),
   `mosaic` (several words, ending at a word end; a mosaic may not end mid-word), `semirhyme`
   (shape 2 above; one word). `identical` when the whole query's phones repeat.
5. **One match per place**: a word covered by a rhyme match is not offered again.

## Assonance (rule D), a second pass

Only where no rhyme match ends: vowels only, right to left from the query's last syllable; the
weak rule applies; the chain is **3 syllables or longer**, has at least one pair stressed on
both sides, and only **content-word syllables count** toward 3 (function words hold the chain).
Type `assonance`, form by geometry, each link vowel-only.

## Record, then name

Each match carries `type` (identity: `identical`, `perfect`, `loosened`, `shifted`, `assonance`),
`form`, `tags` (array of `family`, `additive`, `wildcard` from the final foot's axes), `feet`
(one entry per foot: row, axes, syllable range) and `links` (one entry per covered syllable: `type`
= its foot's identity or `assonance`, `pickup`, `wordId`, `k`). **The names `loosened` and
`shifted` are working names (assumption)**; they live in one table (`RHYME_TYPES`) so renaming is
one edit.

## Interface (assumptions)

- The type pills become the five identities above (same mechanism: `q.types`); the radius
  slider stays; tags show as small text on each match and in the hover.
- Lyrics, tapestry and Line Staff keep their form styling; labels read the new type names.
- Hover bolding: a rhyme bolds from the first matched vowel to the match end as today; an
  assonance link bolds only its vowel.
- All interaction stays: click, shift-click, cmd-click, alt-click, line squares, playback, loop,
  radius, undo / redo, keyboard.

## Data

- Remove the "-ire / -our" merge. Add two-syllable readings for admire and perspire in
  `phoneOverrides.js` (Greg hears two syllables).
- Everything else unchanged (dictionary phones, aligner settles disputed counts).

## Out of scope

Naming on screen (Greg decides later), the function-word stress problem ("kiss me with"), the
visual language rework, pushing or merging.
