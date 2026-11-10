// src/components/ClockPane/ClockFace.jsx
// The clock's face: a spoke per beat (bars stronger) from the spiral's inner
// end to the drum band's edge, the edge itself, the spiral's line (drawn as
// fading pieces by clockDraw, so its ends fade), and a soft glow under the
// word being sung (Greg 2026-11-09). Colors follow the background like bar and beat lines.
import React, { useId } from "react";
import { polar, spokes, faceStrokes, radiusAt } from "./clockGeometry";

const FACE_PIECES = 17;   // facePieces: 8 fading pieces at each end and the body

export default function ClockFace({ geo, cycleBars, beatsPerBar, background }) {
  const { cx, cy, rOuter, rInner, drumBand, rings } = geo;
  const st = faceStrokes(background);
  const glowId = `clock-glow-${useId().replace(/[:«»]/g, "")}`;
  const rEnd = radiusAt(rings, rings, rOuter, rInner);
  return (
    <g pointerEvents="none">
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {spokes(cycleBars, beatsPerBar).map((s, j) => {
        const a = polar(cx, cy, rEnd, s.frac), b = polar(cx, cy, rOuter + drumBand, s.frac);
        return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.kind === "bar" ? st.bar : st.beat} strokeWidth={s.kind === "bar" ? 1.5 : 1} />;
      })}
      {Array.from({ length: FACE_PIECES }, (_, k) => (
        <path key={k} data-face="" fill="none" stroke={st.ring} strokeWidth={1} />
      ))}
      <path data-glow="" fill="none" stroke={st.glow} strokeWidth={12} strokeOpacity={0.7} strokeLinecap="round" filter={`url(#${glowId})`} />
      <path data-glow="" fill="none" stroke={st.glow} strokeWidth={5} strokeOpacity={0.45} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={rOuter + drumBand} fill="none" stroke={st.beat} strokeWidth={1} />
    </g>
  );
}
