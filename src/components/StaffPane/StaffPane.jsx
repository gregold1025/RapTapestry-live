// src/components/StaffPane/StaffPane.jsx
// The Line Staff under the tapestry: the same song and glyph layers on one
// scrolling row (the scroll time layout), with its own bars-in-view and the
// Freeze / Follow control inside it. Opened by the treble clef in the header.
import React, { useState } from "react";
import { StaffToolbarSlot } from "./staffSlot";
import { Segmented } from "../ui";
import { TapestryLayoutProvider } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import { useUIState } from "../../contexts/UIStateContext";
import TapestryView from "../TapestryView";
import { IconClef } from "../Shell/AppHeader";
import "./StaffPane.css";

export default function StaffPane({ duration }) {
  const { songId, drumTranscription } = useSongData();
  const { staffBars, setStaffBars, toggleStaff, openParamsPanel } = useUIState();
  const [slot, setSlot] = useState(null);
  return (
    <section className="staff-pane" aria-label="Line Staff">
      <div className="staff-bar">
        <span className="staff-title"><IconClef /><span className="staff-title-text"> Line Staff</span></span>
        <Segmented value={staffBars} onChange={setStaffBars} options={[{ value: 2, label: "2 bar" }, { value: 4, label: "4 bar" }, { value: 8, label: "8 bar" }]} />
        <span className="staff-slot" ref={setSlot} />
        <button type="button" className="staff-link" onClick={() => openParamsPanel("global")} title="Show, sizes and colors live in the Global panel">settings &rsaquo;</button>
        <button type="button" className="staff-close" onClick={toggleStaff} title="Close the Line Staff">&times;</button>
      </div>
      <div className="staff-body">
        <TapestryLayoutProvider
          key={`staff-${songId}`}
          timeLayout="scroll"
          barsPerRow={staffBars}
          duration={duration}
          estimated_bpm={drumTranscription.estimated_bpm}
          downbeats={drumTranscription.downbeats}
          beats={drumTranscription.beats}
        >
          <StaffToolbarSlot.Provider value={slot}>
            <TapestryView variant="staff" />
          </StaffToolbarSlot.Provider>
        </TapestryLayoutProvider>
      </div>
    </section>
  );
}
