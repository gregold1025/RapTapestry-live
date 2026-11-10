// The view in a session (Greg 2026-11-09: "everything, except the playhead"): which panes are
// open and how; restoring takes the file's value or the default.
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UIStateProvider, useUIState } from "../../contexts/UIStateContext";
import { UI_KEYS, uiToApply } from "../uiKeys";

let ctx = null;
function Probe() { ctx = useUIState(); return null; }
renderToStaticMarkup(<UIStateProvider><Probe /></UIStateProvider>);
const cap = (k) => k[0].toUpperCase() + k.slice(1);

describe("the view in a session", () => {
  it("is these keys, each in the UI state with its setter", () => {
    expect(UI_KEYS).toEqual(["lyricsOpen", "rightOpen", "rightView", "paramsPanel", "staffOpen", "staffBars", "staffMode", "clockOpen", "clockFull", "globalSections", "matchGroupBy"]);
    for (const k of UI_KEYS) {
      expect([k, k in ctx]).toEqual([k, true]);
      expect([k, typeof ctx["set" + cap(k)]]).toEqual([k, "function"]);
    }
  });
  it("starts with the clock docked and matches by time", () => {
    expect([ctx.clockFull, ctx.matchGroupBy]).toEqual([false, "time"]);
  });
  it("takes the file's value, else the default", () => {
    expect(uiToApply({ staffOpen: true }, { staffOpen: false, staffBars: 4 }, ["staffOpen", "staffBars"])).toEqual({ staffOpen: true, staffBars: 4 });
  });
  it("snapshots every key", () => {
    expect(Object.keys(ctx.getUISnapshot())).toEqual(UI_KEYS);
  });
});
