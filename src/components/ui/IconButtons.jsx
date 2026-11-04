import React from "react";
import "./ui.css";

export const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" stroke="currentColor" strokeWidth="2" />
    {off ? (
      <path d="M4 20 20 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ) : (
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    )}
  </svg>
);

export function EyeButton({ on, onClick, size, title }) {
  return (
    <button
      type="button"
      className={`ui-ibtn ${size === "lg" ? "ui-ibtn--lg" : ""} ${on ? "is-on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      title={title ?? (on ? "Hide" : "Show")}
    >
      <EyeIcon off={!on} />
    </button>
  );
}

export function MuteButton({ on, onClick, size }) {
  return (
    <button
      type="button"
      className={`ui-ibtn is-mute ${size === "lg" ? "ui-ibtn--lg" : ""} ${on ? "is-on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      title={on ? "Unmute" : "Mute"}
    >
      M
    </button>
  );
}

export function SoloButton({ on, onClick, size }) {
  return (
    <button
      type="button"
      className={`ui-ibtn is-solo ${size === "lg" ? "ui-ibtn--lg" : ""} ${on ? "is-on" : ""}`}
      onClick={onClick}
      aria-pressed={on}
      title={on ? "Unsolo" : "Solo"}
    >
      S
    </button>
  );
}

export const Chevron = ({ open }) => (
  <svg className="ui-crow-chev" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    {open ? (
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    )}
  </svg>
);
