// src/components/QueryPanel/GlobalMasterStrip.jsx
import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import "./GlobalMasterStrip.css";

function StripToggle({ active, onClick, children }) {
  return (
    <button
      className={`gms-toggle ${active ? "is-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function GlobalMasterStrip() {
  const {
    showRhymes,          setShowRhymes,
    alliterationTier,    setAlliterationTier,
    showAssonance,       setShowAssonance,
    showEndRhymes,       setShowEndRhymes,
  } = useParams();

  const allitActive = alliterationTier !== "off";

  function cycleAllit() {
    const tiers = ["off", "near", "exact"];
    setAlliterationTier(tiers[(tiers.indexOf(alliterationTier) + 1) % tiers.length]);
  }

  return (
    <div className="gms-root">
      <div className="gms-strip">
        <StripToggle active={showRhymes} onClick={() => setShowRhymes(!showRhymes)}>Rhyme</StripToggle>
        <StripToggle active={allitActive} onClick={cycleAllit}>
          {allitActive ? `Allit. (${alliterationTier})` : "Allit."}
        </StripToggle>
        <StripToggle active={showAssonance} onClick={() => setShowAssonance(!showAssonance)}>Ason.</StripToggle>
        <StripToggle active={showEndRhymes} onClick={() => setShowEndRhymes(!showEndRhymes)}>End Rhyme</StripToggle>
      </div>
    </div>
  );
}
