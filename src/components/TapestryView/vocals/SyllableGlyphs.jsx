// src/components/TapestryView/vocals/SyllableGlyphs.jsx
// Syllables are the data a query's matches are drawn on: each syllable sits at
// its measured onset (MFA) and, when pitched, at its F0; the syllables inside a
// match (vi0..vi1) take the query color, the rest the inactive look.
import React from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useQueries } from "../../../contexts/QueryContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useAudioControls } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { laneY, syllablePitchPct } from "../../../utils/laneLayout";
import { f0Pct } from "../../../utils/timingModel";
import { timeAtEvent } from "../global/timeAtEvent";
import "../TapestryView.css";

const SYLLABLE_MASK_ID = "tapestry-syllable-glyph-mask";
const SYLLABLE_SYMBOL_ID = "tapestry-syllable-glyph";
const SYL_NOMINAL = 100;

export default function SyllableGlyphs({ transcriptionData, onGlyphHoverEnter, onGlyphHoverLeave }) {
  const { layout, laneFor } = useTapestryLayout();
  const { visualByWordId, click } = useQueries();
  const {
    showSyllables, inactiveSyllableColor, syllableInactiveOpacity, syllableOpacity, syllableRadius,
    syllableMode, syllableBand, syllableFixedHeight, glyphStyle,
  } = useParams();
  const { seekAll } = useAudioControls();
  const { centroidSpan, timing } = useSongData();

  if (!layout || !showSyllables) return null;

  const glyphUrl = glyphStyle?.syllableGlyphUrl ?? null;
  const { rowHeight, timeToPixels } = layout;
  const lane = laneFor("vocals");
  const radius = syllableRadius ?? 8;
  const diameter = radius * 2;
  const pitched = syllableMode === "pitched";
  const f0Mid = timing?.f0Mid ?? null;

  const out = [];
  transcriptionData.lines.forEach((line, li) => {
    line.words?.forEach((word, wi) => {
      const id = `${li}-${wi}`;
      const tw = timing?.words.get(id);
      const start = tw?.start ?? word.start, end = tw?.end ?? word.end;
      if (typeof start !== "number" || typeof end !== "number") return;
      const n = Math.max(1, word.nSyllables ?? 1);
      const syls = tw?.syls ?? Array.from({ length: n }, (_, k) => ({ k, start: start + (k * (end - start)) / n, f0: null }));
      const vis = visualByWordId.get(id);

      syls.forEach((s, si) => {
        const inMatch = vis && si >= (vis.vi0 ?? 0) && si <= (vis.vi1 ?? syls.length - 1);
        const fill = inMatch ? vis.color : inactiveSyllableColor;
        const opacity = inMatch ? (vis.expected ? syllableOpacity * 0.55 : syllableOpacity) : syllableInactiveOpacity;
        if (!inMatch && opacity <= 0) return;
        const { x, y } = timeToPixels(s.start);
        const fallback = pitched ? syllablePitchPct(word, si, syls.length, syllableBand, syllableFixedHeight, centroidSpan) : syllableFixedHeight;
        const pct = pitched ? f0Pct(s.f0, f0Mid, syllableBand, fallback) : syllableFixedHeight;
        const cy = laneY(y, rowHeight, lane, pct);
        const sid = `${id}-${si}`;
        const handlers = {
          onClick: (e) => {
            e.stopPropagation();
            if (e.metaKey || e.ctrlKey || e.altKey) click(id, { shift: e.shiftKey, meta: false, alt: e.altKey });
            else { const t = timeAtEvent(e, layout); if (t != null) seekAll(t); }
          },
          onMouseEnter: (e) => onGlyphHoverEnter?.(e, { wordText: word.text, phones: Array.isArray(word.phones) ? word.phones[0] : String(word.phones ?? ""), vowel: s.vowel || undefined, syllableIndex: si, totalSyllables: syls.length, f0: s.f0 }),
          onMouseLeave: onGlyphHoverLeave,
          style: { cursor: "pointer" },
          pointerEvents: "visiblePainted",
        };
        out.push(
          glyphUrl
            ? <use key={sid} href={`#${SYLLABLE_SYMBOL_ID}`} x={x - radius} y={cy - radius} width={diameter} height={diameter} fill={fill} opacity={opacity} {...handlers} />
            : <circle key={sid} cx={x} cy={cy} r={radius} fill={fill} opacity={opacity} {...handlers} />
        );
        if (vis?.isAnchor && inMatch) {
          out.push(<circle key={`${sid}-a`} cx={x} cy={cy} r={radius + 2} fill="none" stroke={vis.color} strokeWidth={1.5} opacity={0.9} pointerEvents="none" />);
        }
      });
    });
  });

  return (
    <>
      {glyphUrl && (
        <defs>
          <mask id={SYLLABLE_MASK_ID} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL}>
            <image href={glyphUrl} x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL} preserveAspectRatio="xMidYMid meet" style={{ filter: "brightness(0) invert(1)" }} />
          </mask>
          <symbol id={SYLLABLE_SYMBOL_ID} viewBox={`0 0 ${SYL_NOMINAL} ${SYL_NOMINAL}`}>
            <rect x={0} y={0} width={SYL_NOMINAL} height={SYL_NOMINAL} mask={`url(#${SYLLABLE_MASK_ID})`} />
          </symbol>
        </defs>
      )}
      {out}
    </>
  );
}
