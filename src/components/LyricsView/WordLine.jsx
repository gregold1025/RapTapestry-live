import { WordBlock } from "./WordBlock";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";

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
  const { lineActiveColor, lineOpacity } = useParams();
  const isSelected = selectedLineIdx === lineIdx;

  // small helper to turn "#rrggbb" into "rgba(r,g,b,alpha)"
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
      className="line"
      style={{
        paddingBottom: 6,
        borderBottom: "1px dashed #ccc",
        fontWeight: isCurrent ? "bold" : "normal",
        backgroundColor: bgRgba,
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <div
        className="line-select"
        onClick={() => toggleLine(lineIdx)}
        title="Select Line"
      >
        🟦
      </div>

      <div className="words-container">
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
