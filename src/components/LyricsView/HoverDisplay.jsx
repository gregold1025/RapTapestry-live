// src/components/LyricsView/HoverDisplay.jsx
export function HoverDisplay({ hoverData }) {
  if (!hoverData) return null;

  return (
    <div
      style={{
        // marginTop: "12px",
        color: "#444",
        fontFamily: "monospace",
        minHeight: "1.2em",
      }}
    >
      {hoverData.type === "word" && <>Phones: {hoverData.phones}</>}

      {hoverData.type === "syllable" && (
        <>
          Vowel: <strong>{hoverData.vowel}</strong> | Syllable:{" "}
          {hoverData.syllableIndex + 1} of {hoverData.totalSyllables} | Phones:{" "}
          {hoverData.phones}
        </>
      )}
    </div>
  );
}
