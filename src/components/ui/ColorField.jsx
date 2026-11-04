import React from "react";
import "./ui.css";

export function ColorField({ label, value, onChange, note }) {
  return (
    <label className="ui-color">
      <input
        className="ui-color-swatch"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
      />
      <span>{label}</span>
      <span className="ui-color-hex">{value}{note ? `  ·  ${note}` : ""}</span>
    </label>
  );
}

export function SectionLabel({ children, right }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <p className="ui-section-label">{children}</p>
      {right ? <span className="ui-note">{right}</span> : null}
    </div>
  );
}
