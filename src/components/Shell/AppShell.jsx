// src/components/Shell/AppShell.jsx
// Fixed header; lyrics on the left (hideable); center stage; right pane
// (parameters or queries).
import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import "./Shell.css";

export default function AppShell({ header, left, center, right }) {
  const { lyricsOpen, rightOpen } = useUIState();
  const closed = !lyricsOpen || !left;
  const rightClosed = !rightOpen || !right;
  return (
    <div className={`rt-shell ${closed ? "left-closed" : ""} ${rightClosed ? "right-closed" : ""}`}>
      <header className="rt-header">{header}</header>
      <aside className="rt-left" aria-hidden={closed}>{closed ? null : left}</aside>
      <main className="rt-center">{center}</main>
      <aside className="rt-right" aria-hidden={rightClosed}>{rightClosed ? null : right}</aside>
    </div>
  );
}
