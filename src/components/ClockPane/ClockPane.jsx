// src/components/ClockPane/ClockPane.jsx
// The Rhyme Clock: the song on concentric rings, one ring per cycle of 1, 2
// or 4 bars (angle = position in the cycle; outer rings earlier, inner rings
// later), one cycle of drum glyphs on the rim, and a sweeping playhead. For
// now it floats over the center stage, opened by the clock icon in the header.
import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Segmented } from "../ui";
import { useParams } from "../../contexts/ParamsContext";
import { useUIState } from "../../contexts/UIStateContext";
import { useSongData } from "../../contexts/SongDataContext";
import { IconClock } from "../Shell/AppHeader";
import { RINGS_SEG, ringCount, clockGeo, ringSpacing, showText } from "./clockGeometry";
import { wordMarks } from "./clockMarks";
import ClockWords from "./ClockWords";
import { useQueries } from "../../contexts/QueryContext";
import { makeCycles } from "./clockCycles";
import ClockFace from "./ClockFace";
import "./ClockPane.css";

const BAR_H = 30;     // the header bar's height (px)
const MARGIN = 32;    // space kept around the overlay (px)

/** The overlay's side: the smaller of the stage's width and height, less a margin. */
function useStageSize(ref) {
  const [side, setSide] = useState(0);
  useLayoutEffect(() => {
    const stage = ref.current?.parentElement;
    if (!stage) return;
    const measure = () => setSide(Math.max(160, Math.min(stage.clientWidth, stage.clientHeight - BAR_H) - MARGIN));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [ref]);
  return side;
}

export default function ClockPane({ duration }) {
  const paneRef = useRef(null);
  const side = useStageSize(paneRef);
  const { clockRings, setClockRings, clockBackgroundColor, clockCycleBars, clockIndex, clockWords, clockWordColor, clockTextPx } = useParams();
  const { drumTranscription, songModel, timing, lyricTranscription } = useSongData();
  const { visualByWordId } = useQueries();
  const cycles = useMemo(
    () => makeCycles(drumTranscription?.downbeats ?? [], clockCycleBars, duration || songModel?.duration || 0),
    [drumTranscription, clockCycleBars, duration, songModel]
  );
  const rings = ringCount(clockRings, cycles.count);
  const beatsPerBar = songModel?.beatsPerBar || 4;
  const W = 0;   // the window (Task 7 moves it)
  const texts = useMemo(() => {
    const m = new Map();
    (lyricTranscription?.lines ?? []).forEach((line, li) => (line.words ?? []).forEach((w, wi) => m.set(`${li}-${wi}`, String(w.text ?? "").replace(/\n/g, "").trim())));
    return m;
  }, [lyricTranscription]);
  const marks = useMemo(
    () => wordMarks({ timingWords: timing?.words, visuals: visualByWordId, cycles, W, rings, words: clockWords, inkColor: clockWordColor, texts }),
    [timing, visualByWordId, cycles, W, rings, clockWords, clockWordColor, texts]
  );
  const geo = useMemo(() => clockGeo(side, rings), [side, rings]);
  const spacing = ringSpacing(rings, geo.rOuter, geo.rInner);
  const { toggleClock, openParamsPanel } = useUIState();
  return (
    <section ref={paneRef} className="clock-pane" aria-label="Rhyme Clock" style={{ width: side || undefined }}>
      <div className="clock-bar">
        <span className="clock-title"><IconClock /> Rhyme Clock</span>
        <Segmented size="sm" value={clockRings} onChange={setClockRings} options={RINGS_SEG} ariaLabel="Rings shown" />
        <span className="clock-where" />
        <button type="button" className="clock-link" onClick={() => openParamsPanel("global")} title="The clock's settings live in the Global panel">settings &rsaquo;</button>
        <button type="button" className="clock-close" onClick={toggleClock} title="Close the Rhyme Clock">&times;</button>
      </div>
      {side > 0 && (
        <svg className="clock-svg" width={side} height={side} viewBox={`0 0 ${side} ${side}`}>
          <rect width={side} height={side} fill={clockBackgroundColor} />
          {cycles.count === 0 ? (
            <text className="clock-note" x={side / 2} y={side / 2} textAnchor="middle" fill="#888">No bar grid for this song</text>
          ) : (
            <>
              <ClockFace geo={geo} cycleBars={clockCycleBars} beatsPerBar={beatsPerBar} background={clockBackgroundColor} currentRing={Math.min(clockIndex, rings - 1)} />
              <ClockWords marks={marks} geo={geo} textPx={clockTextPx} showLabels={showText(spacing, clockTextPx)} hitWidth={Math.max(6, Math.min(14, spacing * 0.8))} />
            </>
          )}
        </svg>
      )}
    </section>
  );
}
