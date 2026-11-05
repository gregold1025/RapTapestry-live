// src/components/StaffPane/StaffPane.jsx
// The Line Staff under the tapestry: the same song and glyph layers on one
// scrolling row (the scroll time layout), with its own bars-in-view and the
// Freeze / Follow control inside it. Opened by the treble clef in the header.
import React from "react";
import { TapestryLayoutProvider } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import { useUIState } from "../../contexts/UIStateContext";
import TapestryView from "../TapestryView";
import { IconClef } from "../Shell/AppHeader";
import "./StaffPane.css";

export default function StaffPane({ duration }) {
  const { songId, drumTranscription } = useSongData();
  const { staffBars, toggleStaff, openParamsPanel } = useUIState();
  return (
    <section className="staff-pane" aria-label="Line Staff">
      <div className="staff-bar">
        <span className="staff-title"><IconClef /> Line Staff</span>
        <button type="button" className="staff-link" onClick={() => openParamsPanel("global")} title="View width, show and sizes live in the Global panel">{staffBars} bars · settings &rsaquo;</button>
        <span className="staff-hint">drag or click to scrub · cmd-click a word to query it</span>
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
          <TapestryView variant="staff" />
        </TapestryLayoutProvider>
      </div>
    </section>
  );
}
