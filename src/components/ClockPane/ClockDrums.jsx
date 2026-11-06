// src/components/ClockPane/ClockDrums.jsx
// One cycle of drum glyphs (the current ring's) in the band outside the
// outermost ring. Each class or band keeps its glyph, size, opacity and
// visibility from the Drums panel; its height sets how far out it sits.
// The glyph masks follow DrumsGlyphs (one mask + symbol per glyph url).
import React, { useId } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { defaultGlyphFor } from "../../utils/drumGlyphDefaults";
import { polar } from "./clockGeometry";

const DRUM_NOMINAL = 300; // symbol viewBox size (glyph occupies 100..200)

export default function ClockDrums({ marks, geo, scale = 1, byClass }) {
  const { drumParams, drumBands, drumClasses, glyphAssets } = useParams();
  const instanceId = `clock-${useId().replace(/:/g, "")}`;
  const { cx, cy, rOuter, drumBand } = geo;
  const groups = byClass ? drumClasses : drumBands;
  const { fillColor = "#bbbbbb", tilt = 10 } = drumParams || {};
  const byName = glyphAssets?.syllableGlyphByName;

  const urls = new Map();
  const symbolFor = (url) => {
    if (!url) return null;
    if (!urls.has(url)) urls.set(url, `${instanceId}-dg${urls.size}`);
    return urls.get(url);
  };

  const glyphs = marks.map((m, i) => {
    const g = groups?.[m.rowKey] ?? {};
    const size = (g.size ?? 12) * scale * (drumParams?.size ?? 1);
    const box = size * 3;
    const { x, y } = polar(cx, cy, rOuter + 4 + (m.height / 100) * Math.max(0, drumBand - 8), m.frac);
    const sym = symbolFor(g.glyphUrl === "none" ? null : g.glyphUrl ?? defaultGlyphFor(m.rowKey, byName));
    const opacity = (drumParams?.opacity ?? 1) * (g.opacity ?? 1) * (byClass && m.conf != null ? 0.5 + 0.5 * Math.min(1, m.conf) : 1);
    return sym ? (
      <use key={i} href={`#${sym}`} data-start={m.time} transform={`translate(${x}, ${y}) rotate(${tilt})`} x={-box / 2} y={-box / 2} width={box} height={box} fill={fillColor} opacity={opacity} />
    ) : (
      <circle key={i} data-start={m.time} cx={x} cy={y} r={size / 2} fill={fillColor} opacity={opacity} />
    );
  });

  return (
    <g pointerEvents="none" data-drums="">
      {urls.size > 0 && (
        <defs>
          {[...urls].map(([url, id]) => (
            <React.Fragment key={id}>
              <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={0} y={0} width={DRUM_NOMINAL} height={DRUM_NOMINAL}>
                <image href={url} x={DRUM_NOMINAL / 3} y={DRUM_NOMINAL / 3} width={DRUM_NOMINAL / 3} height={DRUM_NOMINAL / 3} preserveAspectRatio="xMidYMid meet" style={{ filter: "brightness(0) invert(1)" }} />
              </mask>
              <symbol id={id} viewBox={`0 0 ${DRUM_NOMINAL} ${DRUM_NOMINAL}`}>
                <rect x={0} y={0} width={DRUM_NOMINAL} height={DRUM_NOMINAL} mask={`url(#${id}-mask)`} />
              </symbol>
            </React.Fragment>
          ))}
        </defs>
      )}
      {glyphs}
    </g>
  );
}
