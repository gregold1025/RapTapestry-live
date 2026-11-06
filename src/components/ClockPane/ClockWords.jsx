// src/components/ClockPane/ClockWords.jsx
// The words on the clock: an arc per ring a word covers (query color and form
// dash, or the clock's word color), a dot on each vowel of the rhyme, and,
// while the rings have room, the word's text along the ring (flipped on the
// lower half so it reads upright). A wide invisible stroke is the hover and
// click target, so packed rings stay hoverable.
import React, { memo } from "react";
import { arcPath, ringRadius, polar } from "./clockGeometry";

const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
const TAU = Math.PI * 2;

/** The text's path: along the ring just outside it, from the word's start, reversed on the lower half. */
function labelPath(cx, cy, r, f0, f1, text, fs) {
  const span = Math.min(0.5, Math.max(f1 - f0, (text.length * fs * 0.6 + 4) / (TAU * r)));
  const mid = f0 + span / 2;
  const lower = mid % 1 > 0.25 && mid % 1 < 0.75;
  if (!lower) return arcPath(cx, cy, r + 3, f0, f0 + span);
  // counterclockwise from f0 + span back to f0, baseline pushed out so glyphs grow inward to r + 3
  const R = r + 3 + fs * 0.78;
  const a = polar(cx, cy, R, f0 + span), b = polar(cx, cy, R, f0);
  return `M${a.x.toFixed(2)},${a.y.toFixed(2)} A${R.toFixed(2)},${R.toFixed(2)} 0 ${span > 0.5 ? 1 : 0} 0 ${b.x.toFixed(2)},${b.y.toFixed(2)}`;
}

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
                <path id={pid} d={labelPath(cx, cy, R(first.ring), first.f0, first.f1, m.text, textPx)} fill="none" />
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
