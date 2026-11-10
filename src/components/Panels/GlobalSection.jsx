// src/components/Panels/GlobalSection.jsx
// A collapsible submenu of the Global panel: its header folds or unfolds it; when a pane's
// settings button asks for it (UIState's globalFocus), the panel scrolls it to the top. `power`
// ({ on, onToggle, label }) adds an on / off switch at the header's right (Greg 2026-11-09).
import React, { useEffect, useRef } from "react";
import { useUIState } from "../../contexts/UIStateContext";
import Switch from "../ui/Switch";

export default function GlobalSection({ id, title, power, children }) {
  const { globalSections, toggleGlobalSection, globalFocus } = useUIState();
  const open = !!globalSections[id];
  const ref = useRef(null);
  useEffect(() => {
    if (globalFocus?.key === id) ref.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [globalFocus, id]);
  return (
    <div ref={ref} className={`pn-section pn-collapsible${open ? " is-open" : ""}`} data-section={id}>
      <div className="pn-section-head">
        <button type="button" className="ui-section-label pn-section-toggle" onClick={() => toggleGlobalSection(id)} aria-expanded={open}>
          <span className="pn-section-chev" aria-hidden="true">{open ? "▾" : "▸"}</span>{title}
        </button>
        {power && <Switch on={power.on} onToggle={power.onToggle} label={power.label} />}
      </div>
      {open && children}
    </div>
  );
}
