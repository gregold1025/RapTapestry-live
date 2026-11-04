// Hand-written ARPABET for words the pipeline's dictionary lookup missed (it
// stored the word's text in place of phones). Applied by songData.js at load
// time; the app's data files are untouched.
//
// Keys: song id -> normalized word text (lowercase, outer punctuation stripped,
// apostrophes kept). `check: true` = a name or coinage whose pronunciation is a
// guess; please verify. Upstream fix belongs in the transcription pipeline (G2P
// fallback for out-of-dictionary words).
//
// Dropped-g words (chillin') use NG, matching how the pipeline transcribed the
// occurrences it did find (as "chilling"), so identical words compare as identical.
export const PHONE_OVERRIDES = {
  '93Til': {
    'tajay': { phones: 'T AH0 JH AY1', check: true }, // Tajai of Souls of Mischief
    'phesto': { phones: 'F EH1 S T OW0', check: true },
    "maxin'": { phones: 'M AE1 K S IH0 NG' },
    "gon'": { phones: 'G AA1 N' },
    'stoge': { phones: 'S T OW1 JH' },
    "flick's": { phones: 'F L IH1 K S' },
    "poppin'": { phones: 'P AA1 P IH0 NG' },
    'backroads': { phones: 'B AE1 K R OW2 D Z' },
    'niggas': { phones: 'N IH1 G AH0 Z' },
    "'noid": { phones: 'N OY1 D' },
    'zomba': { phones: 'Z AA1 M B AH0', check: true },
    "i'ma": { phones: 'AY1 M AH0' },
    "sayin'": { phones: 'S EY1 IH0 NG' },
    "chillin'": { phones: 'CH IH1 L IH0 NG' },
    'ayy': { phones: 'EY1' },
    'snupe': { phones: 'S N UW1 P', check: true },
  },
  Amen: {
    'eazy': { phones: 'IY1 Z IY0' },
    'nigga': { phones: 'N IH1 G AH0' },
    'niggas': { phones: 'N IH1 G AH0 Z' },
    'shawty': { phones: 'SH AO1 T IY0' },
    "lil'": { phones: 'L IH1 L' },
    'can': { phones: 'K AE1 N' },
    'i': { phones: 'AY1' },
  },
  RhymesLikeDimes: {
    "spade's": { phones: 'S P EY1 D Z' },
    'gack': { phones: 'G AE1 K' },
    'zoka': { phones: 'Z OW1 K AH0', check: true },
    'slickness': { phones: 'S L IH1 K N AH0 S' },
    'www': { phones: 'D AH1 B AH0 L Y UW0 D AH1 B AH0 L Y UW0 D AH1 B AH0 L Y UW0', check: true },
    'handline': { phones: 'HH AE1 N D L AY2 N', check: true },
  },
  Unemployed: {
    'mistika': { phones: 'M IH0 S T IY1 K AH0', check: true },
    'niggas': { phones: 'N IH1 G AH0 Z' },
    'ayy': { phones: 'EY1' },
    'stabbacks': { phones: 'S T AE1 B AE2 K S' },
    'yo': { phones: 'Y OW1' },
    'nigga': { phones: 'N IH1 G AH0' },
  },
};

export const normalizeWord = (t = '') => t.toLowerCase().trim().replace(/^[^a-z']+|[^a-z']+$/g, '');
