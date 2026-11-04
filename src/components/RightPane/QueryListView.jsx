import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useUIState } from "../../contexts/UIStateContext";
import { useFocusedQuery } from "../QueryPanel/ActiveQueryPanel";
import SelectionList from "../QueryPanel/SelectionList";
import "./RightPane.css";

function Chip({ active, onClick, children }) {
  return (
    <button type="button" className={`rp-chip ${active ? "is-active" : ""}`} onClick={onClick} aria-pressed={active}>
      {children}
    </button>
  );
}

/** All queries (word / line / syllable) with per-type visibility toggles. */
export default function QueryListView() {
  const { hasSelections, focused } = useFocusedQuery();
  const { setRightView } = useUIState();
  const {
    showRhymes, setShowRhymes,
    alliterationTier, setAlliterationTier,
    showAssonance, setShowAssonance,
    showEndRhymes, setShowEndRhymes,
  } = useParams();

  const allitActive = alliterationTier !== "off";
  const cycleAllit = () => {
    const tiers = ["off", "near", "exact"];
    setAlliterationTier(tiers[(tiers.indexOf(alliterationTier) + 1) % tiers.length]);
  };

  return (
    <div className="rp-root">
      <div className="rp-head">
        <h3 className="rp-head-title">Queries</h3>
        {focused && (
          <button type="button" className="rp-link" onClick={() => setRightView("query")} title="Open the focused query">
            open focused
          </button>
        )}
      </div>
      <div className="rp-strip" role="group" aria-label="Match types shown on the tapestry">
        <p className="rp-strip-label">show matches</p>
        <Chip active={showRhymes} onClick={() => setShowRhymes(!showRhymes)}>Rhyme</Chip>
        <Chip active={allitActive} onClick={cycleAllit}>{allitActive ? `Alliteration (${alliterationTier})` : "Alliteration"}</Chip>
        <Chip active={showAssonance} onClick={() => setShowAssonance(!showAssonance)}>Assonance</Chip>
        <Chip active={showEndRhymes} onClick={() => setShowEndRhymes(!showEndRhymes)}>End rhyme</Chip>
      </div>
      <div className="rp-body">
        {hasSelections ? (
          <SelectionList />
        ) : (
          <div className="rp-empty">No queries yet. Click a word in the lyrics, or Cmd-click a word or line on the tapestry.</div>
        )}
      </div>
    </div>
  );
}
