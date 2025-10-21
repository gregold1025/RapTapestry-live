import React from "react";
import "./LyricPresets.css";
import { useParams } from "../../contexts/ParamsContext";

/**
 * Four preset buttons aligned in one row:
 * - Alliteration  → toggles showAlliteration
 * - End Rhymes    → toggles showEndRhymes
 * - Word Rhymes   → toggles showRhymes (and reveals Exact/Plurals)
 * - Multi-syllable→ disabled for now
 *
 * Visual “active” styling uses context colors:
 *   - Word-related buttons use --active-color = wordActiveColor
 *   - Line-related button uses  --active-color = lineActiveColor
 */
export default function LyricPresets() {
  const {
    // word/line layer toggles
    showAlliteration,
    setShowAlliteration,
    showEndRhymes,
    setShowEndRhymes,
    showRhymes,
    setShowRhymes,

    // sub-options revealed when Word Rhymes is active
    exactMatches,
    setExactMatches,
    ignorePlurals,
    setIgnorePlurals,

    // colors for active styling
    wordActiveColor,
    lineActiveColor,
  } = useParams();

  return (
    <div className="preset-panel">
      {/* Main 4 buttons */}
      <div
        className="preset-row"
        role="group"
        aria-label="Lyric highlight presets"
      >
        <button
          className={`preset-btn ${showRhymes ? "is-active" : ""}`}
          type="button"
          aria-pressed={showRhymes}
          style={{ "--active-color": wordActiveColor }}
          onClick={() => setShowRhymes(!showRhymes)}
        >
          Rhyme
        </button>
        <button
          className={`preset-btn ${showAlliteration ? "is-active" : ""}`}
          type="button"
          aria-pressed={showAlliteration}
          style={{ "--active-color": wordActiveColor }}
          onClick={() => setShowAlliteration(!showAlliteration)}
        >
          Alliteration
        </button>

        <button className="preset-btn is-disabled" type="button" disabled>
          Assonance
        </button>

        <button className="preset-btn is-disabled" type="button" disabled>
          Multi-syllable
        </button>
      </div>
    </div>
  );
}
