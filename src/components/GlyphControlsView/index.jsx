// src/components/GlyphControlsView/index.jsx
import React, { useMemo, useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import "./GlyphControlsView.css";

function IconPreview({ url, label }) {
  return (
    <div className="gc-preview" aria-hidden="true">
      {url ? (
        <img className="gc-preview-img" src={url} alt="" draggable={false} />
      ) : (
        <div className="gc-preview-fallback">{label.slice(0, 1)}</div>
      )}
    </div>
  );
}

function BassPreview({ url }) {
  return (
    <div className="gc-preview gc-preview--bass" aria-hidden="true">
      <div className="gc-bass-base" />
      {url ? (
        <img
          className="gc-preview-img gc-preview-img--bass"
          src={url}
          alt=""
          draggable={false}
        />
      ) : (
        <div className="gc-preview-fallback"></div>
      )}
    </div>
  );
}

export default function GlyphControlsView() {
  const {
    glyphStyle,
    randomizeSyllableGlyph,
    randomizeDrumGlyph,
    randomizeBassDivider,
  } = useParams();

  const [collapsed, setCollapsed] = useState(false);

  const syllUrl = glyphStyle?.syllableGlyphUrl ?? null;
  const drumUrl = glyphStyle?.drumGlyphUrl ?? null;
  const bassUrl = glyphStyle?.bassDividerUrl ?? null;

  const infoText = useMemo(
    () =>
      "Click a tile to randomize that glyph style (same as keyboard: R / D / B).",
    []
  );

  const onHeaderClick = () => setCollapsed((v) => !v);

  return (
    <div
      className={`glyph-controls-panel ${collapsed ? "is-collapsed" : ""}`}
      role="region"
      aria-label="Glyph controls"
    >
      <div
        className="gc-header"
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onClick={onHeaderClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onHeaderClick();
          }
        }}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <div className="gc-header-left">
          <span className="gc-title">Glyph Controls</span>
          {/* Info button: does NOT toggle collapse */}
          <button
            type="button"
            className="gc-info"
            aria-label="About glyph controls"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="gc-info-icon" aria-hidden="true">
              i
            </span>

            <span className="gc-tooltip" role="tooltip">
              <p className="gc-tooltip-text">
                Click any button below to randomly reassign the glyph used for
                that encoding. Keyboard shortcuts are listed on each button.
              </p>

              <p className="gc-tooltip-credit">
                <a
                  href="https://www.svgbackgrounds.com/elements/svg-shape-dividers/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SVG Elements by SVGBackgrounds.com
                </a>
              </p>
            </span>
          </button>
          <span className="gc-chev" aria-hidden="true">
            {collapsed ? "▴" : "▾"}
          </span>
        </div>
      </div>

      {/* Collapsible body */}
      <div className="gc-body" aria-hidden={collapsed}>
        <div className="gc-grid">
          <button
            type="button"
            className="gc-cell gc-syllables"
            aria-label="Randomize syllable glyph (R)"
            title="Randomize syllable glyph (R)"
            onClick={randomizeSyllableGlyph}
          >
            <IconPreview url={syllUrl} label="Syllables" />
            <span className="gc-label">Syllables [s]</span>
          </button>

          <button
            type="button"
            className="gc-cell gc-drums"
            aria-label="Randomize drum glyph (D)"
            title="Randomize drum glyph (D)"
            onClick={randomizeDrumGlyph}
          >
            <IconPreview url={drumUrl} label="Drums" />
            <span className="gc-label">Drums [d]</span>
          </button>

          <button
            type="button"
            className="gc-cell gc-bass"
            aria-label="Randomize bass divider glyph (B)"
            title="Randomize bass divider glyph (B)"
            onClick={randomizeBassDivider}
          >
            <BassPreview url={bassUrl} />
            <span className="gc-label">Bass [b]</span>
          </button>

          <div className="gc-cell gc-empty" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
