// src/components/Tapestry/Vocals/WordGlyphs.jsx
//
// Visual grammar per match type (decorations stack — multiple can show at once):
//   anchor       — solid fill + thick stroke border (full opacity)
//   rhyme        — solid fill, opacity ∝ rhyme score
//   alliteration — colored outline rect (no fill)
//   assonance    — dotted underline bar, full width
//
// Vertical placement (percent of the vocals lane, 0 bottom .. 100 top):
//   unpitched   — every word at wordCenter
//   pitched     — word at its first syllable's centroid inside wordBand
//   perSyllable — a curve through every syllable's centroid (stroke = thickness)

import React, { useState } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useWordSelection } from "../../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioControls } from "../../../contexts/AudioContext";
import { getThreshold, ALLITERATION_TIERS } from "../../../utils/phonemeSimilarity.js";
import { laneY, wordPitchCenter, syllablePitchPct } from "../../../utils/laneLayout";

/**
 * Map a match score to an opacity multiplier.
 * threshold → 0.30 (just barely visible), 1.0 → 1.0 (fully opaque).
 */
function scoreToOpacityMult(score, threshold) {
  if (threshold >= 1) return score >= 1 ? 1 : 0;
  const t = Math.max(0, Math.min(1, (score - threshold) / (1 - threshold)));
  return 0.30 + t * 0.70;
}

/** Catmull-Rom spline through points, as an SVG path (straight line for < 3 points). */
function splinePath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 1} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function WordGlyphs({
  transcriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { layout, laneFor } = useTapestryLayout();
  const { getVisualForWord, anchorOrAdopt, selections, removeSelection, markWordInteraction } =
    useWordSelection();

  const {
    showWords,
    wordActiveColor,
    wordInactiveColor,
    wordInactiveOpacity,
    wordOpacity,
    wordMode,
    wordThicknessPx,
    wordCenter,
    wordBand,
    showRhymes,
    alliterationTier,
    showAssonance,
    rhymeStrictness,
    assonanceStrictness,
  } = useParams();

  const { seekAll } = useAudioControls();
  const [hoveredWordId, setHoveredWordId] = useState(null);

  if (!layout || !showWords) return null;

  const { rowHeight, timeToPixels } = layout;
  const lane = laneFor("vocals");
  const barH = Math.max(1, wordThicknessPx);
  const underH = 3;
  const perSyllable = wordMode === "perSyllable";

  const rhymeThresh = getThreshold(rhymeStrictness, "rhyme");
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

      const { x: startX, y: rowTop } = timeToPixels(word.start);
      const { x: endX } = timeToPixels(word.end);
      const widthPx = Math.max(1, endX - startX);
      const centerPct = wordPitchCenter(word, wordMode, wordBand, wordCenter);
      const cy = laneY(rowTop, rowHeight, lane, centerPct);
      const rectY = cy - barH / 2;
      const isHovered = hoveredWordId === id;

      const isAnchor = !!vis?.roles?.isAnchor;
      const isRhyme = !!vis?.roles?.isRhyme && showRhymes;
      const isAllit = !!vis?.roles?.isAlliteration && alliterationTier !== "off";
      const isAson = !!vis?.roles?.isAssonance && showAssonance;
      const active = isAnchor || isRhyme || isAllit || isAson;

      // Per-syllable curve through syllable centroids (only meaningful for 2+ syllables)
      let curveD = null;
      if (perSyllable) {
        const n = word.nSyllables ?? 1;
        const pts = [];
        for (let si = 0; si < n; si++) {
          const t = word.start + (si + 0.5) * ((word.end - word.start) / n);
          const { x } = timeToPixels(t);
          const pct = syllablePitchPct(word, si, n, wordBand, centerPct);
          pts.push({ x, y: laneY(rowTop, rowHeight, lane, pct) });
        }
        if (pts.length) {
          pts.unshift({ x: startX, y: pts[0].y });
          pts.push({ x: endX, y: pts[pts.length - 1].y });
          curveD = splinePath(pts);
        }
      }

      const sharedEvents = {
        style: { cursor: "pointer" },
        pointerEvents: "visiblePainted", // layer root is pointer-events:none
        onClick: (e) => {
          if (e.metaKey || e.ctrlKey) { e.stopPropagation(); anchorOrAdopt(id); return; }
          if (e.altKey) { e.stopPropagation(); markWordInteraction(); removeMostRecentAnchorFor(id); return; }
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
        title: "Click: seek • Cmd/Ctrl+Click: select anchor • Alt+Click: remove anchor",
      };

      // Base shape: the hit target. Inactive words draw with the inactive
      // color/opacity (opacity 0 by default = invisible but still clickable).
      const baseFill = active ? "none" : wordInactiveColor;
      const baseOpacity = active ? 1 : wordInactiveOpacity;
      if (curveD) {
        glyphs.push(
          <path key={`${id}-base`} d={curveD} fill="none"
            stroke={active ? "transparent" : wordInactiveColor} strokeWidth={barH} strokeLinecap="round"
            opacity={active ? 1 : baseOpacity} {...sharedEvents} />
        );
      } else {
        glyphs.push(
          <rect key={`${id}-base`} x={startX} y={rectY} width={widthPx} height={barH}
            fill={active ? "transparent" : baseFill} opacity={active ? 1 : baseOpacity}
            {...sharedEvents} />
        );
      }

      if (!active && !isHovered) return;

      const paint = (key, { fill, stroke, strokeWidth, opacity, dash }) => {
        if (curveD) {
          return (
            <path key={key} d={curveD} fill="none"
              stroke={fill !== "none" ? fill : stroke} strokeWidth={fill !== "none" ? barH : strokeWidth}
              strokeLinecap="round" strokeDasharray={dash} opacity={opacity} pointerEvents="none" />
          );
        }
        return (
          <rect key={key} x={startX} y={rectY} width={widthPx} height={barH}
            fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeDasharray={dash}
            opacity={opacity} pointerEvents="none" />
        );
      };

      if (isAnchor) {
        glyphs.push(paint(`${id}-anchor`, { fill: vis.color, stroke: vis.color, strokeWidth: 5, opacity: wordOpacity }));
        return;
      }

      if (isRhyme) {
        const ri = vis.rhymeInfo;
        const mult = scoreToOpacityMult(ri?.score ?? vis.score, rhymeThresh);
        glyphs.push(paint(`${id}-match`, { fill: ri?.color ?? vis.color, stroke: "none", strokeWidth: 0, opacity: wordOpacity * mult }));
      }

      if (isAllit) {
        const ai = vis.alliterationInfo;
        const mult = scoreToOpacityMult(ai?.score ?? vis.score, allitThresh);
        glyphs.push(paint(`${id}-allit`, { fill: "none", stroke: ai?.color ?? vis.color, strokeWidth: 2, opacity: wordOpacity * mult }));
      }

      if (isAson) {
        const si = vis.assonanceInfo;
        const mult = scoreToOpacityMult(si?.score ?? vis.score, assonThresh);
        glyphs.push(
          <line key={`${id}-ason`}
            x1={startX} y1={rectY + barH + 3} x2={startX + widthPx} y2={rectY + barH + 3}
            stroke={si?.color ?? vis.color} strokeWidth={underH}
            strokeDasharray="3 3" opacity={wordOpacity * mult} pointerEvents="none" />
        );
      }

      if (isHovered) {
        glyphs.push(paint(`${id}-hover`, { fill: "none", stroke: wordActiveColor, strokeWidth: 3, opacity: 1 }));
      }
    });
  });

  return <>{glyphs}</>;
}
