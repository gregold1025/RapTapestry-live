// A choice shown as a button row when its bar has room, else as a drop-down (Greg 2026-11-09):
// both are rendered with the same options and value; a container query on the bar shows one.
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import FitPicker, { fromMenu } from "../FitPicker";

const OPTS = [{ value: 2, label: "2 bar", menuLabel: "2 bars" }, { value: 4, label: "4 bar", menuLabel: "4 bars" }, { value: "all", label: "all" }];

describe("the fit picker", () => {
  const html = renderToStaticMarkup(<FitPicker className="staff-bars" options={OPTS} value={4} onChange={() => {}} ariaLabel="Bars in view" />);
  it("renders the button row and the drop-down, the same choices in each", () => {
    expect(html).toMatch(/^<span class="ui-fit staff-bars">/);
    expect([...html.matchAll(/<button[^>]*>(.*?)<\/button>/g)].map((m) => m[1])).toEqual(["2 bar", "4 bar", "all"]);
    expect([...html.matchAll(/<option value="([^"]*)"[^>]*>(.*?)<\/option>/g)].map((m) => [m[1], m[2]])).toEqual([["2", "2 bars"], ["4", "4 bars"], ["all", "all"]]);
  });
  it("marks the current value in both", () => {
    expect(html).toMatch(/class="is-active" aria-pressed="true"[^>]*>4 bar</);
    expect(html).toMatch(/<option value="4" selected="">/);
  });
  it("turns a menu value back into the option's own value", () => {
    expect(fromMenu(OPTS, "4")).toBe(4);
    expect(fromMenu(OPTS, "all")).toBe("all");
  });
});
