import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useStemMix } from "../../contexts/StemMixContext";
import { useUIState } from "../../contexts/UIStateContext";
import { Segmented, Slider, EyeButton, MuteButton, SoloButton, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

const STEM_ROWS = [
  { key: "vocals", label: "Vocals", canHide: true },
  { key: "drums", label: "Drums", canHide: true },
  { key: "bass", label: "Bass", canHide: true },
  { key: "other", label: "Other", canHide: false },
];

/** Global: the stems (show / mute / solo; a name opens that stem's panel), the
 *  tapestry's view width and row height, appearance. */
export default function GlobalPanel() {
  const { muted, soloed, visible, toggleMute, toggleSolo, setVisible } = useStemMix();
  const { openParamsPanel } = useUIState();
  const {
    barsPerRow, setBarsPerRow,
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
              <button type="button" className={`pn-stem-name pn-stem-open ${visible[s.key] ? "" : "is-off"}`} onClick={() => openParamsPanel(s.key)} title={`Open the ${s.label} panel`}>
                {s.label} <span className="pn-stem-chev">&rsaquo;</span>
              </button>
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
        <SectionLabel>Tapestry</SectionLabel>
        <div className="pn-field">
          <span className="pn-field-label">view width</span>
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
