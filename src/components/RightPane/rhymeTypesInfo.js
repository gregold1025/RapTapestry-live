// src/components/RightPane/rhymeTypesInfo.js
// The text of the focused query's info pop-up (Greg 2026-11-09): what the type pills mean, as the
// protocol's two-syllable chart (vault: "Rhyme engine - current", section 4). A test runs every
// example through the engine, so the chart cannot drift from what the engine does.
import { RHYME_TYPES } from "../../engine";

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

const LOOSE = "same, family, additive or both";
export const ROWS = [
  { key: "perfect", label: label("perfect"), example: [["cooler", "K UW1 L ER0"], ["ruler", "R UW1 L ER0"]],
    cells: { stressedVowel: "same", internal: "same", finalVowel: "same or weak", coda: "same" } },
  { key: "loosened", label: label("loosened"), example: [["later", "L EY1 T ER0"], ["trader", "T R EY1 D ER0"]],
    cells: { stressedVowel: "same", internal: "anything", finalVowel: "same or weak", coda: LOOSE } },
  { key: "shifted", label: label("shifted"), example: [["ever", "EH1 V ER0"], ["over", "OW1 V ER0"]],
    cells: { stressedVowel: "differs", internal: LOOSE, finalVowel: "same or weak", coda: "same" } },
  { key: "truncated", label: label("truncated"), example: [["pencil", "P EH1 N S AH0 L"], ["simple", "S IH1 M P AH0 L"]],
    cells: { stressedVowel: "differs", internal: "anything else", finalVowel: "same or weak", coda: LOOSE } },
];

export const ONE_SYLLABLE = {
  text: "A one-syllable word has one vowel and its final consonants, so only the last two columns " +
    "apply, and its vowel must be the same: it is perfect or loosened, never shifted or truncated.",
  rows: [
    { key: "perfect", example: [["block", "B L AA1 K"], ["glock", "G L AA1 K"]] },
    { key: "loosened", example: [["clock", "K L AA1 K"], ["blocks", "B L AA1 K S"]] },
  ],
};

export const DEFINITIONS = [
  { key: "perfect", text: "Everything from the stressed vowel on repeats; the opening consonants are free." },
  { key: "loosened", text: "The stressed vowel repeats; the consonants after it loosen (the tags say how)." },
  { key: "shifted", text: "The stressed vowel changes; the rest of the foot repeats." },
  { key: "truncated", text: "Tentative. Only the ending repeats: the final vowel and the final consonants." },
].map((d) => ({ ...d, label: label(d.key) }));

export const TERMS = [
  { key: "family", label: "Family", text: "A consonant swapped for one of its kind: plosives (p b t d k g), fricatives (f v th s z sh zh), nasals (m n ng); voicing free.", example: "clock / stop" },
  { key: "additive", label: "Additive", text: "Exactly one consonant added or dropped, anywhere; the rest identical.", example: "mat / mast; clock / blocks" },
  { key: "both", label: "Family + additive", text: "Both at once.", example: "hot / rocks" },
  { key: "weak", label: "Weak", text: "Unstressed uh, ih and eh count as the same vowel.", example: "famous / Hey, miss" },
];
