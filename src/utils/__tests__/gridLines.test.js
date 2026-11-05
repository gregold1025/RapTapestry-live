import { describe, it, expect } from "vitest";
import { gridLines, GRID_LEVELS } from "../gridLines";

const beats = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // two bars of 4/4 and the next downbeat
const kinds = (ls) => ls.reduce((c, l) => ({ ...c, [l.kind]: (c[l.kind] ?? 0) + 1 }), {});

describe("gridLines: one line per position at each grid level", () => {
  it("level 0 draws nothing", () => {
    expect(gridLines(beats, 4, 0)).toEqual([]);
  });
  it("level 1 draws bar lines only", () => {
    expect(gridLines(beats, 4, 1)).toEqual([{ t: 0, kind: "bar" }, { t: 4, kind: "bar" }, { t: 8, kind: "bar" }]);
  });
  it("level 2 adds beat lines, never on top of a bar line", () => {
    const ls = gridLines(beats, 4, 2);
    expect(kinds(ls)).toEqual({ bar: 3, beat: 6 });
    expect(new Set(ls.map((l) => l.t)).size).toBe(ls.length);
  });
  it("level 3 adds eighths: one line halfway between beats", () => {
    const ls = gridLines(beats, 4, 3);
    expect(kinds(ls)).toEqual({ bar: 3, beat: 6, sub: 8 });
    expect(ls.filter((l) => l.kind === "sub" && l.t > 0 && l.t < 1).map((l) => l.t)).toEqual([0.5]);
  });
  it("level 4 adds sixteenths too, drawn like the eighths", () => {
    const ls = gridLines(beats, 4, 4);
    expect(kinds(ls)).toEqual({ bar: 3, beat: 6, sub: 8 * 3 });
    expect(ls.filter((l) => l.kind === "sub" && l.t > 0 && l.t < 1).map((l) => l.t)).toEqual([0.25, 0.5, 0.75]);
    expect(new Set(ls.map((l) => l.t)).size).toBe(ls.length);
  });
  it("subdivisions follow uneven beat spacing", () => {
    expect(gridLines([0, 1, 3], 4, 3).filter((l) => l.kind === "sub").map((l) => l.t)).toEqual([0.5, 2]);
    expect(gridLines([0, 1, 3], 4, 4).filter((l) => l.kind === "sub").map((l) => l.t)).toEqual([0.25, 0.5, 0.75, 1.5, 2, 2.5]);
  });
  it("names the five positions", () => {
    expect(GRID_LEVELS).toHaveLength(5);
  });
});
