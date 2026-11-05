// src/components/TapestryView/vocals/WordGlyphs.jsx
//
// Words on the tapestry, colored by the QUERY they belong to (color = query
// identity). The rhyme TYPE is not a color; the FORM is the dash: whole word
// solid, mosaic "5 3", embedded "1.5 3". For a mosaic or embedded match only
// the matched syllables (vi0..vi1, by measured timing) take the color; the rest
// of the word stays inactive.
//
// Vertical placement (percent of the vocals lane, 0 bottom .. 100 top):
//   unpitched   - every word at wordCenter
//   pitched     - the word's median F0 inside wordBand (centroid when unmeasured)
//   perSyllable - a curve through every syllable's F0 (stroke = thickness)
//
// Clicks: click = query (adopt / focus / new), shift = extend the focused query,
// Clicks: plain = scrub to that point; cmd = query (new / focus / adopt); cmd-shift = extend; alt = remove.

import React, { useState, useId } from "react";
import { timeAtEvent } from "../global/timeAtEvent";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useQueries } from "../../../contexts/QueryContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioControls } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { laneY, wordPitchCenter, syllablePitchPct } from "../../../utils/laneLayout";
import { f0Pct } from "../../../utils/timingModel";
import { FORM_BY_KEY } from "../../../engine";

/** Catmull-Rom spline through points, as an SVG path (straight line for < 3 points). */
function splinePath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y} L ${pts[0].x + 1} ${pts[0].y}`;
  if (pts.length === 2) return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const lo = Math.min(p1.x, p2.x), hi = Math.max(p1.x, p2.x);
    const c1x = Math.max(lo, Math.min(hi, p1.x + (p2.x - p0.x) / 6)), c1y = p1.y + (p2.y - p0.y) / 6;
    let c2x = Math.max(lo, Math.min(hi, p2.x - (p3.x - p1.x) / 6)); const c2y = p2.y - (p3.y - p1.y) / 6;
    if (c2x < c1x) c2x = c1x;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function WordGlyphs({ transcriptionData, onGlyphHoverEnter, onGlyphHoverLeave }) {
  const { layout, laneFor } = useTapestryLayout();
  const { visualByWordId, click } = useQueries();
  const {
    showWords, wordActiveColor, wordInactiveColor, wordInactiveOpacity, wordOpacity,
    wordMode, wordThicknessPx, wordCenter, wordBand,
  } = useParams();
  const { seekAll } = useAudioControls();
  const { centroidSpan, timing } = useSongData();
  const [hoveredWordId, setHoveredWordId] = useState(null);
  const instanceId = useId().replace(/:/g, "");

  if (!layout || !showWords) return null;

  const { rowHeight, timeToPixels, width: rowWidth } = layout;
  const lane = laneFor("vocals");
  const barH = Math.max(1, wordThicknessPx);
  const perSyllable = wordMode === "perSyllable";
  const pitched = wordMode !== "unpitched";
  const f0Mid = timing?.f0Mid ?? null;

  const glyphs = [];

  transcriptionData.lines.forEach((line, lineIdx) => {
    if (!line.words) return;
    line.words.forEach((word, wordIdx) => {
      const id = `${lineIdx}-${wordIdx}`;
      const tw = timing?.words.get(id);
      const start = tw?.start ?? word.start, end = tw?.end ?? word.end;
      if (typeof start !== "number" || typeof end !== "number") return;

      const vis = visualByWordId.get(id);
      const { x: startX, y: rowTop, row: startRow } = timeToPixels(start);
      const endPx = timeToPixels(end);
      const endX = endPx.row === startRow ? endPx.x : rowWidth;   // row-wrapped words end at the row edge
      const widthPx = Math.max(1, endX - startX);
      const n = Math.max(1, word.nSyllables ?? 1);
      const syls = tw?.syls ?? Array.from({ length: n }, (_, k) => ({ k, start: start + (k * (end - start)) / n, end: start + ((k + 1) * (end - start)) / n, f0: null }));

      // vertical: F0 when measured, centroid otherwise
      const centroidPct = wordPitchCenter(word, wordMode, wordBand, wordCenter, centroidSpan);
      const centerPct = pitched ? f0Pct(tw?.f0, f0Mid, wordBand, centroidPct) : wordCenter;
      const cy = laneY(rowTop, rowHeight, lane, centerPct);
      const rectY = cy - barH / 2;
      const xOf = (t) => { const p = timeToPixels(t); return p.row === startRow ? p.x : rowWidth; };

      // per-syllable curve through F0 (or centroid) points
      let curveD = null, curvePts = null;
      if (perSyllable) {
        curvePts = syls.map((s, k) => {
          const pct = f0Pct(s.f0, f0Mid, wordBand, syllablePitchPct(word, k, n, wordBand, centerPct, centroidSpan));
          return { x: xOf((s.start + s.end) / 2), y: laneY(rowTop, rowHeight, lane, pct) };
        });
        const pts = [{ x: startX, y: curvePts[0].y }, ...curvePts, { x: endX, y: curvePts[curvePts.length - 1].y }];
        curveD = splinePath(pts);
      }

      const isHovered = hoveredWordId === id;
      const active = !!vis;
      const events = {
        style: { cursor: "pointer" },
        pointerEvents: "visiblePainted",
        onClick: (e) => {
          e.stopPropagation();
          if (e.metaKey || e.ctrlKey || e.altKey) click(id, { shift: e.shiftKey, meta: false, alt: e.altKey });
          else { const t = timeAtEvent(e, layout); if (t != null) seekAll(t); }
        },
        onMouseEnter: (e) => {
          setHoveredWordId(id);
          onGlyphHoverEnter?.(e, { type: "word", wordText: word.text, phones: Array.isArray(word.phones) ? word.phones[0] : String(word.phones || ""), match: vis ? `${vis.type}${vis.form !== "word" ? " " + vis.form : ""}` : null });
        },
        onMouseLeave: (e) => { setHoveredWordId(null); onGlyphHoverLeave?.(e); },
        title: "Click: scrub here • Cmd+Click: query this word • Cmd+Shift+Click: extend the query • Alt+Click: remove",
      };

      // base shape = hit target (inactive look when unqueried)
      if (curveD) {
        glyphs.push(<path key={`${id}-base`} d={curveD} fill="none" stroke={active ? "transparent" : wordInactiveColor} strokeWidth={barH} strokeLinecap="butt" opacity={active ? 1 : wordInactiveOpacity} {...events} />);
      } else {
        glyphs.push(<rect key={`${id}-base`} x={startX} y={rectY} width={widthPx} height={barH} fill={active ? "transparent" : wordInactiveColor} opacity={active ? 1 : wordInactiveOpacity} {...events} />);
      }

      if (!active && !isHovered) return;

      // the matched part of the word (syllables vi0..vi1), in time
      const vi0 = vis ? Math.max(0, Math.min(syls.length - 1, vis.vi0 ?? 0)) : 0;
      const vi1 = vis ? Math.max(vi0, Math.min(syls.length - 1, vis.vi1 ?? syls.length - 1)) : syls.length - 1;
      const partial = vis && (vi0 > 0 || vi1 < syls.length - 1);
      const mx0 = partial ? xOf(syls[vi0].start) : startX;
      const mx1 = partial ? xOf(syls[vi1].end) : endX;
      const dash = vis ? FORM_BY_KEY[vis.form]?.dash ?? null : null;
      const color = vis?.color ?? wordActiveColor;
      const alpha = vis?.expected ? wordOpacity * 0.55 : wordOpacity;

      if (vis) {
        if (curveD && curvePts) {
          // color the matched stretch of the curve by clipping to its x range
          const clipId = `wclip${instanceId}-${id}`;   // per tapestry instance (the Line Staff pane draws the same words)
          glyphs.push(
            <g key={`${id}-m`}>
              {partial && <clipPath id={clipId}><rect x={mx0} y={rowTop} width={Math.max(1, mx1 - mx0)} height={rowHeight} /></clipPath>}
              <path d={curveD} fill="none" stroke={color} strokeWidth={barH} strokeLinecap="butt" strokeDasharray={dash ?? undefined} opacity={alpha} clipPath={partial ? `url(#${clipId})` : undefined} pointerEvents="none" />
              {vis.isAnchor && <path d={curveD} fill="none" stroke={color} strokeWidth={barH + 4} strokeLinecap="butt" opacity={0.35} pointerEvents="none" />}
            </g>
          );
        } else {
          glyphs.push(
            <rect key={`${id}-m`} x={mx0} y={rectY} width={Math.max(1, mx1 - mx0)} height={barH}
              fill={color} opacity={alpha}
              stroke={vis.isAnchor ? color : dash ? color : "none"} strokeWidth={vis.isAnchor ? 4 : dash ? 1.5 : 0}
              strokeDasharray={!vis.isAnchor && dash ? dash : undefined} pointerEvents="none" />
          );
        }
      }
      if (isHovered) {
        glyphs.push(curveD
          ? <path key={`${id}-h`} d={curveD} fill="none" stroke={wordActiveColor} strokeWidth={2} opacity={0.9} pointerEvents="none" />
          : <rect key={`${id}-h`} x={startX} y={rectY} width={widthPx} height={barH} fill="none" stroke={wordActiveColor} strokeWidth={2} opacity={0.9} pointerEvents="none" />);
      }
    });
  });

  return <>{glyphs}</>;
}
