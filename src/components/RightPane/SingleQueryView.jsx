import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import { useFocusedQuery, FocusedQueryCard } from "../QueryPanel/ActiveQueryPanel";
import "../QueryPanel/ActiveQueryPanel.css";
import "./RightPane.css";

/** The focused query only: its parameters and match list. */
export default function SingleQueryView() {
  const { focused, hasSelections } = useFocusedQuery();
  const { setRightView } = useUIState();
  const kind = focused ? (focused.type === "word" ? "Word query" : focused.type === "line" ? "Line query" : "Syllable query") : "Query";
  return (
    <div className="rp-root">
      <div className="rp-head">
        <h3 className="rp-head-title">{kind}</h3>
        {hasSelections && (
          <button type="button" className="rp-link" onClick={() => setRightView("queries")} title="All queries">
            all queries
          </button>
        )}
      </div>
      <div className="rp-body aqp-root">
        <div className="aqp-body">
          <FocusedQueryCard emptyText="Click a word in the lyrics, or Cmd-click a word or line on the tapestry." />
        </div>
      </div>
    </div>
  );
}
