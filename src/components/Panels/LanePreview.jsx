// src/components/Panels/LanePreview.jsx
// The stem's lane as the tapestry draws it: two bars of the song rendered by
// the stem's own glyph layer (same thickness, sizes, opacity, toppers,
// heights) at the tapestry's own proportions (its pixels per bar and row
// height), then scaled to the panel's width. Static: the stem's busiest
// two-bar passage, not the playhead.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { TapestryLayoutProvider, useTapestryLayout } from "../../contexts/TapestryLayoutContext";
import { useSongData } from "../../contexts/SongDataContext";
import TapestryLayer from "../TapestryView/TapestryLayer";
import DrumGrid from "../TapestryView/drums/DrumGrid";
import DrumsGlyphs from "../TapestryView/drums/DrumsGlyphs";
import BassGlyphs from "../TapestryView/bass/BassGlyphs";
import VocalsGlyphs from "../TapestryView/vocals/VocalsGlyphs";
import "../TapestryView/TapestryView.css";
import "./Panels.css";

const BARS = 2;

/** The start of the busiest two-bar passage for the stem (most events), so the preview shows it playing. */
function useStartBar(stem) {
  const { songModel, bassNotes, drumTranscription, timing } = useSongData();
  return useMemo(() => {
    if (!songModel) return 0;
    let times = [];
    if (stem === "bass") times = (bassNotes ?? []).map((n) => n.start);
    if (stem === "drums") times = (drumTranscription?.drum_hits ?? []).map((h) => h.time);
    if (stem === "vocals" && timing) for (const w of timing.words.values()) for (const sy of w.syls) times.push(sy.start);
    const count = new Map();
    for (const t of times) {
      const b = Math.max(0, songModel.barPosition(t).bar);
      const k = b - (b % BARS);
      count.set(k, (count.get(k) ?? 0) + 1);
    }
    let best = 0, bestN = -1;
    for (const [k, n] of [...count].sort((a, b) => a[0] - b[0])) if (n > bestN) { best = k; bestN = n; }
    return best;
  }, [stem, songModel, bassNotes, drumTranscription, timing]);
}

function Stage({ stem, rowIdx, scale, w, h }) {
  const { containerRef, layout } = useTapestryLayout();
  const { lyricTranscription, drumTranscription } = useSongData();
  return (
    <div style={{ width: w * scale, height: h * scale, overflow: "hidden", position: "relative" }}>
      <div ref={containerRef} className="pn-lane-stage" style={{ width: w, height: h, transform: `scale(${scale})`, transformOrigin: "0 0", overflow: "hidden", position: "relative" }}>
        {layout && (
          <div className="tapestry-content" style={{ height: layout.contentHeight, transform: `translateY(${-rowIdx * layout.rowHeight}px)` }}>
            <TapestryLayer name={`preview-grid`}>
              <DrumGrid drumTranscriptionData={drumTranscription} />
            </TapestryLayer>
            {stem === "bass" && <TapestryLayer name="preview-bass"><BassGlyphs /></TapestryLayer>}
            {stem === "drums" && <TapestryLayer name="preview-drums"><DrumsGlyphs /></TapestryLayer>}
            {stem === "vocals" && <VocalsGlyphs lyricTranscriptionData={lyricTranscription} />}
          </div>
        )}
      </div>
    </div>
  );
}

export function LanePreview({ stem }) {
  const { layout: main } = useTapestryLayout();
  const { drumTranscription } = useSongData();
  const startBar = useStartBar(stem);
  const boxRef = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  if (!main || !drumTranscription) return <div ref={boxRef} className="pn-lane" />;
  // the tapestry's own scale: px per bar and row height
  const w = (main.width / main.barsPerRow) * BARS;
  const h = main.rowHeight;
  const scale = width > 0 ? width / w : 0;
  return (
    <div ref={boxRef} className="pn-lane" title={`Two bars from bar ${startBar + 1}, as the tapestry draws this stem`}>
      <TapestryLayoutProvider
        timeLayout="wrap"
        barsPerRow={BARS}
        rowHeightMode="fixed"
        fixedRowHeightPx={h}
        duration={main.rowBoundaries[main.rowBoundaries.length - 1]}
        estimated_bpm={drumTranscription.estimated_bpm}
        downbeats={drumTranscription.downbeats}
        beats={drumTranscription.beats}
      >
        {/* mounted from the start so the nested layout can measure its stage */}
        <Stage stem={stem} rowIdx={Math.floor(startBar / BARS)} scale={scale || 1} w={w} h={h} />
      </TapestryLayoutProvider>
      <span className="pn-lane-label">bars {startBar + 1}–{startBar + BARS}{stem === "vocals" ? " · unqueried glyphs at their inactive opacity" : ""}</span>
    </div>
  );
}

export const VocalsLanePreview = () => <LanePreview stem="vocals" />;
export const DrumsLanePreview = () => <LanePreview stem="drums" />;
export const BassLanePreview = () => <LanePreview stem="bass" />;
