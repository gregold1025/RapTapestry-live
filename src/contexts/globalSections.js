// src/contexts/globalSections.js
// The Global panel's collapsible submenus (Greg 2026-11-09): the tapestry, the Line Staff and the
// Rhyme Clock. A header click folds or unfolds its own submenu; a pane's "settings" button opens
// Global with that pane's submenu open and the other two folded.
export const GLOBAL_SECTIONS = ["tapestry", "staff", "clock"];
export const INITIAL_SECTIONS = Object.fromEntries(GLOBAL_SECTIONS.map((k) => [k, false]));   // all closed at first (Greg 2026-11-09)

export const toggleSection = (state, key) => ({ ...state, [key]: !state[key] });

export const focusSection = (state, key) =>
  GLOBAL_SECTIONS.includes(key) ? Object.fromEntries(GLOBAL_SECTIONS.map((k) => [k, k === key])) : state;
