import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useUIState } from "../../contexts/UIStateContext";
import { Segmented, Slider, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

const STEM_ROWS = [
  { key: "vocals", label: "Vocals" },
  { key: "drums", label: "Drums" },
  { key: "bass", label: "Bass" },
  { key: "other", label: "Other" },
];

export default function GlobalPanel() {
  const { setLeftPanel } = useUIState();
  const {
    timeLayout, setTimeLayout,
    barsPerRow, setBarsPerRow,
    stemsLayout, setStemsLayout,
    rowHeightMode, setRowHeightMode,
    fixedRowHeightPx, setFixedRowHeightPx,
    tapestryBackgroundColor, setTapestryBackgroundColor,
    showDownbeats, setShowDownbeats,
    showBeatsLines, setShowBeatLines,
    showHorizontalGrid, setShowHorizontalGrid,
  } = useParams();

  return (
    <div className="pn-root">
      <div className="pn-header">
        <div>
          <h2 className="pn-title">Global</h2>
          <p className="pn-subtitle">shared by every view</p>
        </div>
      </div>

      <div className="pn-section">
        <SectionLabel>Stems</SectionLabel>
        <div className="pn-list">
          {STEM_ROWS.map((s) => (
            <button key={s.key} type="button" className="pn-stem-row pn-stem-link" onClick={() => setLeftPanel(s.key)} title={`Open the ${s.label} panel`}>
              <span className="pn-stem-name">{s.label}</span>
              <span className="ui-note" style={{ margin: 0 }}>settings &rsaquo;</span>
            </button>
          ))}
        </div>
        <p className="ui-note">Show, mute and solo live in the header.</p>
      </div>

      <div className="pn-section">
        <SectionLabel>Layout</SectionLabel>
        <div className="pn-field">
          <span className="pn-field-label">time</span>
          <Segmented
            value={timeLayout}
            onChange={setTimeLayout}
            options={[
              { value: "wrap", label: "Wrap" },
              { value: "scroll", label: "Scroll" },
              { value: "fold", label: "Fold", disabled: true },
            ]}
          />
        </div>
        <div className="pn-field">
          <span className="pn-field-label">{timeLayout === "scroll" ? "window" : "view width"}</span>
          <Segmented
            value={barsPerRow}
            onChange={setBarsPerRow}
            options={[
              { value: 2, label: "2 bar" },
              { value: 4, label: "4 bar" },
              { value: 8, label: "8 bar" },
            ]}
          />
        </div>
        <div className="pn-field">
          <span className="pn-field-label">stems</span>
          <Segmented
            value={stemsLayout}
            onChange={setStemsLayout}
            options={[
              { value: "superimposed", label: "superimposed" },
              { value: "separated", label: "separated" },
            ]}
          />
        </div>
        <div className="pn-field">
          <span className="pn-field-label">row height</span>
          <Segmented
            value={rowHeightMode}
            onChange={setRowHeightMode}
            options={[
              { value: "fit", label: "fit" },
              { value: "fixed", label: "fixed" },
            ]}
          />
          {rowHeightMode === "fixed" && (
            <Slider label="pixels" value={fixedRowHeightPx} min={40} max={400} step={1} unit=" px" onChange={setFixedRowHeightPx} />
          )}
        </div>
        <p className="ui-note">{timeLayout === "scroll" ? "Scroll: the song on one row; the window follows the playhead (held two thirds across) and reveals each glyph as it is played. Drag the tapestry to scrub, click to play from there, Freeze to hold the window." : "Width is always in bars. Pixels per bar follow from the window."}</p>
      </div>

      <div className="pn-section">
        <SectionLabel>Appearance</SectionLabel>
        <ColorField label="Background" value={tapestryBackgroundColor} onChange={setTapestryBackgroundColor} />
        <label className="ui-toggle">
          <input type="checkbox" checked={!!showDownbeats} onChange={(e) => setShowDownbeats(e.target.checked)} />
          Downbeat lines
        </label>
        <label className="ui-toggle">
          <input type="checkbox" checked={!!showBeatsLines} onChange={(e) => setShowBeatLines(e.target.checked)} />
          Beat lines
        </label>
        <label className="ui-toggle">
          <input type="checkbox" checked={!!showHorizontalGrid} onChange={(e) => setShowHorizontalGrid(e.target.checked)} />
          Row lines
        </label>
      </div>
    </div>
  );
}
