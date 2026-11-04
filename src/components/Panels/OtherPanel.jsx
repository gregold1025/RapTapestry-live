import React from "react";
import StemHeader from "./StemHeader";
import "./Panels.css";

export default function OtherPanel() {
  return (
    <div className="pn-root">
      <StemHeader stem="other" title="Other" subtitle="no transcription yet" canHide={false} />
      <div className="pn-placeholder">
        <strong>Params coming soon</strong>
        The Other stem plays back but has no visual layer yet.
      </div>
    </div>
  );
}
