// src/components/ui/Switch.jsx
// An on / off switch: a pill with a knob (right and lit when on).
import React from "react";

export default function Switch({ on, onToggle, label }) {
  return (
    <button type="button" role="switch" aria-checked={!!on} aria-label={label} title={label}
      className={`ui-switch${on ? " is-on" : ""}`} onClick={onToggle}>
      <span className="ui-switch-knob" aria-hidden="true" />
    </button>
  );
}
