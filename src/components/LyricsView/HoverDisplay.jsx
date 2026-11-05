// src/components/LyricsView/HoverDisplay.jsx
// The hovered word's phones in the footer; on a match, the phones that made the rhyme in bold.
import React from "react";
export function HoverDisplay({ hoverData }) {
  if (!hoverData) return null;

  return (
    <div
      style={{
        fontFamily: "monospace",
        minHeight: "1.2em",
      }}
    >
      {hoverData.type === "word" && (
        <>
          {hoverData.marks
            ? hoverData.marks.map((x, j) => <React.Fragment key={j}>{j > 0 && " "}{x.on ? <b className="hover-phone-on">{x.p}</b> : x.p}</React.Fragment>)
            : hoverData.phones}
          {hoverData.match ? <span className="hover-match"> · {hoverData.match}</span> : null}
        </>
      )}

      {hoverData.type === "syllable" && (
        <>
          Vowel: <strong>{hoverData.vowel}</strong> | Syllable:{" "}
          {hoverData.syllableIndex + 1} of {hoverData.totalSyllables}
        </>
      )}
    </div>
  );
}
