// src/engine/syllableCounts.js
// Words whose dictionary readings disagree on the number of syllables (Dial: D AY1 AH0 L / D AY1 L).
// The forced aligner (MFA, experiments/mfa-02-formants, arm C) settles the count; the readings
// with any other count are dropped. This is the ONLY use of the aligner for pronunciation
// (Greg, 2026-11-05). `greg: true` = Greg overrode the aligner by ear. Every entry is to be
// checked by ear once; key = line-word index in the app's lyric-transcription.json.
export const SYLLABLE_COUNTS = {
  '93Til': {
    '7-0': { text: "Dial", count: 1, aligner: 1 },
    '46-4': { text: "our", count: 1, aligner: 1 },
    '57-3': { text: "fattenin'", count: 3, aligner: 3 },
    '82-2': { text: "am", count: 1, aligner: 1 },
    '87-1': { text: "extraordinary", count: 5, aligner: 5 },
    '109-1': { text: "Casual", count: 2, aligner: 2 },
  },
  'Amen': {
    '3-8': { text: "probably", count: 2, aligner: 2 },
    '39-1': { text: "am", count: 1, aligner: 1 },
    '39-5': { text: "Am", count: 1, aligner: 1 },
    '41-6': { text: "fire", count: 1, aligner: 1 },
  },
  'RhymesLikeDimes': {
    '19-6': { text: "us", count: 1, aligner: 1 },
    '55-5': { text: "us", count: 1, aligner: 1 },
    '67-4': { text: "listenin'", count: 2, aligner: 2 },
    '87-1': { text: "listenin'", count: 2, aligner: 2 },
  },
  'Unemployed': {
    '3-1': { text: "it'll", count: 2, aligner: 2 },
    '11-5': { text: "minerals", count: 3, aligner: 3 },
    '12-9': { text: "men'll", count: 2, aligner: 2 },
    '15-7': { text: "miserable", count: 4, aligner: 4 },
    '30-4': { text: "beverage", count: 2, aligner: 2 },
    '67-5': { text: "am", count: 1, aligner: 2, greg: true },
  },
};
