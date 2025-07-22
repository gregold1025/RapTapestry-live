import React from "react";
import TapestrySVG from "./TapestrySVG";
import PixiPlayheadOverlay from "./pixiPlayheadOverlay";

export default function TapestryView({ transcription }) {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <TapestrySVG transcriptionData={transcription} />
      <PixiPlayheadOverlay />
    </div>
  );
}
