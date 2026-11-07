// src/components/ClockPane/ClockLines.jsx
// Queried and matched lines (line queries): the stretch of spiral each line
// covers, in its query's color, under the words. Their rhyming end words come
// up as query words (clockMarks.lineMarks); the line itself is only colored.
// Elements carry song positions; clockDraw places them.
import React, { memo } from "react";

function ClockLines({ spans, width = 4 }) {
  if (!spans.length) return null;
  return (
    <g pointerEvents="none" data-lines="">
      {spans.map((s) => (
        <path key={s.li} data-u0={s.u0} data-u1={s.u1} data-start={s.start} data-umid={(s.u0 + s.u1) / 2}
          fill="none" stroke={s.color} strokeWidth={width} strokeOpacity={0.6} strokeLinecap="round" />
      ))}
    </g>
  );
}

export default memo(ClockLines);
