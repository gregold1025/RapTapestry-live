// "Load demo" before the demo exists (Greg 2026-11-09): a dev server or a host may answer a missing
// file with the app's page (200, HTML); that is "no demo yet", not a broken session file.
import { describe, it, expect } from "vitest";
import { demoText } from "../demo";

describe("the demo session's answer", () => {
  it("is the file's text when it is JSON", () => {
    expect(demoText({ ok: true, contentType: "application/json", text: '{"format":1}' })).toBe('{"format":1}');
    expect(demoText({ ok: true, contentType: "", text: '  {"a":1}' })).toBe('  {"a":1}');
  });
  it("is nothing for a missing file, whatever the server answers", () => {
    expect(demoText({ ok: false, contentType: "text/html", text: "<!doctype html>" })).toBeNull();
    expect(demoText({ ok: true, contentType: "text/html", text: "<!doctype html><html>" })).toBeNull();
  });
});
