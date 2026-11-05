// src/components/TapestryView/staff/StaffVocals.jsx
// The Line Staff's words, ported from new-prototypes/line-staff: each word is a
// smooth curve through the pitch of its vowels (a dot per voiced vowel at the
// vowel's middle), the text riding the curve; past its last vowel the curve
// keeps its slope. Modes: words (whole text on the curve), spelled (the
// spelling cut into one chunk per syllable, each at its vowel), syllables (each
// syllable as its phone cluster: a line for its length, the dot at the vowel).
// Text goes above or below its curve by least overlap with words already placed.
// Color = the query's color when the word is queried or matched, gray otherwise.
// This view does not follow the tapestry's glyph sizes: it scales to be read.
import React, { useMemo } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useQueries } from "../../../contexts/QueryContext";
import { useAudioControls } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";
import { useParams } from "../../../contexts/ParamsContext";
import { laneY } from "../../../utils/laneLayout";
import { f0Semitones } from "../../../utils/timingModel";
import { timeAtEvent } from "../global/timeAtEvent";

const PITCH_BAND = { lo: 63, hi: 97 };   // percent of the staff the pitch range spans: the upper third, leaving room below for the drums
const FONT = '-apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';

let measureCtx = null;
function textWidth(text, fs) {
  if (!measureCtx && typeof document !== "undefined") measureCtx = document.createElement("canvas").getContext("2d");
  if (!measureCtx) return text.length * fs * 0.55;
  measureCtx.font = `${fs}px ${FONT}`;
  return measureCtx.measureText(text).width;
}

// Smooth curve through points (Catmull-Rom as cubic Beziers); x must increase.
function catmull(P) {
  if (P.length < 2) return "";
  let d = `M${P[0][0].toFixed(1)},${P[0][1].toFixed(1)}`;
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    const lo = Math.min(p1[0], p2[0]), hi = Math.max(p1[0], p2[0]);
    const c1 = [Math.max(lo, Math.min(hi, p1[0] + (p2[0] - p0[0]) / 6)), p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [Math.max(lo, Math.min(hi, p2[0] - (p3[0] - p1[0]) / 6)), p2[1] - (p3[1] - p1[1]) / 6];
    if (c2[0] < c1[0]) c2[0] = c1[0];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export default function StaffVocals({ mode = "words", onGlyphHoverEnter, onGlyphHoverLeave }) {
  const { layout, laneFor } = useTapestryLayout();
  const { visualByWordId, click } = useQueries();
  const { seekAll } = useAudioControls();
  const { lyricTranscription, timing } = useSongData();
  const { staffTextPx, staffWordColor } = useParams();
  const ink = staffWordColor || "#6b6e76";   // unqueried words: text, line and dots

  const lane = laneFor("vocals");
  const rowHeight = layout?.rowHeight ?? 0;
  const fs = staffTextPx || 12;
  const f0Mid = timing?.f0Mid ?? null;

  // pitch -> y: -6 semitones at the band's bottom, +18 at its top; no pitch -> the base line
  const yTop = laneY(0, rowHeight, lane, PITCH_BAND.hi), yBot = laneY(0, rowHeight, lane, PITCH_BAND.lo);
  const yBase = yBot + 4;
  const yF0 = (f0) => {
    const st = f0Semitones(f0, f0Mid);
    if (st == null) return yBase;
    return yBot - ((st + 6) / 24) * (yBot - yTop);
  };
  const clampY = (v) => Math.max(yTop - 6, Math.min(yBot + 2, v));

  const items = useMemo(() => {
    if (!layout || !layout.singleRow || !timing) return [];
    const x = (t) => layout.timeToPixels(t).x;
    const placed = [];
    const overlap = (b) => placed.reduce((a, q) => a + Math.max(0, Math.min(b[2], q[2]) - Math.max(b[0], q[0])) * Math.max(0, Math.min(b[3], q[3]) - Math.max(b[1], q[1])), 0);
    const out = [];
    (lyricTranscription?.lines ?? []).forEach((line, li) => {
      (line.words ?? []).forEach((word, wi) => {
        const id = `${li}-${wi}`;
        const tw = timing.words.get(id);
        if (!tw) return;
        const text = String(word.text ?? "").replace(/\n/g, "").trim();
        const X0 = x(tw.start), X1 = x(tw.end);
        const vis = visualByWordId.get(id) ?? null;
        const col = vis ? vis.color : ink;
        const hit = !!vis;
        const syls = tw.syls;
        const item = { id, text, word, tw, X0, X1, col, hit, vis, syls, mode };

        if (mode === "syllables") { out.push(item); return; }
        const pts = syls.filter((sy) => sy.f0).map((sy) => [x(((sy.vStart ?? sy.start) + (sy.vEnd ?? sy.end)) / 2), yF0(sy.f0) + 4, !!sy.pass2]);
        const textW = textWidth(text, fs) + 6;
        const xEnd = Math.max(X1, X0 + 6), xText = Math.max(xEnd, X0 + textW) + fs * 1.5;
        let d, dText;
        if (pts.length) {
          const inner = pts.filter((p) => p[0] > X0 && p[0] < xEnd);
          const last = pts[pts.length - 1], prev = pts.length > 1 ? pts[pts.length - 2] : null;
          const slope = prev && last[0] > prev[0] ? (last[1] - prev[1]) / (last[0] - prev[0]) : 0;
          const dyMax = prev ? Math.abs(last[1] - prev[1]) : 0;
          const yAt = (xx) => clampY(last[1] + Math.sign(slope) * Math.min(Math.abs(slope * (xx - last[0])), dyMax));
          const P = [[X0, pts[0][1]], ...inner, [xEnd, xEnd > last[0] ? yAt(xEnd) : last[1]]];
          d = catmull(P);
          dText = xText > xEnd ? `${d} L${xText.toFixed(1)},${yAt(xText).toFixed(1)}` : d;
        } else {
          d = `M${X0.toFixed(1)},${yBase.toFixed(1)} L${xEnd.toFixed(1)},${yBase.toFixed(1)}`;
          dText = `M${X0.toFixed(1)},${yBase.toFixed(1)} L${xText.toFixed(1)},${yBase.toFixed(1)}`;
        }
        const yStart = pts.length ? pts[0][1] : yBase;
        const boxA = [X0 - 2, yStart - fs - 6, X0 + textW, yStart - 1], boxB = [X0 - 2, yStart + 2, X0 + textW, yStart + fs + 6];
        const below = overlap(boxB) < overlap(boxA);
        placed.push(below ? boxB : boxA);
        out.push({ ...item, pts, d, dText, dy: below ? fs + 3 : -5, xText, xEnd });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, timing, lyricTranscription, visualByWordId, mode, fs, f0Mid, rowHeight, lane, ink]);

  if (!layout || !layout.singleRow) return null;

  const x = (t) => layout.timeToPixels(t).x;
  const onClick = (id) => (e) => {
    e.stopPropagation();
    if (e.metaKey || e.ctrlKey || e.altKey) click(id, { shift: e.shiftKey, meta: false, alt: e.altKey });
    else { const t = timeAtEvent(e, layout); if (t != null) seekAll(t); }
  };
  const hover = (it) => (e) => onGlyphHoverEnter?.(e, {
    type: "word", wordText: it.text, phones: it.tw.phones ?? (Array.isArray(it.word.phones) ? it.word.phones[0] : String(it.word.phones ?? "")),
    match: it.vis ? (it.vis.isAnchor ? "query" : `${it.vis.type}${it.vis.form !== "word" ? " " + it.vis.form : ""}`) : null,
    f0: it.tw.f0, syllables: it.syls.map((sy) => (sy.cluster ? sy.cluster.join(" ") : sy.vowel)).join("  |  "),
  });

  return (
    <g fontFamily={FONT} style={{ userSelect: "none" }}>
      {items.map((it) => {
        const { id, text, col, hit, vis, syls } = it;
        const form = vis?.form;
        const dashes = form === "mosaic" ? "7 4" : form === "embedded" ? "1.5 4" : null;
        const common = { style: { cursor: "pointer" }, onClick: onClick(id), onMouseEnter: hover(it), onMouseLeave: onGlyphHoverLeave, pointerEvents: "visiblePainted" };

        if (it.mode === "syllables") {
          return (
            <g key={id} {...common}>
              <text x={it.X0} y={yTop - 4} fill={col} fillOpacity={hit ? 1 : 0.7} fontSize={fs - 2}>{text}</text>
              <line x1={it.X0} y1={yTop - 1} x2={it.X1} y2={yTop - 1} stroke={col} strokeOpacity={0.25} strokeWidth={1} />
              {syls.map((sy) => {
                const sx0 = x(sy.start), sx1 = x(sy.end), vx = x(sy.vStart ?? sy.start), y = yF0(sy.f0);
                const bold = sy.stress === 1;
                const label = sy.cluster ? sy.cluster : [sy.vowel || `${sy.k + 1}`];
                return (
                  <g key={sy.k}>
                    <line x1={sx0} y1={y + 4} x2={sx1} y2={y + 4} stroke={col} strokeWidth={bold ? 2.4 : 1.6} strokeOpacity={sy.f0 ? 0.9 : 0.45} strokeLinecap="butt" strokeDasharray={sy.estimated ? "3 3" : undefined} />
                    <circle cx={vx} cy={y + 4} r={bold ? 3.4 : 2.6} fill={sy.f0 ? col : "none"} stroke={col} strokeWidth={1.2} />
                    <text x={sx0} y={y - 3} fontSize={fs - 1} fontWeight={bold ? 700 : 400}>
                      {label.map((ph, i) => <tspan key={i} fill={col} fillOpacity={i === (sy.vIdx ?? 0) ? (sy.f0 ? 1 : 0.55) : 0.6}>{ph}{i < label.length - 1 ? " " : ""}</tspan>)}
                    </text>
                    <rect x={sx0 - 4} y={y - fs - 4} width={Math.max(sx1 - sx0 + 8, 22)} height={fs + 14} fill="transparent" />
                  </g>
                );
              })}
            </g>
          );
        }

        const pid = `sp-${id}`;
        const spelled = it.mode === "spelled" && syls.length > 1 && syls.every((sy) => sy.chunk);
        let chunks = null;
        if (spelled) {
          chunks = syls.map((sy) => ({ sy, cx: Math.min(it.xText - 1, Math.max(it.X0 + 1, x(((sy.vStart ?? sy.start) + (sy.vEnd ?? sy.end)) / 2))), w: textWidth(sy.chunk, fs) }));
          for (let pass = 0; pass < 4; pass++) for (let k = 1; k < chunks.length; k++) {
            const a = chunks[k - 1], b = chunks[k], need = (a.w + b.w) / 2 + 3 - (b.cx - a.cx);
            if (need > 0) { a.cx -= need / 2; b.cx += need / 2; }
          }
        }
        return (
          <g key={id} {...common}>
            <path d={it.d} fill="none" stroke={col} strokeWidth={hit ? 2.4 : 1.8} strokeOpacity={it.tw.f0 ? (hit ? 1 : 0.75) : 0.45} strokeLinecap="butt" strokeDasharray={dashes ?? (it.pts.length ? undefined : "1 4")} />
            {it.pts.map(([px, py, p2], i) => <circle key={i} cx={px} cy={py} r={2.6} fill={p2 ? "#fff" : col} stroke={col} strokeWidth={p2 ? 1.4 : 0} />)}
            {!it.pts.length && <circle cx={it.X0} cy={yBase} r={3} fill="none" stroke={col} strokeWidth={1.2} />}
            <path id={pid} d={it.dText} fill="none" />
            {!spelled ? (
              <text fontSize={fs} dy={it.dy} fill={col} fillOpacity={it.tw.f0 ? 1 : 0.55} fontWeight={hit ? 600 : 400}>
                <textPath href={`#${pid}`}>{text}</textPath>
              </text>
            ) : chunks.map((c, k) => {
              // each chunk is centered on its vowel at the curve's height there (the prototype also bends it along the curve)
              const py = (c.sy.f0 ? yF0(c.sy.f0) + 4 : yBase) + it.dy;
              return <text key={k} x={c.cx} y={py} textAnchor="middle" fontSize={fs} fill={col} fillOpacity={c.sy.f0 ? 1 : 0.55} fontWeight={c.sy.stress === 1 || hit ? 600 : 400}>{c.sy.chunk}</text>;
            })}
            <path d={it.dText} stroke="transparent" strokeWidth={fs + 14} fill="none" />
          </g>
        );
      })}
    </g>
  );
}
