// src/components/QueryPanel/SelectionList.jsx
import React from "react";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import "./SelectionList.css";

function fmtCount(n) { return n > 0 ? String(n) : "—"; }

export default function SelectionList({ transcriptionData }) {
  const {
    selections: wordSels,
    matchesBySelectionId: wordRhymes,
    alliterationBySelectionId,
    assonanceBySelectionId,
    focusedWordSelId,
    setFocusedWordSelId,
    removeSelection: removeWord,
    toggleSelectionActive: toggleWord,
    wordInteractionStamp,
  } = useWordSelection();

  const {
    selections: lineSels,
    matchesBySelectionId: lineRhymes,
    focusedLineSelId,
    setFocusedLineSelId,
    removeSelection: removeLine,
    toggleSelectionActive: toggleLine,
    lineInteractionStamp,
  } = useLineSelection();

  // Which type is currently dominant (same logic as ActiveQueryPanel.focused)
  const hasWord = wordSels.some((s) => s.active);
  const hasLine = lineSels.some((s) => s.active);
  const dominantType = !hasWord && !hasLine ? null
    : !hasWord ? "line"
    : !hasLine ? "word"
    : wordInteractionStamp >= lineInteractionStamp ? "word" : "line";

  const lines = transcriptionData?.lines ?? [];

  // Merge and sort by createdAt descending (most recent first)
  const all = [
    ...wordSels.map((s) => ({ ...s, kind: "word" })),
    ...lineSels.map((s) => ({ ...s, kind: "line" })),
  ].sort((a, b) => b.createdAt - a.createdAt);

  if (!all.length) return null;

  return (
    <div className="sel-list">
      {all.map((s) => {
        const isWord = s.kind === "word";
        const isFocused = isWord
          ? dominantType === "word" && s.id === focusedWordSelId
          : dominantType === "line" && s.id === focusedLineSelId;

        // Label
        let label;
        if (s.label?.trim()) {
          label = s.label;
        } else if (isWord) {
          const [li, wi] = String(s.wordId).split("-").map(Number);
          label = lines[li]?.words?.[wi]?.text ?? s.wordId;
        } else {
          const text = lines[s.lineIdx]?.text ?? `Line ${s.lineIdx}`;
          label = "\u2026" + text.trim().slice(-16);
        }

        // Counts
        let counts = null;
        if (isWord) {
          const r = wordRhymes?.[s.id]?.size ?? 0;
          const a = alliterationBySelectionId?.[s.id]?.size ?? 0;
          const v = assonanceBySelectionId?.[s.id]?.size ?? 0;
          counts = (
            <span className="sel-counts">
              {r > 0 && <span className="sel-count sel-count--r" title="Rhymes">R:{r}</span>}
              {a > 0 && <span className="sel-count sel-count--a" title="Alliterations">A:{a}</span>}
              {v > 0 && <span className="sel-count sel-count--v" title="Assonances">V:{v}</span>}
            </span>
          );
        } else {
          const n = lineRhymes?.[s.id]?.size ?? 0;
          counts = n > 0 ? (
            <span className="sel-counts">
              <span className="sel-count sel-count--r" title="End rhymes">E:{n}</span>
            </span>
          ) : null;
        }

        return (
          <div
            key={s.id}
            className={`sel-row ${isFocused ? "is-focused" : ""} ${!s.active ? "is-inactive" : ""}`}
            style={isFocused ? { borderLeftColor: s.color } : {}}
            onClick={() => isWord ? setFocusedWordSelId(s.id) : setFocusedLineSelId(s.id)}
          >
            <span className="sel-dot" style={{ background: s.color }} />
            <span className="sel-label" title={isWord ? "Word" : "Line"}>{label}</span>
            {counts}
            <span className="sel-kind">{isWord ? "W" : "L"}</span>
            <button className="sel-btn"
              onClick={(e) => { e.stopPropagation(); isWord ? toggleWord(s.id) : toggleLine(s.id); }}
              title={s.active ? "Hide" : "Show"}>
              {s.active ? "\uD83D\uDC41\uFE0E" : "\uD83D\uDE48"}
            </button>
            <button className="sel-btn sel-btn--danger"
              onClick={(e) => { e.stopPropagation(); isWord ? removeWord(s.id) : removeLine(s.id); }}
              title="Remove">
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
