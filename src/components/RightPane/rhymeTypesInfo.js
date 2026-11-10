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

// a cell that leaves its axis free: nothing there is underlined
const FREE = new Set(["", "anything", "anything else", "differs"]);
/** The axes a row requires to agree (underlined in its example). */
export const matchedAxes = (row) => AXES.map((a) => a.key).filter((k) => !FREE.has(row.cells[k]));

// an example word: its spelling cut into pieces, each piece tagged with the axes it spells
const ex = (word, phones, ...spelling) => ({ word, phones, spelling });
const LOOSE = "same, family, additive or both";

export const ROWS = [
  { key: "perfect", text: "Everything from the stressed vowel on repeats; the opening consonants are free.",
    cells: { stressedVowel: "same", internal: "same", finalVowel: "same or weak", coda: "same" },
    example: [
      ex("candle", "K AE1 N D AH0 L", ["c"], ["a", "stressedVowel"], ["nd", "internal"], ["le", "finalVowel", "coda"]),
      ex("handle", "HH AE1 N D AH0 L", ["h"], ["a", "stressedVowel"], ["nd", "internal"], ["le", "finalVowel", "coda"]),
    ] },
  { key: "loosened", text: "The stressed vowel repeats; the consonants after it loosen (the tags say how).",
    cells: { stressedVowel: "same", internal: "anything", finalVowel: "same or weak", coda: LOOSE },
    example: [
      ex("rapid", "R AE1 P IH0 D", ["r"], ["a", "stressedVowel"], ["p", "internal"], ["i", "finalVowel"], ["d", "coda"]),
      ex("habit", "HH AE1 B AH0 T", ["h"], ["a", "stressedVowel"], ["b", "internal"], ["i", "finalVowel"], ["t", "coda"]),
    ] },
  { key: "shifted", text: "The stressed vowel changes; the rest of the foot repeats.",
    cells: { stressedVowel: "differs", internal: LOOSE, finalVowel: "same or weak", coda: "same" },
    example: [
      ex("jacket", "JH AE1 K AH0 T", ["j"], ["a", "stressedVowel"], ["ck", "internal"], ["e", "finalVowel"], ["t", "coda"]),
      ex("rocket", "R AA1 K AH0 T", ["r"], ["o", "stressedVowel"], ["ck", "internal"], ["e", "finalVowel"], ["t", "coda"]),
    ] },
  { key: "truncated", text: "Tentative. Only the ending repeats: the final vowel and the final consonants.",
    cells: { stressedVowel: "differs", internal: "anything else", finalVowel: "same or weak", coda: LOOSE },
    example: [
      ex("pencil", "P EH1 N S AH0 L", ["p"], ["e", "stressedVowel"], ["nc", "internal"], ["i", "finalVowel"], ["l", "coda"]),
      ex("simple", "S IH1 M P AH0 L", ["s"], ["i", "stressedVowel"], ["mp", "internal"], ["le", "finalVowel", "coda"]),
    ] },
].map((r) => ({ ...r, label: label(r.key) }));

export const ONE_SYLLABLE = {
  text: "A one-syllable word has one vowel and its final consonants, so only the last two columns " +
    "apply, and its vowel must be the same: it is perfect or loosened, never shifted or truncated.",
  rows: [
    { key: "perfect", cells: { stressedVowel: "", internal: "", finalVowel: "same", coda: "same" },
      example: [
        ex("block", "B L AA1 K", ["bl"], ["o", "finalVowel"], ["ck", "coda"]),
        ex("glock", "G L AA1 K", ["gl"], ["o", "finalVowel"], ["ck", "coda"]),
      ] },
    { key: "loosened", cells: { stressedVowel: "", internal: "", finalVowel: "same", coda: LOOSE },
      example: [
        ex("clock", "K L AA1 K", ["cl"], ["o", "finalVowel"], ["ck", "coda"]),
        ex("blocks", "B L AA1 K S", ["bl"], ["o", "finalVowel"], ["cks", "coda"]),
      ] },
  ].map((r) => ({ ...r, label: label(r.key) })),
};

export const TERMS = [
  { key: "family", label: "Family", text: "A consonant swapped for one of its kind: plosives (p b t d k g), fricatives (f v th s z sh zh), nasals (m n ng); voicing free.", example: "clock / stop" },
  { key: "additive", label: "Additive", text: "Exactly one consonant added or dropped, anywhere; the rest identical.", example: "mat / mast; clock / blocks" },
  { key: "both", label: "Family + additive", text: "Both at once.", example: "hot / rocks" },
  { key: "weak", label: "Weak", text: "Unstressed uh, ih and eh count as the same vowel.", example: "famous / Hey, miss" },
];
