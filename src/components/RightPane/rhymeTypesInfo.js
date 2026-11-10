// src/components/RightPane/rhymeTypesInfo.js
// The text of the focused query's info pop-up (Greg 2026-11-09): what the type pills mean, as the
// protocol's two-syllable chart (vault: "Rhyme engine - current", section 4). Each type gets its own
// block: its rule across the four axes, its definition, and an example pair spelled out and split
// phonetically onto the axes, the parts the type requires to agree underlined (Greg 2026-11-09). A
// test runs every example through the engine, so the chart cannot drift from what the engine does.
import { RHYME_TYPES } from "../../engine";
import { syllabify, bare } from "../../utils/syllabify.js";

const label = (key) => RHYME_TYPES.find((t) => t.key === key).label;

export const INTRO =
  "A match is compared foot by foot, from the end of the query backward. A foot is a stressed " +
  "syllable and the unstressed syllables after it (DIG-its is one foot). The last foot gives the " +
  "match its type; the pills show or hide each type.";

// the four axes of a two-syllable foot, left to right; a one-syllable word has only the last two
export const AXES = [
  { key: "stressedVowel", label: "Stressed vowel" },
  { key: "internal", label: "Middle consonants", note: "between the two vowels" },
  { key: "finalVowel", label: "Final vowel", oneSyllable: true },
  { key: "coda", label: "Final consonants", oneSyllable: true },
];

/** A word's phones (dictionary string) on the four axes, as the engine syllabifies them; "" = none. */
export function axisPhones(phones) {
  const sy = syllabify(phones.trim().split(/\s+/).map((p) => ({ p })))
    .map(({ phones: ph, v }) => ({ on: ph.slice(0, v).map((x) => bare(x.p)), v: bare(ph[v].p), coda: ph.slice(v + 1).map((x) => bare(x.p)) }));
  const last = sy[sy.length - 1];
  const two = sy.length >= 2 ? sy[sy.length - 2] : null;
  return {
    stressedVowel: two ? two.v : "",
    internal: two ? [...two.coda, ...last.on].join(" ") : "",
    finalVowel: last.v,
    coda: last.coda.join(" "),
  };
}

// The chart's shorthand (Greg 2026-11-09): what each axis may be, in the vocabulary below.
// FA = family and additive at once (one consonant added or dropped, the rest within family).
export const CODES = ["S", "F", "A", "FA", "W", "X"];
export const VOCAB = [
  { code: "S", label: "Same", text: "Identical phonemes, vowels or consonants." },
  { code: "F", label: "Family", text: "Consonants with similar features.", example: "clock / stop" },
  { code: "A", label: "Additive", text: "One consonant added or dropped from a cluster.", example: "mat / mast; clock / blocks" },
  { code: "W", label: "Weak", text: "Unstressed [AH IH EH] vowels are voiced the same.", example: "famous / Hey, miss" },
  { code: "X", label: "Unrelated", text: "Unrelated phonemes." },
];
export const FA_NOTE = { text: "Family and additive at once.", example: "hot / rocks" };

/** The axes a row requires to agree (underlined in its example): those that may not be X. */
export const matchedAxes = (row) => AXES.map((a) => a.key).filter((k) => row.cells[k] && !row.cells[k].includes("X"));

// an example word: its spelling cut into pieces, each piece tagged with the axes it spells
const ex = (word, phones, ...spelling) => ({ word, phones, spelling });
const LOOSE = ["S", "F", "A", "FA"];

export const ROWS = [
  { key: "perfect", text: "Everything from the stressed vowel on repeats; the opening consonants are free.",
    cells: { stressedVowel: ["S"], internal: ["S"], finalVowel: ["S", "W"], coda: ["S"] },
    example: [
      ex("candle", "K AE1 N D AH0 L", ["c"], ["a", "stressedVowel"], ["nd", "internal"], ["le", "finalVowel", "coda"]),
      ex("handle", "HH AE1 N D AH0 L", ["h"], ["a", "stressedVowel"], ["nd", "internal"], ["le", "finalVowel", "coda"]),
    ] },
  { key: "loosened", text: "The stressed vowel repeats; the consonants after it loosen (the tags say how).",
    cells: { stressedVowel: ["S"], internal: [...LOOSE, "X"], finalVowel: ["S", "W"], coda: LOOSE },
    example: [
      ex("rapid", "R AE1 P IH0 D", ["r"], ["a", "stressedVowel"], ["p", "internal"], ["i", "finalVowel"], ["d", "coda"]),
      ex("habit", "HH AE1 B AH0 T", ["h"], ["a", "stressedVowel"], ["b", "internal"], ["i", "finalVowel"], ["t", "coda"]),
    ] },
  { key: "shifted", text: "The stressed vowel changes; the rest of the foot repeats.",
    cells: { stressedVowel: ["X"], internal: LOOSE, finalVowel: ["S", "W"], coda: ["S"] },
    example: [
      ex("jacket", "JH AE1 K AH0 T", ["j"], ["a", "stressedVowel"], ["ck", "internal"], ["e", "finalVowel"], ["t", "coda"]),
      ex("rocket", "R AA1 K AH0 T", ["r"], ["o", "stressedVowel"], ["ck", "internal"], ["e", "finalVowel"], ["t", "coda"]),
    ] },
  { key: "truncated", text: "Tentative. Only the ending repeats: the final vowel and the final consonants.",
    cells: { stressedVowel: ["X"], internal: ["X"], finalVowel: ["S", "W"], coda: LOOSE },
    example: [
      ex("pencil", "P EH1 N S AH0 L", ["p"], ["e", "stressedVowel"], ["nc", "internal"], ["i", "finalVowel"], ["l", "coda"]),
      ex("simple", "S IH1 M P AH0 L", ["s"], ["i", "stressedVowel"], ["mp", "internal"], ["le", "finalVowel", "coda"]),
    ] },
].map((r) => ({ ...r, label: label(r.key) }));

// each section opens with a short sentence (Greg 2026-11-09)
export const ONE_SYLLABLE = {
  text: "A one-syllable word is compared by its vowel and its final consonants.",
  rows: [
    { key: "perfect", cells: { finalVowel: ["S"], coda: ["S"] },
      example: [
        ex("block", "B L AA1 K", ["bl"], ["o", "finalVowel"], ["ck", "coda"]),
        ex("glock", "G L AA1 K", ["gl"], ["o", "finalVowel"], ["ck", "coda"]),
      ] },
    // the same final consonants make a one-syllable pair perfect, so loosened is F, A or FA there
    { key: "loosened", cells: { finalVowel: ["S"], coda: ["F", "A", "FA"] },
      example: [
        ex("clock", "K L AA1 K", ["cl"], ["o", "finalVowel"], ["ck", "coda"]),
        ex("blocks", "B L AA1 K S", ["bl"], ["o", "finalVowel"], ["cks", "coda"]),
      ] },
  ].map((r) => ({ ...r, label: label(r.key) })),
};

export const TWO_SYLLABLES = {
  text: "A two-syllable foot compares on four columns. Which of them must agree decides its type.",
};
