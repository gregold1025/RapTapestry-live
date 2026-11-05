import React, { useId } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";
import { laneY } from "../../../utils/laneLayout";
import { useDrumHits, useByClass } from "../../../hooks/useDrumHits";
import { defaultGlyphFor } from "../../../utils/drumGlyphDefaults";

// Each hit is one <use> of a <symbol> (a 3x "safe area" box with the glyph in
// the centre third). One mask + symbol pair per distinct glyph url in use, so
// every band / class has its own glyph (from the syllable glyph set; a row with
// no glyph draws a circle). Ids are per tapestry instance (the Line Staff draws
// the drums too).
const DRUM_NOMINAL = 300; // symbol viewBox size (glyph occupies 100..200)

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export default function DrumsGlyphs() {
  const { layout, laneFor } = useTapestryLayout();
  const { showDrums, showDrumGlyphs, drumParams, drumBands, drumClasses, glyphAssets, staffDrumScale } = useParams();
  const hits = useDrumHits();
  const byClass = useByClass();   // a song without classifier output falls back to bands
  const instanceId = useId().replace(/:/g, "");

  // Hooks above; early return below (rules-of-hooks).
  if (!layout || !showDrums || !showDrumGlyphs) return null;

  const { rowHeight, timeToPixels } = layout;
  const lane = laneFor("drums");
  const { fillColor = "#bbbbbb", tilt = 10 } = drumParams || {};
  const tiltDeg = clamp(tilt, -90, 90);
  const byName = glyphAssets.syllableGlyphByName;   // drums draw from the same set as the syllables
  const groups = byClass ? drumClasses : drumBands;
  const scale = layout.singleRow ? staffDrumScale : 1;   // the staff scales to be read

  // one symbol per distinct glyph url
  const urls = new Map();
  const symbolFor = (url) => {
    if (!url) return null;
    if (!urls.has(url)) urls.set(url, `${instanceId}-dg${urls.size}`);
    return urls.get(url);
  };

  const glyphs = [];
  for (let idx = 0; idx < hits.length; idx++) {
    const hit = hits[idx];
    const key = byClass ? hit.cls : hit.category;
    const g = groups?.[key] ?? (byClass ? groups?.other : groups?.low);
    if (!g || g.visible === false) continue;
    const size = (g.size ?? 12) * scale;
    const maskBox = size * 3; // generous safe area around the rotated glyph
    const { x, y } = timeToPixels(hit.time);
    const cy = laneY(y, rowHeight, lane, g.height ?? 50);
    const sym = symbolFor(g.glyphUrl ?? defaultGlyphFor(key, byName));
    const opacity = (g.opacity ?? 1) * (byClass && hit.conf != null ? 0.5 + 0.5 * Math.min(1, hit.conf) : 1);
    glyphs.push(
      sym ? (
        <use
          key={`drumglyph-${idx}`}
          href={`#${sym}`}
          transform={`translate(${x}, ${cy}) rotate(${tiltDeg})`}
          x={-maskBox / 2}
          y={-maskBox / 2}
          width={maskBox}
          height={maskBox}
          fill={fillColor}
          opacity={opacity}
          pointerEvents="none"
        />
      ) : (
        <circle key={`drumglyph-${idx}`} cx={x} cy={cy} r={size / 2} fill={fillColor} opacity={opacity} pointerEvents="none" />
      )
    );
  }

  return (
    <>
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
    </>
  );
}
