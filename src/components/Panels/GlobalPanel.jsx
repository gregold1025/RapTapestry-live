import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useStemMix } from "../../contexts/StemMixContext";
import { useUIState } from "../../contexts/UIStateContext";
import { Segmented, Slider, EyeButton, MuteButton, SoloButton, ColorField, SectionLabel } from "../ui";
import { GRID_LEVELS } from "../../utils/gridLines";
import ClockSettings from "../ClockPane/ClockSettings";
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
    gridLevel, setGridLevel,
    staffDrumScale, setStaffDrumScale,
    staffTextPx, setStaffTextPx,
    staffBackgroundColor, setStaffBackgroundColor,
    staffWordColor, setStaffWordColor,
    staffTextHeight, setStaffTextHeight,
    staffBassThickness, setStaffBassThickness,
    staffGridLevel, setStaffGridLevel,
  } = useParams();
  const { staffBars, setStaffBars, staffMode, setStaffMode } = useUIState();

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
        <Slider label="grid" value={gridLevel} min={0} max={4} step={1} format={(v) => GRID_LEVELS[v]} onChange={setGridLevel} />
      </div>

      <div className="pn-section">
        <SectionLabel>Line Staff</SectionLabel>
        <div className="pn-field">
          <span className="pn-field-label">view width</span>
          <Segmented value={staffBars} onChange={setStaffBars} options={[{ value: 2, label: "2 bar" }, { value: 4, label: "4 bar" }, { value: 8, label: "8 bar" }]} />
        </div>
        <Slider label="text height" value={staffTextHeight} min={0} max={66} step={1} unit="%" onChange={setStaffTextHeight} />
        <div className="pn-field">
          <span className="pn-field-label">show</span>
          <Segmented value={staffMode} onChange={setStaffMode} options={[{ value: "words", label: "words" }, { value: "spelled", label: "spelled" }, { value: "syllables", label: "syllables" }]} />
        </div>
        <div className="ui-row">
          <Slider label="text" value={staffTextPx} min={8} max={20} step={1} unit=" px" onChange={setStaffTextPx} />
          <Slider label="drum glyphs" value={Math.round(staffDrumScale * 100)} min={20} max={150} step={5} unit="%" onChange={(v) => setStaffDrumScale(v / 100)} />
        </div>
        <div className="ui-row">
          <Slider label="bass thickness" value={staffBassThickness} min={1} max={24} step={1} unit=" px" onChange={setStaffBassThickness} />
        </div>
        <ColorField label="Background" value={staffBackgroundColor} onChange={setStaffBackgroundColor} />
        <ColorField label="Words" note="text, line and dots" value={staffWordColor} onChange={setStaffWordColor} />
        <Slider label="grid" value={staffGridLevel} min={0} max={4} step={1} format={(v) => GRID_LEVELS[v]} onChange={setStaffGridLevel} />
        <p className="ui-note">The staff keeps its own sizes, background and grid; open it with the treble clef.</p>
      </div>

      <ClockSettings />
    </div>
  );
}
