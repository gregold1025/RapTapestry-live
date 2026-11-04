import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useStemMix } from "../../contexts/StemMixContext";
import { Segmented, Slider, EyeButton, MuteButton, SoloButton, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

const STEM_ROWS = [
  { key: "vocals", label: "Vocals", canHide: true },
  { key: "drums", label: "Drums", canHide: true },
  { key: "bass", label: "Bass", canHide: true },
  { key: "other", label: "Other", canHide: false },
];

export default function GlobalPanel() {
  const { muted, soloed, visible, toggleMute, toggleSolo, setVisible } = useStemMix();
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
            <div key={s.key} className="pn-stem-row">
              <span className={`pn-stem-name ${visible[s.key] ? "" : "is-off"}`}>{s.label}</span>
              <EyeButton
                on={!!visible[s.key] && s.canHide}
                onClick={() => s.canHide && setVisible(s.key, !visible[s.key])}
                title={s.canHide ? undefined : "No visual for this stem yet"}
              />
              <MuteButton on={!!muted[s.key] && !soloed} onClick={() => toggleMute(s.key)} />
              <SoloButton on={soloed === s.key} onClick={() => toggleSolo(s.key)} />
            </div>
          ))}
        </div>
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
              { value: "scroll", label: "Scroll", disabled: true },
              { value: "fold", label: "Fold", disabled: true },
            ]}
          />
        </div>
        <div className="pn-field">
          <span className="pn-field-label">view width{timeLayout === "fold" ? "  (radius)" : ""}</span>
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
            <Slider label="" value={fixedRowHeightPx} min={40} max={400} step={1} unit=" px" onChange={setFixedRowHeightPx} />
          )}
        </div>
        <p className="ui-note">Width is always in bars. Pixels per bar follow from the window.</p>
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
