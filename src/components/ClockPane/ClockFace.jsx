// src/components/ClockPane/ClockFace.jsx
// The clock's face: one circle per ring (the current ring thicker, with a wide
// invisible stroke to grab it by), a spoke per beat (bars stronger), and the
// drum band's outer edge. Colors follow the background like bar and beat lines.
import React from "react";
import { ringRadius, polar, spokes, faceStrokes } from "./clockGeometry";

export default function ClockFace({ geo, cycleBars, beatsPerBar, background, currentRing }) {
  const { cx, cy, rOuter, rInner, drumBand, rings } = geo;
  const st = faceStrokes(background);
  const circles = [];
  for (let i = 0; i < rings; i++) {
    const r = ringRadius(i, rings, rOuter, rInner);
    const cur = i === currentRing;
    circles.push(
      <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={cur ? st.current : st.ring} strokeWidth={cur ? 2.5 : 1} data-ring-line={i} />
    );
  }
  return (
    <g pointerEvents="none">
      {spokes(cycleBars, beatsPerBar).map((s, j) => {
        const a = polar(cx, cy, rInner, s.frac), b = polar(cx, cy, rOuter + drumBand, s.frac);
        return <line key={j} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={s.kind === "bar" ? st.bar : st.beat} strokeWidth={s.kind === "bar" ? 1.5 : 1} />;
      })}
      {circles}
      <circle cx={cx} cy={cy} r={rOuter + drumBand} fill="none" stroke={st.beat} strokeWidth={1} />
    </g>
  );
}

/** The current ring's grab handle (a wide transparent stroke), drawn on top of the words. */
export function CurrentRingHandle({ geo, currentRing, enabled }) {
  if (currentRing == null || !enabled) return null;
  const { cx, cy, rOuter, rInner, rings } = geo;
  return (
    <circle cx={cx} cy={cy} r={ringRadius(currentRing, rings, rOuter, rInner)} fill="none" stroke="transparent" strokeWidth={6} data-current-ring="" style={{ cursor: "grab" }} pointerEvents="stroke" />
  );
}
