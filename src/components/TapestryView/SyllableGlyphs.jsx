import React from "react";
import { useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useSyllableSelection } from "../../contexts/SyllableSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { extractVowels } from "../../utils/extractVowels";

export default function SyllableGlyphs({ transcriptionData, timeToX }) {
  const { layout } = useTapestryLayout();
  const { matchedIds, selectedIds } = useSyllableSelection();
  const { vowelColors } = useParams();

  if (!layout || !timeToX) return null;

  const { secondsPerRow, rowHeight } = layout;

  const syllables = [];

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
        const x = timeToX(start);
        const vowel = vowels[si] ?? "AH"; // <-- Needed for correct fill color

        const row = Math.floor(start / secondsPerRow);
        const baseY = row * rowHeight + rowHeight / 2;

        const centroidIndex = Math.floor(si * spacing);
        const centroid = centroids[centroidIndex] ?? 0.5;
        const verticalOffset = (centroid * 0.5 - 0.5) * rowHeight;

        const y = baseY + verticalOffset;

        const id = `${lineIdx}-${wordIdx}-${si}`;
        const isSelected = selectedIds.includes(id);
        const isMatch = matchedIds.has(id);
        const fill = isSelected
          ? vowelColors[vowel] ?? "#ff0000"
          : isMatch
          ? vowelColors[vowel] ?? "#cccccc"
          : "#dddddd";

        if (matchedIds.has(id)) {
          console.log("🎯 [Tapestry] matched syllable:", id);
        }

        syllables.push(
          <circle
            key={id}
            cx={x}
            cy={y}
            r={10}
            fill={fill}
            stroke={isMatch ? "black" : "none"}
            strokeWidth={isMatch ? 1.5 : 0}
          />
        );
      }
    });
  });

  return <>{syllables}</>;
}
