// The header's session buttons (Greg 2026-11-09): Download saves; Upload opens a menu with
// "Load demo" and "Choose file…".
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UIStateProvider } from "../../../contexts/UIStateContext";
import { ParamsProvider } from "../../../contexts/ParamsContext";
import { SessionProvider } from "../../../session/SessionContext";
import SessionButtons from "../SessionButtons";

const render = (props) => renderToStaticMarkup(
  <UIStateProvider><ParamsProvider><SessionProvider currentSong="Amen" songs={["Amen"]} onSwitchSong={() => {}}>
    <SessionButtons {...props} />
  </SessionProvider></ParamsProvider></UIStateProvider>,
);

describe("the session buttons", () => {
  it("are Download and Upload", () => {
    const html = render({});
    expect(html).toMatch(/title="Save this session"/);
    expect(html).toMatch(/title="Load a session"/);
    expect(html).not.toMatch(/role="menu"/);
  });
  it("Upload's menu offers the demo or a file", () => {
    const html = render({ initialOpen: true });
    expect([...html.matchAll(/role="menuitem"[^>]*>([^<]*)</g)].map((m) => m[1])).toEqual(["Load demo", "Choose file…"]);
    expect(html).toMatch(/<input[^>]*type="file"[^>]*accept=".json,application\/json"/);
  });
});
