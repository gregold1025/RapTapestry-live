// src/components/LyricsView/lineClick.js
// A click on a lyrics line's own space makes or opens its line query (Greg 2026-11-10: in place of
// the square button). A word and the jump button keep their own clicks.
const OWN_PARTS = ".word-wrapper, .line-jump";

/** Is this click on the line itself (not inside a word or the jump button)? */
export const isLineClick = (target) => !target?.closest?.(OWN_PARTS);
