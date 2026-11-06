// src/components/CenterStage.jsx
// The center: the wrap tapestry, and under it (when the treble clef is on)
// the Line Staff pane; the split keeps the full width. The Rhyme Clock (the
// clock icon) floats over both, centered.
import React from "react";
import TapestryView from "./TapestryView";
import StaffPane from "./StaffPane/StaffPane";
import ClockPane from "./ClockPane/ClockPane";
import { useUIState } from "../contexts/UIStateContext";

export default function CenterStage({ songKey, duration }) {
  const { staffOpen, clockOpen } = useUIState();
  return (
    <div className="rt-stage">
      <div className="rt-stage-top"><TapestryView key={`tapestry-${songKey}`} /></div>
      {staffOpen && <div className="rt-stage-bottom"><StaffPane duration={duration} /></div>}
      {clockOpen && <ClockPane key={`clock-${songKey}`} duration={duration} />}
    </div>
  );
}
