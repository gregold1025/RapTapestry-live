import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useSyllableSelection } from "../../../contexts/lyricsContexts/SyllableSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { extractVowels } from "../../../utils/extractVowels";
import { useAudioControls } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { laneY, syllablePitchPct } from "../../../utils/laneLayout";
import "../TapestryView.css";

// One shared <mask> + <symbol> pair serves every syllable glyph; each glyph
// is then a single <use>. (Chrome does not render <image> inside an
// objectBoundingBox mask, so the mask lives in user space inside a symbol.)
const SYLLABLE_MASK_ID = "tapestry-syllable-glyph-mask";
const SYLLABLE_SYMBOL_ID = "tapestry-syllable-glyph";
const SYL_NOMINAL = 100; // symbol viewBox size; scaled per glyph via <use>

export default function SyllableGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout, laneFor } = useTapestryLayout();
  const { matchedIds, selectedIds, handleSyllableClick } = useSyllableSelection();

  const {
    showSyllables,
    vowelColors,
    inactiveSyllableColor,
    syllableInactiveOpacity,
    syllableOpacity,
    syllableRadius,
    syllableMode,
    syllableBand,
    syllableFixedHeight,
    glyphStyle,
  } = useParams();

  const glyphUrl = glyphStyle?.syllableGlyphUrl ?? null;
  const { seekAll } = useAudioControls();
  const { centroidSpan } = useSongData();

  // Stable flat index of syllable ids (kept for future connectors).
  useMemo(() => {
    const ids = [];
    transcriptionData.lines.forEach((line, li) =>
      line.words?.forEach((word, wi) => {
        const n = word.nSyllables ?? 1;
        for (let si = 0; si < n; si++) ids.push(`${li}-${wi}-${si}`);
      })
    );
    return ids;
  }, [transcriptionData]);

  // Hooks above; early return below (rules-of-hooks).
  if (!layout || !showSyllables) return null;

  const { rowHeight, timeToPixels } = layout;
  const lane = laneFor("vocals");
  const radius = syllableRadius ?? 8;
  const diameter = radius * 2;
  const pitched = syllableMode === "pitched";

  const syllables = [];

  transcriptionData.lines.forEach((line, li) => {
    line.words?.forEach((word, wi) => {
      if (typeof word.start !== "number" || typeof word.end !== "number") return;

      const nSyllables = word.nSyllables ?? 1;
      const syllableDuration = (word.end - word.start) / nSyllables;
      const vowels = extractVowels(word.phones?.[0]) ?? [];

      for (let si = 0; si < nSyllables; si++) {
        const start = word.start + si * syllableDuration;
        const { x, y } = timeToPixels(start);
        const pct = pitched
          ? syllablePitchPct(word, si, nSyllables, syllableBand, syllableFixedHeight, centroidSpan)
          : syllableFixedHeight;
        const finalY = laneY(y, rowHeight, lane, pct);
        const id = `${li}-${wi}-${si}`;

        const isSelected = selectedIds.includes(id);
        const isMatch = matchedIds.has(id);
        const active = isSelected || isMatch;
        const fill = active ? vowelColors[vowels[si] ?? "AH"] : inactiveSyllableColor;
        const opacity = active ? syllableOpacity : syllableInactiveOpacity;
        if (!active && opacity <= 0) continue; // nothing to draw or hit

        const commonHandlers = {
          onClick: (e) => {
            if (e?.metaKey || e?.ctrlKey) { handleSyllableClick(id); return; }
            seekAll(start);
          },
          onMouseEnter: (e) =>
            onGlyphHoverEnter(e, {
              wordText: word.text,
              phones: Array.isArray(word.phones) ? word.phones.join(" ") : String(word.phones),
              vowel: vowels[si] ?? "AH",
              syllableIndex: si,
              totalSyllables: nSyllables,
            }),
          onMouseLeave: onGlyphHoverLeave,
          style: { cursor: "pointer" },
          pointerEvents: "visiblePainted", // layer root is pointer-events:none
        };

        if (!glyphUrl) {
          syllables.push(
            <circle
              key={id}
              cx={x + radius}
              cy={finalY}
              r={radius}
              fill={fill}
              opacity={opacity}
              stroke={isSelected ? "red" : "none"}
              strokeWidth={isSelected ? 2 : 0}
              {...commonHandlers}
            />
          );
        } else {
          syllables.push(
            <use
              key={id}
              href={`#${SYLLABLE_SYMBOL_ID}`}
              x={x}
              y={finalY - radius}
              width={diameter}
              height={diameter}
              fill={fill}
              opacity={opacity}
              {...commonHandlers}
            />
          );
          if (isSelected) {
            syllables.push(
              <circle
                key={`${id}-sel`}
                cx={x + radius}
                cy={finalY}
                r={radius + 1.5}
                fill="none"
                stroke="red"
                strokeWidth={2}
                pointerEvents="none"
              />
            );
          }
        }
      }
    });
  });

  return (
    <>
      {glyphUrl && (
        <defs>
          <mask
            id={SYLLABLE_MASK_ID}
            maskUnits="userSpaceOnUse"
            maskContentUnits="userSpaceOnUse"
            x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL}
          >
            <image
              href={glyphUrl}
              x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL}
              preserveAspectRatio="xMidYMid meet"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </mask>
          <symbol id={SYLLABLE_SYMBOL_ID} viewBox={`0 0 ${SYL_NOMINAL} ${SYL_NOMINAL}`}>
            <rect x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL} mask={`url(#${SYLLABLE_MASK_ID})`} />
          </symbol>
        </defs>
      )}
      {syllables}
    </>
  );
}
