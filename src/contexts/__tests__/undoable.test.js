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
