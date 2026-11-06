// src/components/ClockPane/ClockLines.jsx
// Queried and matched lines (line queries): the stretch of spiral each line
// covers, in its query's color, under the words. Their rhyming end words come
// up as query words (clockMarks.lineMarks); the line itself is only colored.
import React, { memo } from "react";
import { spiralPath } from "./clockGeometry";

function ClockLines({ spans, geo, width = 4 }) {
  const { cx, cy, rOuter, rInner, rings } = geo;
  if (!spans.length) return null;
  return (
    <g pointerEvents="none" data-lines="">
      {spans.map((s) => (
        <path key={s.li} data-start={s.start} data-ring={Math.floor(s.u0)} d={spiralPath(cx, cy, s.u0, s.u1, rings, rOuter, rInner)}
          fill="none" stroke={s.color} strokeWidth={width} strokeOpacity={0.6} strokeLinecap="round" />
      ))}
    </g>
  );
}

export default memo(ClockLines);
