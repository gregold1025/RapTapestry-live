import React, { useEffect, useMemo, useRef } from "react";
import { useParams } from "../../contexts/ParamsContext";
import "./GlobalSettingsOverlay.css";

// IMPORTANT: make sure Overlay.css is imported somewhere globally once,
// or import it here if you don’t already.
// If your other overlays import it locally, do the same pattern here.
// Example:
// import "../ParamsOverlays/Overlay.css";
import "../ChannelStripView/ParamWindows/Overlay.css";

export default function GlobalSettingsOverlay({ onClose }) {
  const {
    rowHeightMode,
    setRowHeightMode,
    fixedRowHeightPx,
    setFixedRowHeightPx,
    tapestryBackgroundColor,
    setTapestryBackgroundColor,
  } = useParams();

  const panelRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Focus the window for accessibility
  useEffect(() => {
    panelRef.current?.focus?.();
  }, []);

  const fixedEnabled = rowHeightMode === "fixed";

  const fixedPxSafe = useMemo(() => {
    const n = Number(fixedRowHeightPx);
    if (!Number.isFinite(n)) return 100;
    return Math.max(40, Math.min(500, Math.round(n)));
  }, [fixedRowHeightPx]);

  return (
    <div
      className="params-overlay"
      role="presentation"
      onMouseDown={(e) => {
        // backdrop click closes; click inside panel does not
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className="params-window"
        role="dialog"
        aria-label="Global settings"
        tabIndex={-1}
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <h2>Global Settings</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="params-body">
          <div className="visuals-grid">
            {/* ===== Layout Section ===== */}
            <section className="visual-section">
              <h3>Layout</h3>

              <label className="control">
                <span>
                  Row height mode <span className="meta">(fit vs fixed)</span>
                </span>

                <select
                  className="gs-select"
                  value={rowHeightMode}
                  onChange={(e) => setRowHeightMode(e.target.value)}
                >
                  <option value="auto">Fit</option>
                  <option value="fixed">Fixed</option>
                </select>
              </label>

              <div className="control">
                <span>
                  Fixed row height{" "}
                  <span className="meta">
                    {fixedEnabled ? `(${fixedPxSafe}px)` : "(disabled)"}
                  </span>
                </span>

                <input
                  type="range"
                  min={60}
                  max={260}
                  step={1}
                  value={fixedPxSafe}
                  disabled={!fixedEnabled}
                  onChange={(e) => setFixedRowHeightPx(Number(e.target.value))}
                />

                <div className="number-controls">
                  <div className="gs-inline-row">
                    <input
                      className="gs-number"
                      type="number"
                      min={40}
                      max={500}
                      step={1}
                      value={fixedPxSafe}
                      disabled={!fixedEnabled}
                      onChange={(e) =>
                        setFixedRowHeightPx(Number(e.target.value))
                      }
                    />
                    <span className="gs-unit">px</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ===== Appearance Section ===== */}
            <section className="visual-section">
              <h3>Appearance</h3>

              <label className="color-control">
                <span>
                  Tapestry background <span className="meta">(canvas)</span>
                </span>

                <div className="gs-inline-row">
                  <input
                    type="color"
                    value={tapestryBackgroundColor}
                    onChange={(e) => setTapestryBackgroundColor(e.target.value)}
                    aria-label="Tapestry background color"
                  />
                  <span className="gs-hex">{tapestryBackgroundColor}</span>
                </div>
              </label>
            </section>

            {/* Optional future sections: gridline visibility, etc. */}
          </div>
        </div>
      </div>
    </div>
  );
}
