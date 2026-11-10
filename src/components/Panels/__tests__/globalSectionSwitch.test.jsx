// The Line Staff's and the Rhyme Clock's Global submenus carry an on / off switch, right of the
// header, off by default (the panes start closed) (Greg 2026-11-09).
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UIStateProvider } from "../../../contexts/UIStateContext";
import GlobalSection from "../GlobalSection";
import Switch from "../../ui/Switch";

const render = (el) => renderToStaticMarkup(<UIStateProvider>{el}</UIStateProvider>);

describe("the submenu switch", () => {
  it("is a switch button saying whether it is on", () => {
    expect(renderToStaticMarkup(<Switch on={false} onToggle={() => {}} label="Line Staff" />))
      .toMatch(/<button[^>]*role="switch"[^>]*aria-checked="false"[^>]*aria-label="Line Staff"/);
    expect(renderToStaticMarkup(<Switch on onToggle={() => {}} label="x" />)).toMatch(/aria-checked="true"/);
  });
  it("sits in the header after the fold button, not inside it", () => {
    const html = render(<GlobalSection id="staff" title="Line Staff" power={{ on: false, onToggle: () => {}, label: "Show the Line Staff" }}><p>body</p></GlobalSection>);
    expect(html).toMatch(/<div class="pn-section-head"><button[^>]*pn-section-toggle[^>]*>.*?Line Staff<\/button><button[^>]*role="switch"[^>]*aria-checked="false"/);
  });
  it("a submenu without one has no switch", () => {
    expect(render(<GlobalSection id="tapestry" title="Tapestry"><p>body</p></GlobalSection>)).not.toMatch(/role="switch"/);
  });
});
