import React from "react";
import "./ui.css";

/** options: [{ value, label, disabled?, title? }] */
export function Segmented({ options, value, onChange, size = "md", ariaLabel }) {
  return (
    <div className={`ui-seg ${size === "sm" ? "ui-seg--sm" : ""}`} role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "is-active" : ""}
          aria-pressed={value === o.value}
          disabled={!!o.disabled}
          title={o.title ?? (o.disabled ? "Coming soon" : undefined)}
          onClick={() => !o.disabled && onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
