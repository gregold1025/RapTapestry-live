// src/components/CenterStage.jsx
// The center: the wrap tapestry, and under it a band (half as tall as it is
// wide) for the Line Staff (the treble clef) and the Rhyme Clock (the clock
// icon). The clock takes a square in the bottom-right corner and the Line
// Staff the rest; without the Line Staff the clock keeps its corner. At full
// size the clock covers the whole stage (ClockPane).
import React, { useLayoutEffect, useRef, useState } from "react";
import TapestryView from "./TapestryView";
import StaffPane from "./StaffPane/StaffPane";
import ClockPane from "./ClockPane/ClockPane";
import { stageLayout } from "./ClockPane/stageLayout";
import { useUIState } from "../contexts/UIStateContext";

export default function CenterStage({ songKey, duration }) {
  const { staffOpen, clockOpen } = useUIState();
  const ref = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const { bandH, clockW } = stageLayout({ ...size, staffOpen, clockOpen });
  return (
    <div className="rt-stage" ref={ref}>
      <div className="rt-stage-top"><TapestryView key={`tapestry-${songKey}`} /></div>
      {bandH > 0 && (
        <div className="rt-stage-bottom" style={{ height: bandH }}>
          {staffOpen ? <StaffPane duration={duration} /> : <div aria-hidden="true" />}
          {clockOpen && <div className="rt-stage-clock" style={{ width: clockW }}><ClockPane key={`clock-${songKey}`} duration={duration} /></div>}
        </div>
      )}
    </div>
  );
}
