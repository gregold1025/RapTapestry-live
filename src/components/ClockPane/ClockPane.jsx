// src/components/ClockPane/ClockPane.jsx
// The Rhyme Clock: the song on concentric rings, one ring per cycle of 1, 2
// or 4 bars (angle = position in the cycle; outer rings earlier, inner rings
// later), one cycle of drum glyphs on the rim, and a sweeping playhead. For
// now it floats over the center stage, opened by the clock icon in the header.
import React, { useLayoutEffect, useRef, useState } from "react";
import { Segmented } from "../ui";
import { useParams } from "../../contexts/ParamsContext";
import { useUIState } from "../../contexts/UIStateContext";
import { IconClock } from "../Shell/AppHeader";
import { RINGS_SEG } from "./clockGeometry";
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

export default function ClockPane() {
  const { clockRings, setClockRings, clockBackgroundColor } = useParams();
  const { toggleClock, openParamsPanel } = useUIState();
  const paneRef = useRef(null);
  const side = useStageSize(paneRef);
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
        </svg>
      )}
    </section>
  );
}
