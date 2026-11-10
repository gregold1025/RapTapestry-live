// src/components/CenterStage.jsx
// The center: the wrap tapestry, and under it (when the treble clef is on) a
// band, 44% of the stage, for the Line Staff. The Rhyme Clock is a square of
// the same height in the stage's bottom-right corner: beside the Line Staff
// (which stops short of it), or, without it, over the tapestry, which then
// runs full height. The clock stays mounted in one place, so opening or
// closing the Line Staff keeps its state. At full size it covers the stage.
import React, { useLayoutEffect, useRef, useState } from "react";
import TapestryView from "./TapestryView";
import StaffPane from "./StaffPane/StaffPane";
import ClockPane from "./ClockPane/ClockPane";
import { stageLayout } from "./ClockPane/stageLayout";
import { useUIState } from "../contexts/UIStateContext";
import { useSession } from "../session/SessionContext";

export default function CenterStage({ songKey, duration }) {
  const { staffOpen, clockOpen } = useUIState();
  const epoch = useSession()?.epoch ?? 0;   // a session load remounts the Line Staff and the clock, so both start in Follow
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
        <div className="rt-stage-bottom" style={{ height: bandH, paddingRight: clockW }}>
          <StaffPane key={`staff-${songKey}-${epoch}`} duration={duration} />
        </div>
      )}
      {clockOpen && clockW > 0 && (
        <div className="rt-stage-clock" style={{ "--clock-side": `${clockW}px` }}>
          <ClockPane key={`clock-${songKey}-${epoch}`} duration={duration} />
        </div>
      )}
    </div>
  );
}
