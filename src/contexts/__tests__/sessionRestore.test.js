// Restoring a session's per-song state (Greg 2026-11-09): queries with a fresh undo history,
// queries whose words are gone dropped and counted, and the stem mix.
import { describe, it, expect } from "vitest";
import { undoable, RESET } from "../undoable";
import { restorableQueries } from "../queryReducer";
import { stemMixReducer, initialStemMix } from "../stemMixReducer";

const counter = (s, a) => (a.type === "inc" ? s + 1 : s);

describe("restoring a session", () => {
  it("starts the undo history fresh", () => {
    const h = undoable(counter, 0);
    let st = h(undefined, { type: "@init" });
    st = h(h(st, { type: "inc" }), { type: "inc" });
    expect(st.canUndo).toBe(true);
    const r = h(st, { type: RESET, present: 7 });
    expect([r.present, r.canUndo, r.canRedo, r.past, r.future]).toEqual([7, false, false, [], []]);
  });
  it("drops queries whose words or lines the song no longer has, keeping the rest in order", () => {
    const qs = [
      { id: "a", kind: "word", anchorIds: ["w1"] },
      { id: "b", kind: "word", anchorIds: ["w1", "gone"] },
      { id: "c", kind: "line", lineIdx: 3, anchorIds: [] },
      { id: "d", kind: "line", lineIdx: 9, anchorIds: [] },
      { id: "e", kind: "word", anchorIds: ["w2"], color: "#123456" },
    ];
    const r = restorableQueries(qs, (id) => id === "w1" || id === "w2", 5);
    expect(r.dropped).toBe(2);
    expect(r.queries.map((q) => q.id)).toEqual(["a", "c", "e"]);
    expect(r.queries[2]).toEqual(qs[4]);
  });
  it("tolerates a missing or broken query list", () => {
    expect(restorableQueries(null, () => true, 5)).toEqual({ queries: [], dropped: 0 });
    expect(restorableQueries([{ id: "x" }], () => true, 5).dropped).toBe(1);
  });
  it("restores the stem mix, defaults for what the file lacks", () => {
    const s = stemMixReducer(initialStemMix, { type: "restore", state: { muted: { vocals: true }, soloed: "drums" } });
    expect(s.muted).toEqual({ vocals: true, drums: false, bass: false, other: false });
    expect(s.soloed).toBe("drums");
    expect(s.visible).toEqual({ vocals: true, drums: true, bass: true, other: true });
  });
});
