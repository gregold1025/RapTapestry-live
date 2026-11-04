// src/components/CenterStage.jsx
// The center: the wrap tapestry, and under it (when the treble clef is on)
// the Line Staff pane; the split keeps the full width.
import React from "react";
import TapestryView from "./TapestryView";
import StaffPane from "./StaffPane/StaffPane";
import { useUIState } from "../contexts/UIStateContext";

export default function CenterStage({ songKey }) {
  const { staffOpen } = useUIState();
  return (
    <div className="rt-stage">
      <div className="rt-stage-top"><TapestryView key={`tapestry-${songKey}`} /></div>
      {staffOpen && <div className="rt-stage-bottom"><StaffPane /></div>}
    </div>
  );
}
