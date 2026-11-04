// Bar . beat readout of the playhead (1-based), updated per frame outside React state for the buttons.
import React, { useState } from "react";
import { usePlayheadSubscription } from "../../../contexts/AudioContext";
import { useSongData } from "../../../contexts/SongDataContext";

export function BarBeat() {
  const { songModel } = useSongData();
  const [pos, setPos] = useState({ bar: 0, beat: 0 });
  usePlayheadSubscription((t) => {
    if (!songModel) return;
    const p = songModel.barPosition(t);
    const next = { bar: Math.max(0, p.bar) + 1, beat: (p.beat ?? 0) + 1 };
    setPos((prev) => (prev.bar === next.bar && prev.beat === next.beat ? prev : next));
  });
  return (
    <div className="ac-barbeat" title="Bar and beat">
      <span className="ac-barbeat-n">{pos.bar}</span><span className="ac-barbeat-l">bar</span>
      <span className="ac-barbeat-n">{pos.beat}</span><span className="ac-barbeat-l">beat</span>
    </div>
  );
}
