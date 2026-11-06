// src/components/ClockPane/clockDefaults.js
// The Rhyme Clock's starting settings (ParamsContext reads them).
export const CLOCK_DEFAULTS = Object.freeze({
  cycleBars: 1,               // bars per turn: 1 | 2 | 4
  rings: 8,                   // rings shown: 1 | 2 | 4 | 8 | 16 | 32 | "all"
  index: 0,                   // the current ring's position, 0 = outermost
  words: "all",               // "all" | "query"
  backgroundColor: "#f7f7f9",
  wordColor: "#6b6e76",       // words not in a query
  textPx: 12,
  showDrums: true,
  drumScale: 1,
});
