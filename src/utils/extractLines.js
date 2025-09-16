// src/utils/extractLines.js
import { extractRhymingKey } from "./extractRhymingWords";

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
 * Basic plural stripping for ARPAbet when desired:
 * Removes a trailing 'S' phone only.
 */
export function stripPluralPhoneSuffix(phonesStr) {
  const parts = String(phonesStr).trim().split(/\s+/);
  if (parts.length && parts[parts.length - 1] === "S") {
    parts.pop();
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
    const rhymeKey = extractRhymingKey(normPhones); // e.g. "ayndr" from "N AY1 N D ER0"

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
 * matching line indices based on either:
 *  - exact phones (if exactMatches === true)
 *  - rhymeKey (else)
 */
export function getMatchingLinesFor(
  extracted,
  lineIdx,
  { exactMatches = false } = {}
) {
  const info = extracted?.lines?.[lineIdx];
  if (!info) return new Set();

  if (exactMatches) {
    const set = extracted.exactIndex.get(info.lastWordPhones);
    return new Set(set ?? []);
  } else {
    const set = extracted.rhymeIndex.get(info.rhymeKey);
    return new Set(set ?? []);
  }
}
