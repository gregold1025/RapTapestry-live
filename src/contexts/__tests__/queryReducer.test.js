import { describe, it, expect } from "vitest";
import { queryReducer, initialQueryState } from "../queryReducer";

// A tiny song: flat order 0..5, ids "0-0".."0-5"
const flat = ["0-0", "0-1", "0-2", "0-3", "0-4", "0-5"];
const flatOf = (id) => flat.indexOf(id);
// matches: query on 0-1 matches 0-4 (an assonance); everything else matches nothing.
// The env receives the query itself so the context can honor the query's shown types.
const matchesFor = (q) => (q.anchorIds.includes("0-1") && q.types.has("assonance") ? ["0-4"] : []);
const env = { flatOf, idAt: (i) => flat[i], matchesFor };

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

  it("clicking a match of query A adopts A: its anchor moves to the clicked word", () => {
    let st = click(initialQueryState, "0-1");
    const id = st.queries[0].id;
    st = click(st, "0-4");
    expect(st.queries.length).toBe(1);
    expect(st.queries[0].id).toBe(id);
    expect(st.queries[0].anchorIds).toEqual(["0-4"]);
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
    lineMatchesFor: (q) => (q.kind === "line" && q.lineIdx === 0 ? [1] : []),
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
  it("clicking a matched line adopts the line query; clicking its own line focuses it", () => {
    let st = clickLine(initialQueryState, 0);
    const id = st.queries[0].id;
    st = clickLine(st, 1);
    expect(st.queries.length).toBe(1);
    expect(st.queries[0].id).toBe(id);
    expect(st.queries[0].lineIdx).toBe(1);
    expect(st.queries[0].anchorIds).toEqual(["1-2"]);
    st = clickLine(st, 1);
    expect(st.queries.length).toBe(1);
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
});
