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
  dataLineIdx,
}) {
  const { selectedLineIdx, toggleLine, matchedLineIdxs } = useLineSelection();
  const { lineActiveColor, lineOpacity } = useParams();

  const isSelected = selectedLineIdx === lineIdx;
  const isMatched = matchedLineIdxs?.has?.(lineIdx);
  const isCurrent = playheadTime >= line.start && playheadTime < line.end;

  const hexToRgba = (hex, alpha = 1) => {
    const [r, g, b] = hex
      .replace(/^#/, "")
      .match(/.{2}/g)
      .map((h) => parseInt(h, 16));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  // both selected and matched share same background
  const bgRgba =
    isSelected || isMatched
      ? hexToRgba(lineActiveColor, lineOpacity)
      : "transparent";

  // red outline only if selected
  const outlineStyle = isSelected ? "2px solid red" : "none";

  return (
    <div
      className={[
        "line",
        isCurrent ? "current" : "",
        isSelected ? "selected" : "",
        isMatched ? "matched" : "",
      ]
        .join(" ")
        .trim()}
      data-line-idx={dataLineIdx}
      style={{
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        backgroundColor: bgRgba,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        outline: outlineStyle, // red outline on selection
        outlineOffset: "-2px", // keeps outline inside
      }}
    >
      <div
        className="line-select"
        onClick={() => toggleLine(lineIdx)}
        title={isSelected ? "Unselect line" : "Select line"}
        aria-pressed={isSelected}
        role="button"
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
