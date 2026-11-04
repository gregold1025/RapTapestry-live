import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import GlobalPanel from "./GlobalPanel";
import VocalsPanel from "./VocalsPanel";
import DrumsPanel from "./DrumsPanel";
import BassPanel from "./BassPanel";
import OtherPanel from "./OtherPanel";
import "./Panels.css";

const PANELS = { global: GlobalPanel, vocals: VocalsPanel, drums: DrumsPanel, bass: BassPanel, other: OtherPanel };

/** The parameters view: Global, or one stem's panel nested under it (with a way back). */
export default function ParamsPane() {
  const { paramsPanel, setParamsPanel } = useUIState();
  const Panel = PANELS[paramsPanel] ?? GlobalPanel;
  return (
    <div className="pn-pane">
      {paramsPanel !== "global" && (
        <button type="button" className="pn-back" onClick={() => setParamsPanel("global")} title="Back to the global panel">
          &lsaquo; Global
        </button>
      )}
      <div className="pn-pane-body"><Panel /></div>
    </div>
  );
}
