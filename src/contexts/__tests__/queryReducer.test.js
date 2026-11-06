import { describe, it, expect } from "vitest";
import { queryReducer, initialQueryState, clickFocuses } from "../queryReducer";

// A tiny song: flat order 0..5, ids "0-0".."0-5"
const flat = ["0-0", "0-1", "0-2", "0-3", "0-4", "0-5"];
const flatOf = (id) => flat.indexOf(id);
// matches: query on 0-1 matches 0-4 (an assonance); everything else matches nothing.
// The env receives the query itself so the context can honor the query's shown types.
const matchesFor = (q) => (q.anchorIds.includes("0-1") && q.types.has("assonance") ? ["0-4"] : []);
// drawnOwner: the query whose color a matched word is drawn in (the context reads it from the
// per-word visuals); here the most recent active query that shows the word.
const drawnOwner = (wordId, st) => [...st.queries].reverse().find((q) => q.active && q.kind !== "line" && matchesFor(q).includes(wordId))?.id ?? null;
const env = { flatOf, idAt: (i) => flat[i], drawnOwner };

const click = (st, wordId, mods = {}) => queryReducer(st, { type: "click", wordId, ...mods }, env);

describe("queryReducer", () => {
  it("a plain click on a free word creates a query and focuses it", () => {
    const st = click(initialQueryState, "0-1");
    expect(st.queries.length).toBe(1);
    expect(st.queries[0].anchorIds).toEqual(["0-1"]);
    expect(st.focusedId).toBe(st.queries[0].id);
    expect(st.queries[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("shift-click with no focused query creates a query (does not throw)", () => {
    const st = click(initialQueryState, "0-2", { shift: true });
    expect(st.queries.length).toBe(1);
    expect(st.queries[0].anchorIds).toEqual(["0-2"]);
  });

  it("shift-click extends the focused query to a contiguous run, lowest to highest", () => {
    let st = click(initialQueryState, "0-3");
    st = click(st, "0-1", { shift: true });
    expect(st.queries[0].anchorIds).toEqual(["0-1", "0-2", "0-3"]);
  });

  it("a plain click on a match of A focuses A and highlights that match; nothing moves", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = click(st, "0-3");
    st = click(st, "0-4");
    expect(st.queries.length).toBe(2);
    expect(st.queries[0].anchorIds).toEqual(["0-1"]);
    expect(st.focusedId).toBe(id);
    expect(st.highlight).toEqual({ wordId: "0-4" });
  });

  it("a word matched by two queries opens the one it is drawn in", () => {
    let st = click(initialQueryState, "0-1");
    st = click(st, "0-3");
    const [a, b] = st.queries.map((q) => q.id);
    const drawnInB = { ...env, drawnOwner: (w) => (w === "0-5" ? b : null) };
    st = queryReducer({ ...st, focusedId: a }, { type: "click", wordId: "0-5" }, drawnInB);
    expect(st.focusedId).toBe(b);
    expect(st.highlight).toEqual({ wordId: "0-5" });
  });

  it("a reveal click (tapestry, Line Staff) opens the query of a match or an anchor, and never makes one", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = click(st, "0-3");
    expect(click(st, "0-2", { reveal: true })).toBe(st);
    const m = click(st, "0-4", { reveal: true });
    expect(m.focusedId).toBe(id);
    expect(m.highlight).toEqual({ wordId: "0-4" });
    const a = click(st, "0-1", { reveal: true });
    expect(a.focusedId).toBe(id);
    expect(a.highlight).toBeNull();
  });

  it("focusing a query clears the highlighted match", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = click(st, "0-3");
    st = click(st, "0-4");
    st = queryReducer(st, { type: "focus", id: st.queries[1].id }, env);
    expect(st.highlight).toBeNull();
    st = queryReducer(st, { type: "focus", id }, env);
    expect(st.highlight).toBeNull();
  });

  it("selecting a match in the list takes the highlight from the clicked one", () => {
    let st = click(initialQueryState, "0-1");
    st = click(st, "0-4");
    expect(st.highlight).toEqual({ wordId: "0-4" });
    st = queryReducer(st, { type: "highlight", highlight: { wordId: "0-5" } }, env);
    expect(st.highlight).toEqual({ wordId: "0-5" });
    expect(queryReducer(st, { type: "highlight", highlight: { wordId: "0-5" } }, env)).toBe(st);
  });

  it("clickFocuses: a click focuses a query unless it removes, or reveals a free word", () => {
    const st = click(initialQueryState, "0-1");
    const act = (wordId, mods = {}) => ({ type: "click", wordId, ...mods });
    expect(clickFocuses(st, act("0-2"), env)).toBe(true);
    expect(clickFocuses(st, act("0-4", { meta: true }), env)).toBe(true);
    expect(clickFocuses(st, act("0-4", { alt: true }), env)).toBe(false);
    expect(clickFocuses(st, act("0-2", { reveal: true }), env)).toBe(false);
    expect(clickFocuses(st, act("0-4", { reveal: true }), env)).toBe(true);
    expect(clickFocuses(st, act("0-1", { reveal: true }), env)).toBe(true);
  });

  it("clicking an anchor of A focuses A without changing it", () => {
    let st = click(initialQueryState, "0-1");
    st = click(st, "0-3");
    st = click(st, "0-1");
    expect(st.queries.length).toBe(2);
    expect(st.focusedId).toBe(st.queries[0].id);
    expect(st.queries[0].anchorIds).toEqual(["0-1"]);
  });

  it("cmd-click always creates a new query, even on a match", () => {
    let st = click(initialQueryState, "0-1");
    st = click(st, "0-4", { meta: true });
    expect(st.queries.length).toBe(2);
  });

  it("alt-click removes the query that owns the word", () => {
    let st = click(initialQueryState, "0-1");
    st = click(st, "0-4", { alt: true });
    expect(st.queries.length).toBe(0);
    expect(st.focusedId).toBeNull();
  });

  it("remove, toggleActive, setTypes, focus, clear", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = queryReducer(st, { type: "toggleActive", id }, env);
    expect(st.queries[0].active).toBe(false);
    st = queryReducer(st, { type: "setTypes", id, types: ["perfect"] }, env);
    expect([...st.queries[0].types]).toEqual(["perfect"]);
    st = click(st, "0-3");
    st = queryReducer(st, { type: "focus", id }, env);
    expect(st.focusedId).toBe(id);
    st = queryReducer(st, { type: "remove", id }, env);
    expect(st.queries.length).toBe(1);
    st = queryReducer(st, { type: "clear" }, env);
    expect(st.queries.length).toBe(0);
  });

  it("a word whose match type is toggled off is free: clicking it starts a new query (no adopt)", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = queryReducer(st, { type: "setTypes", id, types: ["perfect"] }, env);
    st = click(st, "0-4");
    expect(st.queries.length).toBe(2);
    expect(st.queries[0].anchorIds).toEqual(["0-1"]);
  });

  // Line queries: their own kind. Line 0 ends in 0-5; line 1 is "1-0".."1-2"; a line
  // query on line 0 matches line 1 (end rhyme), nothing else.
  const lineEnv = {
    ...env,
    lastWordOf: (li) => (li === 0 ? "0-5" : li === 1 ? "1-2" : null),
    drawnLineOwner: (li, st) => (li === 1 ? [...st.queries].reverse().find((q) => q.active && q.kind === "line" && q.lineIdx === 0)?.id ?? null : null),
  };
  const clickLine = (st, lineIdx, mods = {}) => queryReducer(st, { type: "clickLine", lineIdx, ...mods }, lineEnv);

  it("clicking a line's square makes a line query anchored on that line", () => {
    const st = clickLine(initialQueryState, 0);
    expect(st.queries.length).toBe(1);
    expect(st.queries[0].kind).toBe("line");
    expect(st.queries[0].lineIdx).toBe(0);
    expect(st.queries[0].anchorIds).toEqual(["0-5"]);
    expect(st.focusedId).toBe(st.queries[0].id);
  });
  it("clicking a matched line focuses its line query and highlights that line; nothing moves", () => {
    let st = clickLine(initialQueryState, 0);
    const id = st.queries[0].id;
    st = click(st, "0-2");
    st = clickLine(st, 1);
    expect(st.queries.length).toBe(2);
    expect(st.queries[0].lineIdx).toBe(0);
    expect(st.focusedId).toBe(id);
    expect(st.highlight).toEqual({ lineIdx: 1 });
  });
  it("a reveal click on a line opens its line query, never makes one", () => {
    let st = clickLine(initialQueryState, 0);
    const id = st.queries[0].id;
    st = click(st, "0-2");
    expect(clickLine(st, 2, { reveal: true })).toBe(st);
    expect(clickLine(st, 1, { reveal: true }).focusedId).toBe(id);
    expect(clickLine(st, 0, { reveal: true }).focusedId).toBe(id);
  });
  it("cmd-click on a matched line makes a new line query", () => {
    let st = clickLine(initialQueryState, 0);
    st = clickLine(st, 1, { meta: true });
    expect(st.queries.length).toBe(2);
    expect(st.queries[1].lineIdx).toBe(1);
  });
  it("word clicks never adopt a line query, even on the line's last word", () => {
    let st = clickLine(initialQueryState, 0);
    st = queryReducer(st, { type: "click", wordId: "0-5" }, lineEnv);
    expect(st.queries.length).toBe(2);
    expect(st.queries[0].kind).toBe("line");
    expect(st.queries[1].kind).toBe("word");
  });
  it("alt-clicking a line removes the line query that owns it", () => {
    let st = clickLine(initialQueryState, 0);
    st = clickLine(st, 1, { alt: true });
    expect(st.queries.length).toBe(0);
  });
  it("every query carries its kind", () => {
    const st = click(initialQueryState, "0-1");
    expect(st.queries[0].kind).toBe("word");
  });

  it("cmd-click on a word that is already a query focuses it instead of duplicating it", () => {
    let st = click(initialQueryState, "0-1", { meta: true });
    st = click(st, "0-3", { meta: true });
    st = click(st, "0-1", { meta: true });
    expect(st.queries.length).toBe(2);
    expect(st.focusedId).toBe(st.queries[0].id);
  });
});

describe("search radius (Greg 2026-11-05: per query, in bars, default whole song)", () => {
  it("a new query searches the whole song (radius null)", () => {
    expect(click(initialQueryState, "0-1").queries[0].radius).toBeNull();
  });
  it("setRadius sets one query's radius; null is the whole song again", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = queryReducer(st, { type: "setRadius", id, radius: 4 }, env);
    expect(st.queries[0].radius).toBe(4);
    st = queryReducer(st, { type: "setRadius", id, radius: null }, env);
    expect(st.queries[0].radius).toBeNull();
  });
});
