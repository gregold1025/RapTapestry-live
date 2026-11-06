// src/components/ClockPane/ClockFace.jsx
// The clock's face: one circle per ring (the current ring thicker, with a soft
// glow), a spoke per beat (bars stronger), and the drum band's outer edge.
// Colors follow the background like bar and beat lines.
import React, { useId } from "react";
import { ringRadius, polar, spokes, faceStrokes } from "./clockGeometry";

export default function ClockFace({ geo, cycleBars, beatsPerBar, background, currentRing }) {
  const { cx, cy, rOuter, rInner, drumBand, rings } = geo;
  const st = faceStrokes(background);
  const glowId = `clock-glow-${useId().replace(/:/g, "")}`;
  const circles = [];
  for (let i = 0; i < rings; i++) {
    const r = ringRadius(i, rings, rOuter, rInner);
    const cur = i === currentRing;
    if (cur) circles.push(<circle key="glow" cx={cx} cy={cy} r={r} fill="none" stroke={st.glow} strokeWidth={6} strokeOpacity={0.55} filter={`url(#${glowId})`} />);
    circles.push(
      <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={cur ? st.glow : st.ring} strokeWidth={cur ? 2.5 : 1} data-ring-line={i} />
    );
  }
  return (
    <g pointerEvents="none">
      <defs>
        <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      {spokes(cycleBars, beatsPerBar).map((s, j) => {
        const a = polar(cx, cy, rInner, s.frac), b = polar(cx, cy, rOuter + drumBand, s.frac);
        return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.kind === "bar" ? st.bar : st.beat} strokeWidth={s.kind === "bar" ? 1.5 : 1} />;
      })}
      {circles}
      <circle cx={cx} cy={cy} r={rOuter + drumBand} fill="none" stroke={st.beat} strokeWidth={1} />
    </g>
  );
}

