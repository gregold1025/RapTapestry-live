// src/utils/extractVowels.js
const VOWELS = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "UW",
]);

export function extractVowels(phoneStr) {
  return String(phoneStr ?? "")
    .split(" ")
    .map((p) => p.replace(/[0-9]/g, ""))
    .filter((p) => VOWELS.has(p));
}
