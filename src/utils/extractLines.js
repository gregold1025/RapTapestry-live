// src/utils/extractLines.js
import { rhymeGate } from "./phonemeSimilarity.js";

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
 * For each line, extract the last word's phones for end-rhyme comparison.
 *
 * Returns:
 *  {
 *    lines: Array<{ lastWordIdx, lastWordPhones }>,
 *    exactIndex: Map<string, Set<number>>  // phonesStr -> all lineIdxs with same phones
 *  }
 */
export function extractLines(transcriptionData) {
  const lines = transcriptionData?.lines ?? [];
  const meta = [];
  const exactIndex = new Map();

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i]?.words ?? [];
    const lastWordIdx = words.length ? words.length - 1 : null;
    const lastWord = lastWordIdx != null ? words[lastWordIdx] : null;
    const lastWordPhones = getWordPhones(lastWord);

    meta.push({ lastWordIdx, lastWordPhones });

    if (lastWordPhones) {
      if (!exactIndex.has(lastWordPhones)) exactIndex.set(lastWordPhones, new Set());
      exactIndex.get(lastWordPhones).add(i);
    }
  }

  return { lines: meta, exactIndex };
}

/**
 * Given the output of extractLines and a line index, return the set of
 * matching line indices.
 *
 * @param {object}  extracted
 * @param {number}  lineIdx
 * @param {object}  [opts]
 * @param {boolean} [opts.exactMatches=false]  - exact phone string match
 * @param {number}  [opts.nucleusThreshold]    - nucleus gate threshold
 * @param {number}  [opts.codaThreshold]       - coda gate threshold
 */
export function getMatchingLinesFor(
  extracted,
  lineIdx,
  { exactMatches = false, nucleusThreshold = null, codaThreshold = null } = {}
) {
  const info = extracted?.lines?.[lineIdx];
  if (!info) return new Set();

  if (exactMatches) {
    return new Set(extracted.exactIndex.get(info.lastWordPhones) ?? []);
  }

  if (nucleusThreshold !== null) {
    const matches = new Set();
    extracted.lines.forEach((other, i) => {
      if (other) {
        const { match } = rhymeGate(info.lastWordPhones, other.lastWordPhones, nucleusThreshold, codaThreshold ?? 0);
        if (match) matches.add(i);
      }
    });
    return matches;
  }

  return new Set();
}
