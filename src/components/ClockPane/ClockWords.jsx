// src/components/ClockPane/ClockWords.jsx
// The words on the clock: an arc along the spiral for each cycle a word
// covers (query color and form dash, or the clock's word color), a dot on
// each vowel of the rhyme, and, while the turns have room, the word's text
// running clockwise along the spiral (upside down on the lower half). A wide
// invisible stroke is the hover and click target, so packed turns stay
// hoverable. Elements carry song positions; clockDraw places them.
import React, { memo } from "react";

const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

function ClockWords({ marks, textPx, showLabels, hitWidth, onWord, onHover, onLeave }) {
  return (
    <g fontFamily={FONT} style={{ userSelect: "none" }}>
      {marks.map((m) => {
        const first = m.segments[0], last = m.segments[m.segments.length - 1];
        const pid = `clk-w-${m.id}`;
        return (
          <g key={m.id} data-word={m.id} data-start={m.start} data-umid={(first.u0 + last.u1) / 2} style={{ cursor: "pointer" }}
            onClick={onWord ? (e) => onWord(e, m) : undefined}
            onMouseEnter={onHover ? (e) => onHover(e, m) : undefined}
            onMouseLeave={onLeave}>
            {m.segments.map((s, k) => (
              <path key={k} data-u0={s.u0} data-u1={Math.max(s.u1, s.u0 + 0.002)} fill="none" stroke={m.color}
                strokeWidth={m.hit ? 2.4 : 1.6} strokeOpacity={m.hit ? 1 : 0.8} strokeDasharray={m.dash ?? undefined} strokeLinecap="butt" />
            ))}
            {m.dots.map((d, k) => <circle key={`d${k}`} data-u={d.u} r={2.6} fill={m.color} />)}
            {showLabels && m.text && (
              <>
                <path id={pid} data-u0={first.u0} data-u1={first.u1} data-tlen={m.text.length * textPx * 0.6 + 4} data-off={3} fill="none" />
                <text fontSize={textPx} fill={m.color} fontWeight={m.hit ? 600 : 400}>
                  <textPath href={`#${pid}`}>{m.text}</textPath>
                </text>
              </>
            )}
            {m.segments.map((s, k) => (
              <path key={`h${k}`} data-u0={s.u0} data-u1={Math.max(s.u1, s.u0 + 0.01)} fill="none" stroke="transparent" strokeWidth={hitWidth} pointerEvents="stroke" />
            ))}
          </g>
        );
      })}
    </g>
  );
}

export default memo(ClockWords);
