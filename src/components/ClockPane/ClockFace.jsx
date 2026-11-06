// src/components/ClockPane/ClockFace.jsx
// The clock's face: the rings as one spiral, a turn per ring (one ring: a
// circle), the current ring's turn thicker with a soft glow, a spoke per beat
// (bars stronger), and the drum band's outer edge.
// Colors follow the background like bar and beat lines.
import React, { useId } from "react";
import { polar, spokes, faceStrokes, spiralPath } from "./clockGeometry";

export default function ClockFace({ geo, cycleBars, beatsPerBar, background, currentRing }) {
  const { cx, cy, rOuter, rInner, drumBand, rings } = geo;
  const st = faceStrokes(background);
  const glowId = `clock-glow-${useId().replace(/:/g, "")}`;
  const turn = (u0, u1) => spiralPath(cx, cy, u0, u1, rings, rOuter, rInner);
  const cur = currentRing != null && currentRing >= 0 && currentRing < rings;
  const curD = cur ? turn(currentRing, currentRing + 1) : null;
  return (
    <g pointerEvents="none">
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {spokes(cycleBars, beatsPerBar).map((s, j) => {
        const a = polar(cx, cy, rInner, s.frac), b = polar(cx, cy, rOuter + drumBand, s.frac);
        return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.kind === "bar" ? st.bar : st.beat} strokeWidth={s.kind === "bar" ? 1.5 : 1} />;
      })}
      <path d={turn(0, rings)} fill="none" stroke={st.ring} strokeWidth={1} data-ring-line="" />
      {cur && (
        <>
          <path d={curD} fill="none" stroke={st.glow} strokeWidth={6} strokeOpacity={0.55} filter={`url(#${glowId})`} />
          <path d={curD} fill="none" stroke={st.glow} strokeWidth={2.5} />
        </>
      )}
      <circle cx={cx} cy={cy} r={rOuter + drumBand} fill="none" stroke={st.beat} strokeWidth={1} />
    </g>
  );
}

