import { WordBlock } from "./WordBlock";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";

export function WordLine({
  line,
  lineIdx,
  playheadTime,
  hoverData,
  onWordHover,
  onSyllableHover,
  onHoverEnd,
  dataLineIdx, // ← camelCase prop
}) {
  const { selectedLineIdx, toggleLine } = useLineSelection();
  const { lineActiveColor, lineOpacity } = useParams();
  const isSelected = selectedLineIdx === lineIdx;
  const isCurrent = playheadTime >= line.start && playheadTime < line.end;
  if (isCurrent) {
    console.log("Current line:", lineIdx, line.text);
  }

  const hexToRgba = (hex, alpha = 1) => {
    const [r, g, b] = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((h) => parseInt(h, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const bgRgba = isSelected
    ? hexToRgba(lineActiveColor, lineOpacity)
    : "transparent";

  return (
    <div
      className={`line ${isCurrent ? "current" : ""}`}
      data-line-idx={
        dataLineIdx
      } /* rendered as data attribute for scroll anchoring */
      style={{
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        // fontWeight: isCurrent ? "bold" : "normal",
        backgroundColor: bgRgba,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        className="line-select"
        onClick={() => toggleLine(lineIdx)}
        title="Select line"
      >
        {isSelected ? "■" : "□"}
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
