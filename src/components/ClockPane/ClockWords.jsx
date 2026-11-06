// src/components/ClockPane/ClockWords.jsx
// The words on the clock: an arc per ring a word covers (query color and form
// dash, or the clock's word color), a dot on each vowel of the rhyme, and,
// while the rings have room, the word's text running clockwise along the ring
// (upside down on the lower half). A wide invisible stroke is the hover and
// click target, so packed rings stay hoverable.
//
// Each ring's part of a word sits in a group whose transform and opacity come
// from CSS variables on the svg (--gt<ring>, --go<ring>), which
// useClockWindow sets per frame while the rings glide in or out. The margin
// rings (−1 and `rings`) are hidden at rest and never take the pointer.
import React, { memo } from "react";
import { arcPath, ringRadius, polar, labelArc, glideKey } from "./clockGeometry";

const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

function ClockWords({ marks, geo, textPx, showLabels, hitWidth, onWord, onHover, onLeave }) {
  const { cx, cy, rOuter, rInner, rings } = geo;
  const inRange = (ring) => ring >= 0 && ring < rings;
  const R = (ring) => ringRadius(Math.max(0, Math.min(rings - 1, ring)), rings, rOuter, rInner);
  return (
    <g fontFamily={FONT} style={{ userSelect: "none" }}>
      {marks.map((m) => {
        const pid = `clk-w-${m.id}`;
        const ringsOf = [...new Set([...m.segments.map((s) => s.ring), ...m.dots.map((d) => d.ring)])];
        const label = showLabels && m.text ? m.segments.find((s) => s.ring === m.labelRing) : null;
        return (
          <g key={m.id} data-word={m.id} data-start={m.start} data-ring={m.labelRing} style={{ cursor: "pointer" }}
            onClick={onWord ? (e) => onWord(e, m) : undefined}
            onMouseEnter={onHover ? (e) => onHover(e, m) : undefined}
            onMouseLeave={onLeave}>
            {ringsOf.map((ring) => {
              const key = glideKey(ring);
              return (
                <g key={ring} pointerEvents={inRange(ring) ? undefined : "none"}
                  style={{ transform: `var(--gt${key}, none)`, opacity: `var(--go${key}, ${inRange(ring) ? 1 : 0})` }}>
                  {m.segments.filter((s) => s.ring === ring).map((s, k) => (
                    <path key={k} d={arcPath(cx, cy, R(ring), s.f0, Math.max(s.f1, s.f0 + 0.002))} fill="none" stroke={m.color}
                      strokeWidth={m.hit ? 2.4 : 1.6} strokeOpacity={m.hit ? 1 : 0.8} strokeDasharray={m.dash ?? undefined} strokeLinecap="butt"
                      vectorEffect="non-scaling-stroke" />
                  ))}
                  {m.dots.filter((d) => d.ring === ring).map((d, k) => {
                    const p = polar(cx, cy, R(ring), d.frac);
                    return <circle key={`d${k}`} cx={p.x} cy={p.y} r={2.6} fill={m.color} />;
                  })}
                  {label && label.ring === ring && (
                    <>
                      <path id={pid} d={labelArc(cx, cy, R(ring), label.f0, label.f1, m.text, textPx)} fill="none" />
                      <text fontSize={textPx} fill={m.color} fontWeight={m.hit ? 600 : 400}>
                        <textPath href={`#${pid}`}>{m.text}</textPath>
                      </text>
                    </>
                  )}
                  {m.segments.filter((s) => s.ring === ring).map((s, k) => (
                    <path key={`h${k}`} d={arcPath(cx, cy, R(ring), s.f0, Math.max(s.f1, s.f0 + 0.01))} fill="none" stroke="transparent"
                      strokeWidth={hitWidth} pointerEvents="stroke" vectorEffect="non-scaling-stroke" />
                  ))}
                </g>
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

export default memo(ClockWords);
