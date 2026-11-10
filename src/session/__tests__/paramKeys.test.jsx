// Every parameter is in the session (Greg 2026-11-09: "everything"): the key list must match the
// Params context's state, and restoring takes the file's value or the default (replace, not merge).
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ParamsProvider, useParams } from "../../contexts/ParamsContext";
import { PARAM_KEYS, paramsToApply } from "../paramKeys";

let ctx = null;
function Probe() { ctx = useParams(); return null; }
renderToStaticMarkup(<ParamsProvider><Probe /></ParamsProvider>);
const cap = (k) => k[0].toUpperCase() + k.slice(1);

describe("the parameters in a session", () => {
  it("covers every state value of the Params context, each with its setter", () => {
    for (const k of PARAM_KEYS) {
      expect([k, k in ctx]).toEqual([k, true]);
      expect([k, typeof ctx["set" + cap(k)]]).toEqual([k, "function"]);
    }
    const values = Object.keys(ctx).filter((k) => typeof ctx[k] !== "function" && k !== "glyphAssets");
    expect(values.filter((k) => !PARAM_KEYS.includes(k))).toEqual([]);
  });
  it("takes the file's value, else the default", () => {
    expect(paramsToApply({ staffTextPx: 20 }, { staffTextPx: 12, gridLevel: 2 }, ["staffTextPx", "gridLevel"])).toEqual({ staffTextPx: 20, gridLevel: 2 });
  });
  it("fills a drum row the file lacks from the default", () => {
    const K = { size: 20 }, K0 = { size: 16 }, S0 = { size: 14 };
    expect(paramsToApply({ drumClasses: { kick: K } }, { drumClasses: { kick: K0, snare: S0 } }, ["drumClasses"])).toEqual({ drumClasses: { kick: K, snare: S0 } });
  });
  it("names glyphs by folder and finds them again", () => {
    const { syllableGlyphUrls, drumGlyphUrls, bassDividerUrls } = ctx.glyphAssets;
    for (const url of [syllableGlyphUrls[0], drumGlyphUrls[0], bassDividerUrls[0]]) {
      const name = ctx.assetNameOf(url);
      expect(name).toMatch(/^svg_(shapes|lines|dividers)\//);
      expect(ctx.assetUrlOf(name)).toBe(url);
    }
    expect(ctx.assetNameOf("#ffffff")).toBeNull();
  });
  it("snapshots every key", () => {
    expect(Object.keys(ctx.getParamsSnapshot()).sort()).toEqual([...PARAM_KEYS].sort());
  });
});
