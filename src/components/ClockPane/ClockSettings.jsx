// src/components/ClockPane/ClockSettings.jsx
// The Rhyme Clock's section of the Global panel.
import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { Segmented, Slider, ColorField } from "../ui";
import GlobalSection from "../Panels/GlobalSection";
import { useUIState } from "../../contexts/UIStateContext";
import { RINGS_SEG, CYCLE_OPTIONS } from "./clockGeometry";

export default function ClockSettings() {
  const {
    clockCycleBars, setClockCycleBars, clockRings, setClockRings,
    clockWords, setClockWords, clockBackgroundColor, setClockBackgroundColor, clockWordColor, setClockWordColor,
    clockTextPx, setClockTextPx, clockShowDrums, setClockShowDrums, clockShowHand, setClockShowHand,
  } = useParams();
  const { clockOpen, toggleClock } = useUIState();
  return (
    <GlobalSection id="clock" title="Rhyme Clock" power={{ on: clockOpen, onToggle: toggleClock, label: clockOpen ? "Hide the Rhyme Clock" : "Show the Rhyme Clock" }}>
      <div className="pn-field">
        <span className="pn-field-label">cycle</span>
        <Segmented value={clockCycleBars} onChange={setClockCycleBars} options={CYCLE_OPTIONS.map((b) => ({ value: b, label: `${b} bar` }))} />
      </div>
      <div className="pn-field">
        <span className="pn-field-label">rings</span>
        <Segmented value={clockRings} onChange={setClockRings} options={RINGS_SEG} />
      </div>
      <div className="pn-field">
        <span className="pn-field-label">words</span>
        <Segmented value={clockWords} onChange={setClockWords} options={[{ value: "all", label: "all words" }, { value: "query", label: "query words" }]} />
      </div>
      <Slider label="text" value={clockTextPx} min={8} max={20} step={1} unit=" px" onChange={setClockTextPx} />
      <div className="pn-field">
        <span className="pn-field-label">drums</span>
        <Segmented value={clockShowDrums} onChange={setClockShowDrums} options={[{ value: true, label: "on" }, { value: false, label: "off" }]} />
      </div>
      <div className="pn-field">
        <span className="pn-field-label">playhead</span>
        <Segmented value={clockShowHand} onChange={setClockShowHand} options={[{ value: true, label: "on" }, { value: false, label: "off" }]} />
      </div>
      <ColorField label="Background" value={clockBackgroundColor} onChange={setClockBackgroundColor} />
      <ColorField label="Words" note="words not in a query" value={clockWordColor} onChange={setClockWordColor} />
      <p className="ui-note">Open the clock with the clock icon in the header.</p>
    </GlobalSection>
  );
}
