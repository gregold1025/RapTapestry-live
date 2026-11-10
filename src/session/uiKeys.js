// src/session/uiKeys.js
// The view a session holds (Greg 2026-11-09): which panes are open and how. Each key has a setter
// set<Key> in the UI state; a test keeps the two in step.
import { paramsToApply } from "./paramKeys";

export const UI_KEYS = ["lyricsOpen", "rightOpen", "rightView", "paramsPanel", "staffOpen", "staffBars", "staffMode", "clockOpen", "clockFull", "globalSections", "matchGroupBy"];

/** What to set for each view key: the snapshot's value, else the default (same rule as parameters). */
export const uiToApply = (snapshot, defaults, keys = UI_KEYS) => paramsToApply(snapshot, defaults, keys);
