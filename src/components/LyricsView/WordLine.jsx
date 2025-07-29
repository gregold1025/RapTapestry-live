import { WordBlock } from "./WordBlock";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";

export function WordLine({
  line,
  lineIdx,
  playheadTime,
  isCurrent,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
}) {
  const { selectedLineIdx, toggleLine } = useLineSelection();
  const isSelected = selectedLineIdx === lineIdx;

  return (
    <div
      className="line"
      style={{
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        fontWeight: isCurrent ? "bold" : "normal",
        backgroundColor: isSelected ? "#e6f7ff" : "transparent",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        onClick={() => toggleLine(lineIdx)}
        style={{
          cursor: "pointer",
          fontSize: 20,
          userSelect: "none",
          padding: "0 6px",
        }}
        title="Select line"
      >
        🟦
      </div>

      <div
        className="words-container"
        style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
      >
        {line.words?.map((word, wordIdx) => (
          <WordBlock
            key={wordIdx}
            word={word}
            lineIdx={lineIdx}
            wordIdx={wordIdx}
            playheadTime={playheadTime}
            hoverData={hoverData}
            onWordHover={onWordHover}
            onSyllableHover={onSyllableHover}
            onHoverEnd={onHoverEnd}
          />
        ))}
      </div>
    </div>
  );
}
