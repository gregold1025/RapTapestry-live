import { describe, it, expect } from "vitest";
import { createClockIndexStore } from "../clockIndexStore";

describe("clock index store", () => {
  it("holds the current ring index and tells subscribers when it changes", () => {
    const s = createClockIndexStore(0);
    let calls = 0;
    const off = s.subscribe(() => { calls++; });
    s.set(3);
    s.set(3);   // no change, no call
    expect(s.get()).toBe(3);
    expect(calls).toBe(1);
    off();
    s.set(4);
    expect(calls).toBe(1);
  });
  it("clamps the index when fewer rings are shown", () => {
    const s = createClockIndexStore(6);
    s.clampTo(4);
    expect(s.get()).toBe(3);
  });
});
