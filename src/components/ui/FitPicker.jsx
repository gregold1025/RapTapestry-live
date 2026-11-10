// src/components/ui/FitPicker.jsx
// A choice shown as a button row when its bar has room, else as a drop-down (Greg 2026-11-09).
// Both are rendered; a container query on the enclosing bar shows one (the bar names the width:
// see .staff-bar and .clock-bar). options: [{ value, label, menuLabel? }].
import React from "react";
import { Segmented } from "./Segmented";

/** The option whose value reads `v` in the drop-down. */
export const fromMenu = (options, v) => options.find((o) => String(o.value) === v)?.value;

export default function FitPicker({ options, value, onChange, ariaLabel, className = "" }) {
  return (
    <span className={`ui-fit ${className}`.trim()}>
      <Segmented size="sm" value={value} onChange={onChange} options={options} ariaLabel={ariaLabel} />
      <select className="ui-fit-menu" value={String(value)} onChange={(e) => onChange(fromMenu(options, e.target.value))} aria-label={ariaLabel} title={ariaLabel}>
        {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.menuLabel ?? o.label}</option>)}
      </select>
    </span>
  );
}
