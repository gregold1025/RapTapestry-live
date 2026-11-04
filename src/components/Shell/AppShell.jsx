// src/components/Shell/AppShell.jsx
// Fixed header, left panel (one at a time, collapsible), center stage, right pane.
import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import "./Shell.css";

export default function AppShell({ header, left, center, right }) {
  const { leftPanel } = useUIState();
  const closed = !leftPanel || !left;
  return (
    <div className={`rt-shell ${closed ? "left-closed" : ""}`}>
      <header className="rt-header">{header}</header>
      <aside className="rt-left" aria-hidden={closed}>{closed ? null : left}</aside>
      <main className="rt-center">{center}</main>
      <aside className="rt-right">{right}</aside>
    </div>
  );
}
