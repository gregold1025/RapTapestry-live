// src/components/Panels/LanePreview.jsx
// A live preview of one stem's lane at the top of its panel: two bars of the
// real song from the bar under the playhead, drawn with the current heights,
// sizes and glyphs, so a change to a slider shows where things land.
import React, { useMemo, useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import { usePlayheadSubscription } from "../../contexts/AudioContext";
import { useDrumHits, useByClass } from "../../hooks/useDrumHits";
import { f0Pct } from "../../utils/timingModel";
import { bassRange, midiPct } from "../../utils/bassModel";
import { defaultGlyphFor } from "../../utils/drumGlyphDefaults";
import "./Panels.css";

const W = 200, H = 64, BARS = 2;

function useWindow() {
  const { songModel } = useSongData();
  const [bar, setBar] = useState(0);
  usePlayheadSubscription((t) => {
    if (!songModel) return;
    const b = Math.max(0, songModel.barPosition(t).bar);
    setBar((prev) => (prev === b ? prev : b));
  });
  if (!songModel) return null;
  const { grid, beatsPerBar } = songModel;
  const at = (b) => grid[Math.min(grid.length - 1, b * beatsPerBar)];
  const lastBar = Math.max(0, Math.floor((grid.length - 1) / beatsPerBar) - BARS);
  const b0 = Math.min(bar, lastBar);
  const t0 = at(b0), t1 = at(b0 + BARS);
  return { t0, t1, x: (t) => ((t - t0) / Math.max(1e-6, t1 - t0)) * W, beats: grid.filter((g) => g >= t0 && g <= t1), downbeats: [0, 1, 2].map((k) => at(b0 + k)) };
}

const y = (pct) => H - (Math.max(0, Math.min(100, pct)) / 100) * H;

function Frame({ win, children, label }) {
  return (
    <div className="pn-lane">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="pn-lane-svg">
        {win?.beats.map((b, i) => <line key={i} x1={win.x(b)} x2={win.x(b)} y1={0} y2={H} stroke="#d6d6db" strokeWidth={0.6} vectorEffect="non-scaling-stroke" />)}
        {win?.downbeats.map((b, i) => <line key={`d${i}`} x1={win.x(b)} x2={win.x(b)} y1={0} y2={H} stroke="#9a9ca3" strokeWidth={1.2} vectorEffect="non-scaling-stroke" />)}
        {children}
      </svg>
      <span className="pn-lane-label">{label}</span>
    </div>
  );
}

export function VocalsLanePreview() {
  const p = useParams();
  const { timing, lyricTranscription } = useSongData();
  const win = useWindow();
  const items = useMemo(() => {
    if (!win || !timing) return [];
    const out = [];
    (lyricTranscription?.lines ?? []).forEach((line, li) => (line.words ?? []).forEach((_, wi) => {
      const w = timing.words.get(`${li}-${wi}`);
      if (w && w.end > win.t0 && w.start < win.t1) out.push(w);
    }));
    return out;
  }, [win?.t0, win?.t1, timing, lyricTranscription]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!win) return null;
  const sylPct = (s) => (p.syllableMode === "pitched" ? f0Pct(s.f0, timing?.f0Mid, p.syllableBand, (p.syllableBand.lo + p.syllableBand.hi) / 2) : p.syllableFixedHeight);
  const r = Math.max(1, (p.syllableRadius ?? 6) * 0.35);
  return (
    <Frame win={win} label="lane preview · 2 bars at the playhead">
      {p.showLines && <rect x={0} y={y(p.lineBand.hi)} width={W} height={Math.max(1, y(p.lineBand.lo) - y(p.lineBand.hi))} fill="#9e9ea2" opacity={0.18} />}
      {p.showWords && items.map((w, i) => {
        const pct = p.wordMode === "unpitched" ? p.wordCenter ?? 50 : f0Pct(w.f0, timing?.f0Mid, p.wordBand, (p.wordBand.lo + p.wordBand.hi) / 2);
        return <rect key={i} x={win.x(w.start)} y={y(pct) - 1.5} width={Math.max(1, win.x(w.end) - win.x(w.start))} height={3} fill="#9e9ea2" />;
      })}
      {p.showSyllables && items.flatMap((w, i) => w.syls.map((s, k) => <circle key={`${i}-${k}`} cx={win.x(s.start)} cy={y(sylPct(s))} r={r} fill="#1a1a1a" />))}
    </Frame>
  );
}

export function DrumsLanePreview() {
  const p = useParams();
  const hits = useDrumHits();
  const byClass = useByClass();
  const win = useWindow();
  if (!win) return null;
  const groups = byClass ? p.drumClasses : p.drumBands;
  const byName = p.glyphAssets.syllableGlyphByName;
  return (
    <Frame win={win} label="lane preview · 2 bars at the playhead">
      {hits.filter((h) => h.time >= win.t0 && h.time <= win.t1).map((h, i) => {
        const key = byClass ? h.cls : h.category;
        const g = groups[key];
        if (!g || g.visible === false) return null;
        const url = g.glyphUrl === "none" ? null : g.glyphUrl ?? defaultGlyphFor(key, byName);
        const s = Math.max(3, g.size * 0.45);
        const cx = win.x(h.time), cy = y(g.height ?? 50);
        return url
          ? <image key={i} href={url} x={cx - s / 2} y={cy - s / 2} width={s} height={s} preserveAspectRatio="none" opacity={g.opacity} style={{ filter: "brightness(0)" }} />
          : <circle key={i} cx={cx} cy={cy} r={s / 3} fill={p.drumParams.fillColor} opacity={g.opacity} />;
      })}
    </Frame>
  );
}

export function BassLanePreview() {
  const p = useParams();
  const { bassNotes } = useSongData();
  const win = useWindow();
  const range = useMemo(() => bassRange(bassNotes ?? []), [bassNotes]);
  if (!win) return null;
  const band = p.bassParams.band ?? { lo: 0, hi: 50 };
  return (
    <Frame win={win} label="lane preview · 2 bars at the playhead">
      <rect x={0} y={y(band.hi)} width={W} height={Math.max(1, y(band.lo) - y(band.hi))} fill={p.bassParams.fillColor} opacity={0.06} />
      {(bassNotes ?? []).filter((n) => n.end > win.t0 && n.start < win.t1).map((n, i) => {
        const pts = (n.contour?.length ? n.contour : [[n.start, n.midi], [n.end, n.midi]]).map(([t, m]) => `${win.x(t).toFixed(1)},${y(midiPct(m, band, range)).toFixed(1)}`);
        if (pts.length === 1) pts.push(`${win.x(n.end).toFixed(1)},${y(midiPct(n.midi, band, range)).toFixed(1)}`);
        return <polyline key={i} points={pts.join(" ")} fill="none" stroke={p.bassParams.fillColor} strokeWidth={Math.max(1, (p.bassParams.thickness ?? 6) * 0.4)} strokeLinecap={p.bassParams.caps ?? "butt"} opacity={p.bassParams.opacity} />;
      })}
    </Frame>
  );
}
