// src/components/Tapestry/Vocals/WordGlyphs.jsx
//
// Visual grammar per match type (decorations stack — multiple can show at once):
//   anchor      — solid fill + thick stroke border (full opacity)
//   rhyme       — solid fill, opacity ∝ rhyme score
//   alliteration — colored outline rect (no fill)
//   assonance   — dotted underline bar, full width
//   consonance  — solid underline bar, right half only (coda region)

import React, { useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useWordSelection } from "../../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { getThreshold, ALLITERATION_TIERS } from "../../../utils/phonemeSimilarity.js";

/**
 * Map a match score to an opacity multiplier.
 * threshold → 0.30 (just barely visible), 1.0 → 1.0 (fully opaque).
 */
function scoreToOpacityMult(score, threshold) {
  if (threshold >= 1) return score >= 1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (score - threshold) / (1 - threshold)));
  return 0.30 + t * 0.70;
}

export default function WordGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout } = useTapestryLayout();
  const { getVisualForWord, anchorOrAdopt, selections, removeSelection, markWordInteraction } =
    useWordSelection();

  const {
    showWords,
    wordActiveColor,
    wordInactiveColor,
    wordOpacity,
    showRhymes,
    alliterationTier,
    showAssonance,
    rhymeStrictness,
    assonanceStrictness,
  } = useParams();

  const { seekAll } = useAudioEngine();
  const [hoveredWordId, setHoveredWordId] = useState(null);

  if (!layout || !showWords) return null;

  const { rowHeight, timeToPixels } = layout;
  const barH   = rowHeight * 0.3;
  const vPad   = (rowHeight - barH) / 2 - 4;
  const underY = barH + 3;
  const underH = 3;

  const rhymeThresh = getThreshold(rhymeStrictness,     "rhyme");
  const assonThresh = getThreshold(assonanceStrictness, "assonance");
  const allitThresh = ALLITERATION_TIERS[alliterationTier]?.threshold ?? 1;

  function removeMostRecentAnchorFor(wordId) {
    const candidates = selections.filter((s) => s.wordId === wordId);
    if (!candidates.length) return;
    const mostRecent = candidates.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
    removeSelection(mostRecent.id);
  }

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;

    line.words.forEach((word, wordIdx) => {
      if (typeof word.start !== "number" || typeof word.end !== "number") return;

      const id = `${lineIdx}-${wordIdx}`;
      const vis = getVisualForWord(id);

      const { x: startX, row } = timeToPixels(word.start);
      const { x: endX }        = timeToPixels(word.end);
      const widthPx = Math.max(1, endX - startX);
      const rectY   = row * rowHeight + vPad;
      const isHovered = hoveredWordId === id;

      const sharedEvents = {
        style:       { cursor: "pointer" },
        onClick:     (e) => {
          if (e.metaKey || e.ctrlKey) { e.stopPropagation(); anchorOrAdopt(id); return; }
          if (e.altKey)               { e.stopPropagation(); markWordInteraction(); removeMostRecentAnchorFor(id); return; }
          seekAll(word.start);
        },
        onMouseEnter: (e) => {
          setHoveredWordId(id);
          onGlyphHoverEnter?.(e, {
            type: "word",
            wordText: word.text,
            phones: Array.isArray(word.phones) ? word.phones.join(" ") : String(word.phones || ""),
          });
        },
        onMouseLeave: (e) => { setHoveredWordId(null); onGlyphHoverLeave?.(e); },
        title: "Click: seek \u2022 Cmd/Ctrl+Click: select anchor \u2022 Alt+Click: remove anchor",
      };

      // ── Anchor — solid fill + thick stroke, early return ───────
      if (vis?.roles?.isAnchor) {
        glyphs.push(
          <rect key={`${id}-base`}
            x={startX} y={rectY} width={widthPx} height={barH}
            fill={vis.color} opacity={wordOpacity}
            stroke={vis.color} strokeWidth={5}
            {...sharedEvents}
          />
        );
        return;
      }

      // ── Base rect (interactive hit target, always rendered) ────
      glyphs.push(
        <rect key={`${id}-base`}
          x={startX} y={rectY} width={widthPx} height={barH}
          fill={wordInactiveColor} opacity={wordOpacity}
          {...sharedEvents}
        />
      );

      // ── Rhyme — solid fill, opacity ∝ score ────────────────────
      if (vis?.roles?.isRhyme && showRhymes) {
        const mult = scoreToOpacityMult(vis.score, rhymeThresh);
        glyphs.push(
          <rect key={`${id}-match`}
            x={startX} y={rectY} width={widthPx} height={barH}
            fill={vis.color} opacity={wordOpacity * mult}
            pointerEvents="none"
          />
        );
      }

      // ── Alliteration — colored outline rect ────────────────────
      if (vis?.roles?.isAlliteration && alliterationTier !== "off") {
        const mult = scoreToOpacityMult(vis.score, allitThresh);
        glyphs.push(
          <rect key={`${id}-allit`}
            x={startX} y={rectY} width={widthPx} height={barH}
            fill="none" stroke={vis.color} strokeWidth={2}
            opacity={wordOpacity * mult}
            pointerEvents="none"
          />
        );
      }

      // ── Assonance — dotted underline, full width ────────────────
      if (vis?.roles?.isAssonance && showAssonance) {
        const mult = scoreToOpacityMult(vis.score, assonThresh);
        glyphs.push(
          <line key={`${id}-ason`}
            x1={startX} y1={rectY + underY}
            x2={startX + widthPx} y2={rectY + underY}
            stroke={vis.color} strokeWidth={underH}
            strokeDasharray="3 3" opacity={wordOpacity * mult}
            pointerEvents="none"
          />
        );
      }

      // ── Hover outline ──────────────────────────────────────────
      if (isHovered) {
        glyphs.push(
          <rect key={`${id}-hover`}
            x={startX} y={rectY} width={widthPx} height={barH}
            fill="none" stroke={wordActiveColor} strokeWidth={3}
            opacity={1} pointerEvents="none"
          />
        );
      }
    });
  });

  return <>{glyphs}</>;
}
