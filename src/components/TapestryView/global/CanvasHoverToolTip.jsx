// src/components/TapestryView/CanvasHoverTooltip.jsx
import React from "react";

export function CanvasHoverTooltip({ hoverInfo }) {
  if (!hoverInfo) return null;
  const { metadata, x, y } = hoverInfo;

  const style = {
    position: "fixed", // so it stays above everything
    top: y + 8, // offset a bit so it doesn’t sit under the cursor
    left: x + 8,
    pointerEvents: "none", // never block mouse
    background: "rgba(255,255,255,0.9)",
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "4px 8px",
    fontSize: "3rem",
    fontFamily: "sans-serif",
    color: "#333",
    zIndex: 9999,
    whiteSpace: "nowrap",
  };

  // Render whichever fields you provided as metadata
  return (
    <div style={style}>
      {metadata.wordText && (
        <>
          Word: <strong>{metadata.wordText}</strong>
          <br />
        </>
      )}
      {metadata.vowel && (
        <>
          Vowel: <strong>{metadata.vowel}</strong>
          <br />
        </>
      )}
      {typeof metadata.syllableIndex === "number" && (
        <>
          Syllable: {metadata.syllableIndex + 1} of {metadata.totalSyllables}
          <br />
        </>
      )}
      {metadata.phones && (
        <>
          Phones: {metadata.phones}
          <br />
        </>
      )}
    </div>
  );
}
