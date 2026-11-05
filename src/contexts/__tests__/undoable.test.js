import { describe, it, expect } from "vitest";
import { undoable, UNDO, REDO } from "../undoable";

const counter = (state, action) => (action.type === "inc" ? { n: state.n + 1 } : state);
const reducer = undoable(counter, { n: 0 }, { limit: 3 });

describe("undoable (query history)", () => {
  it("undo restores the previous state, redo re-applies it", () => {
    let s = reducer(undefined, { type: "init" });
    s = reducer(s, { type: "inc" });
    s = reducer(s, { type: "inc" });
    expect(s.present.n).toBe(2);
    s = reducer(s, { type: UNDO });
    expect(s.present.n).toBe(1);
    expect(s.canRedo).toBe(true);
    s = reducer(s, { type: REDO });
    expect(s.present.n).toBe(2);
  });
  it("a new action after undo drops the redo branch; actions that change nothing add no history", () => {
    let s = reducer(undefined, { type: "init" });
    s = reducer(s, { type: "inc" });
    s = reducer(s, { type: UNDO });
    s = reducer(s, { type: "inc" });
    expect(s.canRedo).toBe(false);
    s = reducer(s, { type: "noop" });
    expect(s.past.length).toBe(1);
  });
  it("history is capped and undo at the start is a no-op", () => {
    let s = reducer(undefined, { type: "init" });
    for (let i = 0; i < 6; i++) s = reducer(s, { type: "inc" });
    expect(s.past.length).toBe(3);
    const before = s;
    for (let i = 0; i < 5; i++) s = reducer(s, { type: UNDO });
    expect(s.present.n).toBe(3);
    expect(reducer(s, { type: UNDO })).toBe(s);
    expect(before.canUndo).toBe(true);
  });
});

describe("undoable: coalescing and transient changes", () => {
  const r = (state, action) => {
    if (action.type === "color") return { ...state, color: action.color };
    if (action.type === "focus") return { ...state, focus: action.id };
    if (action.type === "add") return { ...state, items: [...state.items, action.id] };
    return state;
  };
  const reducer = undoable(r, { items: [], color: "#000", focus: null }, { transientIf: (a, b) => a.items === b.items && a.color === b.color });

  it("actions with the same coalesce key replace the previous step (a color drag is one undo)", () => {
    let s = reducer(undefined, { type: "@init" });
    s = reducer(s, { type: "add", id: 1 });
    s = reducer(s, { type: "color", color: "#111", coalesce: "color:q1" });
    s = reducer(s, { type: "color", color: "#222", coalesce: "color:q1" });
    s = reducer(s, { type: "color", color: "#333", coalesce: "color:q1" });
    expect(s.past.length).toBe(2);
    s = reducer(s, { type: UNDO });
    expect(s.present.color).toBe("#000");
    expect(s.present.items).toEqual([1]);
  });
  it("a change the transientIf test accepts (focus only) adds no history", () => {
    let s = reducer(undefined, { type: "@init" });
    s = reducer(s, { type: "add", id: 1 });
    s = reducer(s, { type: "focus", id: 1 });
    s = reducer(s, { type: "focus", id: 2 });
    expect(s.present.focus).toBe(2);
    expect(s.past.length).toBe(1);
    s = reducer(s, { type: UNDO });
    expect(s.present.items).toEqual([]);
  });
});
