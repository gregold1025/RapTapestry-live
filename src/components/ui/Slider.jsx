import React from "react";
import "./ui.css";

export function Slider({ label, value, min = 0, max = 100, step = 1, unit = "", onChange, format, disabled }) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const shown = format ? format(value) : `${Number.isInteger(step) ? Math.round(value) : value}${unit}`;
  return (
    <label className="ui-slider">
      <span className="ui-slider-head">
        <span>{label}</span>
        <span className="ui-slider-val">{shown}</span>
      </span>
      <input
        className="ui-range"
        type="range"
        min={min} max={max} step={step}
        value={value}
        disabled={disabled}
        style={{ "--fill": `${pct}%` }}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        aria-label={label}
      />
    </label>
  );
}
