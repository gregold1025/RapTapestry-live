// The session file (Greg 2026-11-09): one song's whole session as JSON, glyphs by name.
import { describe, it, expect } from "vitest";
import { SESSION_FORMAT, SESSION_VERSION, sessionFileName, toFileValue, fromFileValue, buildSessionFile, parseSessionFile } from "../sessionFile";

const NAMES = { "/a/x-123.svg": "svg_shapes/x", "/a/line-1.svg": "svg_lines/line" };
const nameOf = (u) => NAMES[u] ?? null;
const URLS = Object.fromEntries(Object.entries(NAMES).map(([u, n]) => [n, u]));
const urlOf = (r) => URLS[r] ?? null;

const parts = {
  song: "Amen",
  params: { staffTextPx: 12, glyphStyle: { syllableGlyphUrl: "/a/x-123.svg", drumGlyphUrl: "/a/line-1.svg", bassDividerUrl: null }, drumClasses: { kick: { size: 16, glyphUrl: "/a/x-123.svg" } } },
  ui: { staffOpen: true, globalSections: { tapestry: false, staff: true, clock: false } },
  mix: { muted: { vocals: true }, soloed: null, visible: { vocals: true }, volume: 0.8 },
  loop: { on: true, start: 2, end: 6 },
  queries: { queries: [{ id: "q1", kind: "word", anchorIds: ["w1"], color: "#ff0000", types: new Set(["perfect", "loosened"]), radius: null }], focusedId: "q1", solo: false },
};

describe("the session file", () => {
  it("is tagged and versioned", () => {
    expect([SESSION_FORMAT, SESSION_VERSION]).toEqual(["rap-tapestry-session", 1]);
  });
  it("is named after the song and the date", () => {
    expect(sessionFileName("Amen", new Date("2026-11-09T12:00:00"))).toBe("Amen-session-2026-11-09.json");
  });
  it("round-trips a whole session, Sets and glyphs included", () => {
    const text = buildSessionFile(parts, { now: new Date("2026-11-09T12:00:00Z"), assetNameOf: nameOf });
    const head = JSON.parse(text);
    expect([head.format, head.version, head.savedAt, head.song]).toEqual(["rap-tapestry-session", 1, "2026-11-09T12:00:00.000Z", "Amen"]);
    expect(head.params.glyphStyle.syllableGlyphUrl).toBe("asset:svg_shapes/x");
    expect(head.queries.queries[0].types).toEqual({ $set: ["perfect", "loosened"] });
    const r = parseSessionFile(text, { assetUrlOf: urlOf });
    expect(r.ok).toBe(true);
    expect(r.notes).toEqual([]);
    expect(r.session).toEqual(parts);
  });
  it("finds glyphs by name on another build", () => {
    const enc = toFileValue({ g: "/a/x-123.svg" }, nameOf);
    expect(fromFileValue(enc, (r) => ({ "svg_shapes/x": "/b/x-999.svg" })[r] ?? null)).toEqual({ g: "/b/x-999.svg" });
  });
  it("turns a glyph the app no longer has into null", () => {
    expect(fromFileValue({ g: "asset:svg_shapes/gone" }, urlOf)).toEqual({ g: null });
  });
  it("refuses what is not a session file", () => {
    const bad = parseSessionFile("not json", { assetUrlOf: urlOf });
    expect(bad.ok).toBe(false);
    expect(bad.error).toMatch(/not a session file/);
    expect(parseSessionFile('{"a":1}', { assetUrlOf: urlOf }).ok).toBe(false);
    expect(parseSessionFile(JSON.stringify({ format: SESSION_FORMAT, version: 1 }), { assetUrlOf: urlOf }).ok).toBe(false);
  });
  it("loads a newer version's file and says so; ignores unknown keys", () => {
    const r = parseSessionFile(JSON.stringify({ format: SESSION_FORMAT, version: 2, song: "Amen", params: {}, extra: 1 }), { assetUrlOf: urlOf });
    expect(r.ok).toBe(true);
    expect(r.notes.join(" ")).toMatch(/saved by a newer version/);
    expect(r.session).toEqual({ song: "Amen", params: {}, ui: {}, mix: {}, loop: null, queries: null });
  });
});
