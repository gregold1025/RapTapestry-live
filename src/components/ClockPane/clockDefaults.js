// src/components/ClockPane/clockDefaults.js
// The Rhyme Clock's starting settings (ParamsContext reads them).
export const CLOCK_DEFAULTS = Object.freeze({
  cycleBars: 1,               // bars per turn: 1 | 2 | 4
  rings: 8,                   // rings shown: 1 | 2 | 4 | 8 | 16 | 32 | "all"
  words: "all",               // "all" | "query"
  backgroundColor: "#000000",
  wordColor: "#9a9da5",       // words not in a query (a light gray, to read on black)
  textPx: 12,
  showDrums: true,
  drumScale: 1,
});
