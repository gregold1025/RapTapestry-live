// src/components/GlyphControlsView/index.jsx
import React from "react";
import "./GlyphControlsView.css";

/**
 * GlyphControlsView
 *
 * Skeleton component for exposing keyboard-driven glyph actions
 * via clickable UI affordances.
 *
 * For now:
 * - purely presentational
 * - no param / keyboard wiring
 * - buttons are placeholders for future glyph renderers
 */
export default function GlyphControlsView() {
  return (
    <div
      className="glyph-controls-panel"
      role="region"
      aria-label="Glyph controls"
    >
      <div className="gc-header">
        <span className="gc-title">Glyph Controls</span>
      </div>

      <div className="gc-grid">
        <button
          className="gc-cell gc-syllables"
          aria-label="Syllable glyph controls"
        >
          <span className="gc-label">Syllables</span>
        </button>

        <button className="gc-cell gc-drums" aria-label="Drum glyph controls">
          <span className="gc-label">Drums</span>
        </button>

        <button className="gc-cell gc-bass" aria-label="Bass glyph controls">
          <span className="gc-label">Bass</span>
        </button>

        {/* Reserved empty cell (future expansion or info panel) */}
        <div className="gc-cell gc-empty" aria-hidden="true" />
      </div>
    </div>
  );
}
