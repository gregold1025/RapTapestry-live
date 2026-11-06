// src/components/ClockPane/ClockWords.jsx
// The words on the clock: an arc per ring a word covers (query color and form
// dash, or the clock's word color), a dot on each vowel of the rhyme, and,
// while the rings have room, the word's text running clockwise along the ring
// (upside down on the lower half). A wide invisible stroke is the hover and
// click target, so packed rings stay hoverable.
import React, { memo } from "react";
import { arcPath, ringRadius, polar, labelArc } from "./clockGeometry";

const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

function ClockWords({ marks, geo, textPx, showLabels, hitWidth, onWord, onHover, onLeave }) {
  const { cx, cy, rOuter, rInner, rings } = geo;
  const R = (ring) => ringRadius(ring, rings, rOuter, rInner);
  return (
    <g fontFamily={FONT} style={{ userSelect: "none" }}>
      {marks.map((m) => {
        const first = m.segments[0];
        const pid = `clk-w-${m.id}`;
        return (
          <g key={m.id} data-word={m.id} data-start={m.start} data-ring={first.ring} style={{ cursor: "pointer" }}
            onClick={onWord ? (e) => onWord(e, m) : undefined}
            onMouseEnter={onHover ? (e) => onHover(e, m) : undefined}
            onMouseLeave={onLeave}>
            {m.segments.map((s, k) => (
              <path key={k} d={arcPath(cx, cy, R(s.ring), s.f0, Math.max(s.f1, s.f0 + 0.002))} fill="none" stroke={m.color}
                strokeWidth={m.hit ? 2.4 : 1.6} strokeOpacity={m.hit ? 1 : 0.8} strokeDasharray={m.dash ?? undefined} strokeLinecap="butt" />
            ))}
            {m.dots.map((d, k) => {
              const p = polar(cx, cy, R(d.ring), d.frac);
              return <circle key={`d${k}`} cx={p.x} cy={p.y} r={2.6} fill={m.color} />;
            })}
            {showLabels && m.text && (
              <>
                <path id={pid} d={labelArc(cx, cy, R(first.ring), first.f0, first.f1, m.text, textPx)} fill="none" />
                <text fontSize={textPx} fill={m.color} fontWeight={m.hit ? 600 : 400}>
                  <textPath href={`#${pid}`}>{m.text}</textPath>
                </text>
              </>
            )}
            {m.segments.map((s, k) => (
              <path key={`h${k}`} d={arcPath(cx, cy, R(s.ring), s.f0, Math.max(s.f1, s.f0 + 0.01))} fill="none" stroke="transparent" strokeWidth={hitWidth} pointerEvents="stroke" />
            ))}
          </g>
        );
      })}
    </g>
  );
}

export default memo(ClockWords);
