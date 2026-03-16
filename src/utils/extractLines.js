// src/utils/extractLines.js
import { extractRhymingKey } from "./extractRhymingWords";
import { rhymeScore } from "./phonemeSimilarity.js";

/**
 * Safely get the phones string from a word object:
 *  - If phones is an array, prefer the first item (your convention)
 *  - Otherwise coerce to string
 */
export function getWordPhones(word) {
  if (!word) return "";
  if (Array.isArray(word.phones)) return String(word.phones[0] || "");
  return String(word.phones || "");
}

/**
 * Plural stripping for ARPAbet: removes a trailing 'S' or 'Z' phone.
 * Both are English plural/possessive suffixes (voiced sibilant Z for
 * "dogs", unvoiced S for "cats"). Consistent with WordSelectionContext.
 */
export function stripPluralPhoneSuffix(phonesStr) {
  const parts = String(phonesStr).trim().split(/\s+/);
  if (parts.length) {
    const last = parts[parts.length - 1];
    if (last === "S" || last === "Z") parts.pop();
  }
  return parts.join(" ");
}

/**
 * For each line, compute:
 *  - lastWordIdx
 *  - lastWordPhones (optionally plural-stripped)
 *  - rhymeKey (from last vowel nucleus to end; stress stripped)
 *
 * Returns:
 *  {
 *    lines: Array<{
 *      lastWordIdx: number | null,
 *      lastWordPhones: string,
 *      rhymeKey: string
 *    }>,
 *    rhymeIndex: Map<string, Set<number>> // rhymeKey -> all lineIdxs with that key
 *    exactIndex: Map<string, Set<number>> // phonesStr -> all lineIdxs with same phones
 *  }
 */
export function extractLines(
  transcriptionData,
  { ignorePlurals = false } = {}
) {
  const lines = transcriptionData?.lines ?? [];
  const meta = [];
  const rhymeIndex = new Map();
  const exactIndex = new Map();

  const addToMap = (map, key, idx) => {
    if (!key) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(idx);
  };

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i]?.words ?? [];
    const lastWordIdx = words.length ? words.length - 1 : null;

    const lastWord = lastWordIdx != null ? words[lastWordIdx] : null;
    const rawPhones = getWordPhones(lastWord);
    const normPhones = ignorePlurals
      ? stripPluralPhoneSuffix(rawPhones)
      : rawPhones;
    const rhymeKey = extractRhymingKey(normPhones);

    meta.push({
      lastWordIdx,
      lastWordPhones: normPhones,
      rhymeKey,
    });

    addToMap(rhymeIndex, rhymeKey, i);
    addToMap(exactIndex, normPhones, i);
  }

  return { lines: meta, rhymeIndex, exactIndex };
}

/**
 * Given the output of extractLines and a line index, return the set of
 * matching line indices based on:
 *  - exactMatches=true  → exact phone string match
 *  - threshold provided → pairwise rhymeScore comparison (scored mode)
 *  - neither            → legacy rhymeKey-based lookup
 *
 * @param {object}  extracted
 * @param {number}  lineIdx
 * @param {object}  [opts]
 * @param {boolean} [opts.exactMatches=false]
 * @param {number}  [opts.threshold=null]  - if provided, use scored pairwise comparison
 * @param {number}  [opts.nucleusWeight]   - nucleus/coda blend ratio passed to rhymeScore
 */
export function getMatchingLinesFor(
  extracted,
  lineIdx,
  { exactMatches = false, threshold = null, nucleusWeight } = {}
) {
  const info = extracted?.lines?.[lineIdx];
  if (!info) return new Set();

  if (exactMatches) {
    return new Set(extracted.exactIndex.get(info.lastWordPhones) ?? []);
  }

  if (threshold !== null) {
    const matches = new Set();
    extracted.lines.forEach((other, i) => {
      if (other && rhymeScore(info.lastWordPhones, other.lastWordPhones, nucleusWeight) >= threshold) {
        matches.add(i);
      }
    });
    return matches;
  }

  // legacy key-based
  return new Set(extracted.rhymeIndex.get(info.rhymeKey) ?? []);
}
