// src/components/TapestryView/SyllableGlyphs.jsx
import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useSyllableSelection } from "../../contexts/SyllableSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { extractVowels } from "../../utils/extractVowels";
import { useAudioEngine } from "../../contexts/AudioContext";

export default function SyllableGlyphs({
  transcriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { matchedIds, selectedIds } = useSyllableSelection();
  const { vowelColors } = useParams();
  const { seekAll } = useAudioEngine();
  if (!layout || !timeToX) return null;

  const { secondsPerRow, rowHeight } = layout;
  const syllables = [];
  const radius = 10;

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;
    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number")
        return;
      const nSyllables = word.nSyllables ?? 1;
      const wordDuration = word.end - word.start;
      const syllableDuration = wordDuration / nSyllables;
      const vowels = extractVowels(word.phones?.[0]) ?? [];
      const centroids = word.centroid ?? [];
      const spacing = centroids.length / nSyllables;

      for (let si = 0; si < nSyllables; si++) {
        const start = word.start + si * syllableDuration;
        const x = timeToX(start) + radius;
        const vowel = vowels[si] ?? "AH";
        const row = Math.floor(start / secondsPerRow);
        const baseY = row * rowHeight + rowHeight / 2;
        const ci = Math.floor(si * spacing);
        const vertOff = ((centroids[ci] ?? 0.5) * 0.5 - 0.5) * rowHeight;
        const y = baseY + vertOff;
        const id = `${lineIdx}-${wordIdx}-${si}`;
        const isSelected = selectedIds.includes(id);
        const isMatch = matchedIds.has(id);
        const fill = isSelected
          ? vowelColors[vowel] ?? "#ff0000"
          : isMatch
          ? vowelColors[vowel] ?? "#cccccc"
          : "#dddddd";

        syllables.push(
          <circle
            key={id}
            cx={x}
            cy={y}
            r={radius}
            fill={fill}
            stroke={isSelected ? "red" : "none"}
            strokeWidth={isSelected ? 2 : 0}
            style={{ cursor: "pointer" }}
            onClick={() => seekAll(start)}
            onMouseEnter={(e) =>
              onGlyphHoverEnter(e, {
                wordText: word.text,
                phones: Array.isArray(word.phones)
                  ? word.phones.join(" ")
                  : String(word.phones),
                vowel,
                syllableIndex: si,
                totalSyllables: nSyllables,
              })
            }
            onMouseLeave={onGlyphHoverLeave}
          />
        );
      }
    });
  });

  return <>{syllables}</>;
}
