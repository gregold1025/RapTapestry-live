// src/components/StaffPane/StaffPane.jsx
// The Line Staff under the tapestry: the same song and glyph layers on one
// scrolling row (the scroll time layout), with its own bars-in-view and the
// Freeze / Follow control inside it. Opened by the treble clef in the header.
import React from "react";
import { TapestryLayoutProvider } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import { useUIState } from "../../contexts/UIStateContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import TapestryView from "../TapestryView";
import { IconClef } from "../Shell/AppHeader";
import { Segmented } from "../ui";
import "./StaffPane.css";

export default function StaffPane() {
  const { songId, drumTranscription } = useSongData();
  const { duration } = useAudioEngine();
  const { staffBars, setStaffBars, toggleStaff } = useUIState();
  return (
    <section className="staff-pane" aria-label="Line Staff">
      <div className="staff-bar">
        <span className="staff-title"><IconClef /> Line Staff</span>
        <span className="staff-field">
          <span className="staff-label">view</span>
          <Segmented value={staffBars} onChange={setStaffBars} options={[{ value: 2, label: "2 bar" }, { value: 4, label: "4 bar" }, { value: 8, label: "8 bar" }]} />
        </span>
        <span className="staff-hint">drag to scrub, click to play from there</span>
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
          <TapestryView />
        </TapestryLayoutProvider>
      </div>
    </section>
  );
}
