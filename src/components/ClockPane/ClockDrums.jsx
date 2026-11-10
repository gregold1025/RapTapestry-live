// src/components/ClockPane/ClockDrums.jsx
// One cycle of drum glyphs (the current ring's) just outside the rim, at a
// fixed size (DRUM_GLYPH_SCALE of each class's Drums-panel size) and full
// opacity, always (no faint preview). Each class or band keeps its glyph and
// visibility from the Drums panel; its height sets how far out it sits.
// The glyph masks follow DrumsGlyphs (one mask + symbol per glyph url). Each glyph has a halo
// in the word glow's color, lit by clockDraw while its hit is current (Greg 2026-11-09).
import React, { useId } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { defaultGlyphFor } from "../../utils/drumGlyphDefaults";
import { polar, drumInk, drumRadius, faceStrokes, DRUM_GLYPH_SCALE } from "./clockGeometry";

const DRUM_NOMINAL = 300; // symbol viewBox size (glyph occupies 100..200)

export default function ClockDrums({ marks, geo, byClass, background, fallbackInk }) {
  const { drumParams, drumBands, drumClasses, glyphAssets } = useParams();
  const instanceId = `clock-${useId().replace(/:/g, "")}`;
  const { cx, cy, rOuter } = geo;
  const groups = byClass ? drumClasses : drumBands;
  const { fillColor: panelFill = "#bbbbbb", tilt = 10 } = drumParams || {};
  const fillColor = drumInk(panelFill, background, fallbackInk);   // black drums on a black clock: the word color
  const byName = glyphAssets?.syllableGlyphByName;
  const glow = faceStrokes(background).glow;
  const blurId = `${instanceId}-blur`;

  const urls = new Map();
  const symbolFor = (url) => {
    if (!url) return null;
    if (!urls.has(url)) urls.set(url, `${instanceId}-dg${urls.size}`);
    return urls.get(url);
  };

  const glyphs = marks.map((m, i) => {
    const g = groups?.[m.rowKey] ?? {};
    const size = (g.size ?? 12) * DRUM_GLYPH_SCALE;
    const box = size * 3;
    const { x, y } = polar(cx, cy, drumRadius({ rOuter, size, height: m.height }), m.frac);
    const sym = symbolFor(g.glyphUrl === "none" ? null : g.glyphUrl ?? defaultGlyphFor(m.rowKey, byName));
    const halo = (
      <g data-dglow="" data-time={m.time} style={{ opacity: 0 }}>
        <circle cx={x} cy={y} r={size * 1.1} fill={glow} fillOpacity={0.7} filter={`url(#${blurId})`} />
        <circle cx={x} cy={y} r={size * 0.7} fill={glow} fillOpacity={0.45} />
      </g>
    );
    return (
      <React.Fragment key={i}>
        {halo}
        {sym ? (
          <use href={`#${sym}`} transform={`translate(${x}, ${y}) rotate(${tilt})`} x={-box / 2} y={-box / 2} width={box} height={box} fill={fillColor} />
        ) : (
          <circle cx={x} cy={y} r={size / 2} fill={fillColor} />
        )}
      </React.Fragment>
    );
  });

  return (
    <g pointerEvents="none" data-drums="">
      <defs>
        <filter id={blurId} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
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
