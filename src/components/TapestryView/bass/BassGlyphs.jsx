// src/components/TapestryView/bass/BassGlyphs.jsx
// Bass v2 (experiments/bass-01): each note a spline through its pitch contour,
// like the words; height = pitch within the song's range, mapped into the
// band (default: the bottom half of the bass lane). Straight-cut ends.
// Toppers: the divider glyph as a strip above (flipped) and below each note,
// a gap away, cut into thin slices that follow the line (later: the gap will
// open as the playhead passes).
// Songs without v2 data fall back to the v1 pitch-class events as flat lines.
import React, { useId, useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useParams } from "../../../contexts/ParamsContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { laneY } from "../../../utils/laneLayout";
import { bassRange, midiPct, noteSegments, topperSlices } from "../../../utils/bassModel";

const BASS_NOMINAL = 100;

function splineD(P) {
  if (P.length < 2) return "";
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

/** v1 events ({start_time, end_time, pitch_class}) as flat notes on a 0..11 scale. */
function v1AsNotes(v1) {
  return (Array.isArray(v1) ? v1 : []).map((n) => ({ start: n.start_time, end: n.end_time, midi: 36 + (n.pitch_class ?? 0), contour: null }));
}

export default function BassGlyphs() {
  const { layout, laneFor } = useTapestryLayout();
  const { showBass, bassParams, glyphStyle } = useParams();
  const { bassNotes, bassTranscription } = useSongData();
  const lane = laneFor("bass");
  const uid = useId().replace(/[:«»]/g, "");

  const notes = useMemo(() => (bassNotes?.length ? bassNotes : v1AsNotes(bassTranscription)), [bassNotes, bassTranscription]);
  const range = useMemo(() => bassRange(notes), [notes]);

  const band = bassParams.band ?? { lo: 0, hi: 50 };
  const thickness = bassParams.thickness ?? 6;
  const topper = bassParams.topper ?? "divider";
  const dividerUrl = topper === "none" ? null : glyphStyle?.bassDividerUrl ?? null;
  const gap = bassParams.rectHeight ?? 0;

  const rowHeight = layout?.rowHeight;
  const timeToPixels = layout?.timeToPixels;

  const shapes = useMemo(() => {
    if (!timeToPixels || !rowHeight) return [];
    const out = [];
    notes.forEach((note, idx) => {
      for (const seg of noteSegments(note, timeToPixels, (r) => layout.rowBoundaries[r + 1], layout.width)) {
        const rowTop = seg.row * rowHeight;
        const P = seg.points.map((p) => [p.x, laneY(rowTop, rowHeight, lane, midiPct(p.midi, band, range))]);
        const ys = P.map((p) => p[1]);
        out.push({ key: `${idx}-${seg.row}`, d: splineD(P), slices: topperSlices(P, 3), yMin: Math.min(...ys), yMax: Math.max(...ys) });
      }
    });
    return out;
  }, [notes, timeToPixels, rowHeight, lane, band.lo, band.hi, range, layout]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!layout || !showBass || !notes.length) return null;

  const { fillColor, opacity, blur = 0 } = bassParams;
  const topperH = Math.max(3, thickness * 0.9);
  const symId = `${uid}-bdiv`;

  return (
    <>
      <defs>
        {blur > 0 && (
          <filter id={`${uid}-blur`} x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation={blur} />
          </filter>
        )}
        {dividerUrl && (
          <>
            <mask id={`${symId}-mask`} maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x={0} y={0} width={BASS_NOMINAL} height={BASS_NOMINAL}>
              <image href={dividerUrl} x={0} y={0} width={BASS_NOMINAL} height={BASS_NOMINAL} preserveAspectRatio="none" style={{ filter: "brightness(0) invert(1)" }} />
            </mask>
            <symbol id={symId} viewBox={`0 0 ${BASS_NOMINAL} ${BASS_NOMINAL}`} preserveAspectRatio="none">
              <rect x={0} y={0} width={BASS_NOMINAL} height={BASS_NOMINAL} mask={`url(#${symId}-mask)`} />
            </symbol>
          </>
        )}
      </defs>
      <g opacity={opacity} filter={blur > 0 ? `url(#${uid}-blur)` : undefined} pointerEvents="none">
        {shapes.map((s) => (
          <g key={s.key}>
            {dividerUrl && s.slices.map((sl, i) => {
              const vb = `${(sl.u0 * BASS_NOMINAL).toFixed(3)} 0 ${Math.max(0.001, sl.du * BASS_NOMINAL).toFixed(3)} ${BASS_NOMINAL}`;
              // at gap 0 the strips tuck 1.5 px under the line (drawn over them),
              // so no anti-aliased seam shows between topper and line
              const off = gap > 0 ? gap : -1.5;
              const yTop = sl.y - thickness / 2 - off - topperH;
              const yBot = sl.y + thickness / 2 + off;
              const w = sl.w + 0.4; // a hair of overlap so slices do not seam
              return (
                <React.Fragment key={i}>
                  {/* above: the glyph flipped so it faces the line */}
                  <svg x={sl.x} y={yTop} width={w} height={topperH} viewBox={vb} preserveAspectRatio="none" overflow="hidden">
                    <use href={`#${symId}`} x={0} y={0} width={BASS_NOMINAL} height={BASS_NOMINAL} fill={fillColor} transform={`translate(0 ${BASS_NOMINAL}) scale(1 -1)`} />
                  </svg>
                  {/* below: the glyph as drawn */}
                  <svg x={sl.x} y={yBot} width={w} height={topperH} viewBox={vb} preserveAspectRatio="none" overflow="hidden">
                    <use href={`#${symId}`} x={0} y={0} width={BASS_NOMINAL} height={BASS_NOMINAL} fill={fillColor} />
                  </svg>
                </React.Fragment>
              );
            })}
            <path d={s.d} fill="none" stroke={fillColor} strokeWidth={thickness} strokeLinecap="butt" />
          </g>
        ))}
      </g>
    </>
  );
}
