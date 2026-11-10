// src/components/ClockPane/ClockPane.jsx
// The Rhyme Clock: the song on concentric rings, one ring per cycle of 1, 2
// or 4 bars (angle = position in the cycle; outer rings earlier, inner rings
// later), one cycle of drum glyphs on the rim, and a playhead hand from the
// center through the rim. It sits in the bottom-right corner of the stage, beside the
// Line Staff (CenterStage), or, at full size, over the whole stage.
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useUIState } from "../../contexts/UIStateContext";
import { useSongData } from "../../contexts/SongDataContext";
import { IconClock } from "../Shell/AppHeader";
import { RINGS_PICK, cyclesLabel, ringCount, clockGeo, ringPitch, showText, wordsByTime } from "./clockGeometry";
import { wordMarks, drumMarks, lineMarks, lineSpans } from "./clockMarks";
import ClockLines from "./ClockLines";
import ClockDrums from "./ClockDrums";
import { useDrumHits, useByClass } from "../../hooks/useDrumHits";
import ClockWords from "./ClockWords";
import { useQueries } from "../../contexts/QueryContext";
import { makeCycles } from "./clockCycles";
import ClockFace from "./ClockFace";
import FitPicker from "../ui/FitPicker";
import { useClockWindow } from "./useClockWindow";
import { useClockPointer } from "./useClockPointer";
import { useQueryActions } from "../../contexts/QueryContext";
import { useAudioControls } from "../../contexts/AudioContext";
import { useCanvasHoverInfo } from "../TapestryView/hooks/useCanvasHoverInfo";
import { CanvasHoverTooltip } from "../TapestryView/global/CanvasHoverToolTip";
import { matchLabel } from "../../utils/matchLabel";
import "./ClockPane.css";

/** The clock's side: the largest square that fits the pane's body. */
function useBodySide(ref) {
  const [side, setSide] = useState(0);
  useLayoutEffect(() => {
    const body = ref.current;
    if (!body) return;
    const measure = () => setSide(Math.max(0, Math.floor(Math.min(body.clientWidth, body.clientHeight))));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [ref]);
  return side;
}

const IconExpand = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 2.5h3.5V6M6 13.5H2.5V10M13.5 2.5 9 7M2.5 13.5 7 9" />
  </svg>
);
const IconShrink = () => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 7H9V3M3 9h4v4M9 7l4.5-4.5M7 9l-4.5 4.5" />
  </svg>
);

export default function ClockPane({ duration }) {
  const bodyRef = useRef(null);
  const side = useBodySide(bodyRef);
  const [full, setFull] = useState(false);
  const { clockRings, setClockRings, clockBackgroundColor, clockCycleBars, clockWords, clockWordColor, clockTextPx, clockShowDrums, drumClasses, drumBands } = useParams();
  const hits = useDrumHits();
  const byClass = useByClass();
  const { songModel, timing, lyricTranscription } = useSongData();
  const { visualByWordId, visualByLineIdx, matchesByQueryId } = useQueries();
  // line queries: the lines take their query's color; their rhyming end words come up like query words (word queries win)
  const lineQ = useMemo(() => lineMarks({ visualByLineIdx, matchesByQueryId, songModel }), [visualByLineIdx, matchesByQueryId, songModel]);
  const visuals = useMemo(() => (lineQ.words.size ? new Map([...lineQ.words, ...visualByWordId]) : visualByWordId), [lineQ, visualByWordId]);
  // bar starts = every beatsPerBar-th beat of the song model's grid (the tapestry's bars and bar numbers)
  const barStarts = useMemo(() => {
    const grid = songModel?.grid ?? [];
    const bpb = songModel?.beatsPerBar || 4;
    return grid.filter((_, j) => j % bpb === 0);
  }, [songModel]);
  const cycles = useMemo(
    () => makeCycles(barStarts, clockCycleBars, duration || songModel?.duration || 0),
    [barStarts, clockCycleBars, duration, songModel]
  );
  const rings = ringCount(clockRings, cycles.count);
  const beatsPerBar = songModel?.beatsPerBar || 4;
  const wholeSong = clockRings === "all";
  const svgRef = useRef(null);
  const geo = useMemo(() => clockGeo(side, rings), [side, rings]);
  const glowWords = useMemo(() => wordsByTime(timing?.words), [timing]);   // the word glow (Greg 2026-11-09)
  const win = useClockWindow({ cycles, rings, wholeSong, svgRef, geo, words: glowWords });
  const { Wi, P, follow } = win;
  // the cycles drawn: those the spiral's visible stretch can reach as W moves within this whole cycle
  const from = wholeSong ? 0 : Wi, to = wholeSong ? rings : Wi + rings + 1;
  const texts = useMemo(() => {
    const m = new Map();
    (lyricTranscription?.lines ?? []).forEach((line, li) => (line.words ?? []).forEach((w, wi) => m.set(`${li}-${wi}`, String(w.text ?? "").replace(/\n/g, "").trim())));
    return m;
  }, [lyricTranscription]);
  const marks = useMemo(
    () => wordMarks({ timingWords: timing?.words, visuals, cycles, from, to, words: clockWords, inkColor: clockWordColor, texts }),
    [timing, visuals, cycles, from, to, clockWords, clockWordColor, texts]
  );
  const spans = useMemo(
    () => lineSpans({ lines: lineQ.lines, timingWords: timing?.words, songModel, cycles, from, to }),
    [lineQ, timing, songModel, cycles, from, to]
  );
  const drums = useMemo(
    () => (clockShowDrums && P >= 0 ? drumMarks({ hits, cycles, cycle: P, groups: byClass ? drumClasses : drumBands, byClass }) : []),
    [clockShowDrums, hits, cycles, P, byClass, drumClasses, drumBands]
  );
  useClockPointer({ svgRef, geo, cycles, win, wholeSong, active: side > 0 });

  // words: the shared click rules; a plain click seeks to the word without moving the rings
  const { click } = useQueryActions();
  const { seekAll } = useAudioControls();
  const winRef = useRef(win);
  winRef.current = win;
  const onWord = useCallback((e, m) => {
    e.stopPropagation();
    if (e.altKey) click(m.id, { alt: true });
    else if (e.metaKey || e.ctrlKey) click(m.id, { shift: e.shiftKey, meta: true });
    else { winRef.current.freeze(); seekAll(m.start); click(m.id, { reveal: true }); }
  }, [click, seekAll]);
  const { hoverInfo, onHoverEnter, onHoverLeave } = useCanvasHoverInfo();
  const onHover = useCallback((e, m) => {
    const tw = timing?.words.get(m.id);
    onHoverEnter(e, { type: "word", wordId: m.id, wordText: m.text, phones: tw?.phones ?? "", match: matchLabel(visuals.get(m.id) ?? null) });
  }, [timing, visuals, onHoverEnter]);
  const spacing = ringPitch(rings, geo.rOuter, geo.rInner);
  const { toggleClock, openParamsPanel } = useUIState();
  const labels = showText(spacing, clockTextPx);
  return (
    <>
    <section className={`clock-pane${full ? " is-full" : ""}`} aria-label="Rhyme Clock">
      <div className="clock-bar">
        <div className="clock-bar-main">
        <span className="clock-title"><IconClock /><span className="clock-title-text"> Rhyme Clock</span></span>
        <FitPicker className="clock-rings" options={RINGS_PICK} value={clockRings} onChange={setClockRings} ariaLabel="Rings shown" />
        <span className="clock-where">{cyclesLabel(cycles.count, Wi, rings)}</span>
        <button type="button" className={`clock-follow ${follow ? "is-on" : ""}`} onClick={() => win.setFollow(!follow)}
          title={follow
            ? "Following the playhead: the rings shift with it and words appear as they are played. Click to freeze the rings where they are."
            : "Frozen: the rings stay put and show everything in them. Click to follow the playhead again."}>
          {follow ? "Freeze" : "Follow"}
        </button>
        <button type="button" className="clock-link" onClick={() => openParamsPanel("global", "clock")} title="Open the Rhyme Clock's settings in the Global panel">settings &rsaquo;</button>
        </div>
        <div className="clock-bar-end">
        <button type="button" className="clock-size" onClick={() => setFull(!full)} aria-pressed={full}
          title={full ? "Make the Rhyme Clock smaller (back to its corner)" : "Make the Rhyme Clock full size (over the tapestry and the Line Staff)"}>
          {full ? <IconShrink /> : <IconExpand />}
        </button>
        <button type="button" className="clock-close" onClick={toggleClock} title="Close the Rhyme Clock">&times;</button>
        </div>
      </div>
      <div ref={bodyRef} className="clock-body" style={{ background: clockBackgroundColor }}>
      {side > 0 && (
        <svg ref={svgRef} className="clock-svg" width={side} height={side} viewBox={`0 0 ${side} ${side}`}>
          <rect width={side} height={side} fill={clockBackgroundColor} />
          {cycles.count === 0 ? (
            <text className="clock-note" x={side / 2} y={side / 2} textAnchor="middle" fill="#888">No bar grid for this song</text>
          ) : (
            <>
              <ClockFace geo={geo} cycleBars={clockCycleBars} beatsPerBar={beatsPerBar} background={clockBackgroundColor} />
              <ClockLines spans={spans} width={Math.max(1.5, Math.min(4, spacing * 0.7))} />
              {clockShowDrums && <ClockDrums marks={drums} geo={geo} byClass={byClass} background={clockBackgroundColor} fallbackInk={clockWordColor} />}
              <ClockWords marks={marks} textPx={clockTextPx} showLabels={labels} hitWidth={Math.max(6, Math.min(14, spacing * 0.8))} onWord={onWord} onHover={onHover} onLeave={onHoverLeave} />
              <line data-hand="" data-cx={geo.cx} data-cy={geo.cy} x1={geo.cx} y1={geo.cy} x2={geo.cx} y2={geo.cy - geo.rOuter - geo.drumBand} stroke="#e03131" strokeWidth={1.5} visibility="hidden" pointerEvents="none" />
            </>
          )}
        </svg>
      )}
      </div>
    </section>
    {/* outside the pane: its transform would anchor the tooltip's fixed position */}
    <CanvasHoverTooltip hoverInfo={hoverInfo} />
    </>
  );
}
