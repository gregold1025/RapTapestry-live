import React from "react";
import { Chevron } from "./IconButtons";
import "./ui.css";

/**
 * Collapsible layer/class row: chevron, glyph, title, meta, right-side controls.
 * `right` (eye etc.) stops propagation so clicking it does not toggle the row.
 */
export function CollapsibleRow({ open, onToggle, glyph, title, meta, right, children }) {
  return (
    <div className="ui-crow">
      <div
        className="ui-crow-head"
        role="button"
        tabIndex={0}
        aria-expanded={open}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
        }}
      >
        <Chevron open={open} />
        {glyph ? <span onClick={(e) => e.stopPropagation()}>{glyph}</span> : null}
        <span className="ui-crow-title">{title}</span>
        {meta != null && <span className="ui-crow-meta">{meta}</span>}
        {right ? <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", gap: 4 }}>{right}</span> : null}
      </div>
      {open && <div className="ui-crow-body">{children}</div>}
    </div>
  );
}
