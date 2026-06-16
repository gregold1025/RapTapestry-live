import React, { useState } from "react";
import { usePlayheadSubscription } from "../../../contexts/AudioContext";
import { ScrubSlider } from "./ScrubSlider";

function fmtTime(sec = 0) {
  if (!isFinite(sec)) return "0:00";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

/**
 * Owns the 60fps current-time state in isolation so the transport buttons
 * (which don't change with time) never re-render during playback.
 */
export function TransportClock({ duration, onSeek }) {
  const [t, setT] = useState(0);
  usePlayheadSubscription(setT);

  return (
    <>
      <div className="ac-scrub-row">
        <ScrubSlider value={t} max={duration || 0} onChange={onSeek} />
      </div>
      <div className="ac-time-row">
        <span className="ac-time ac-time-current">{fmtTime(t)}</span>
        <span className="ac-time ac-time-total">{fmtTime(duration)}</span>
      </div>
    </>
  );
}
