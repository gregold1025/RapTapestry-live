// src/components/ClockPane/useClockWindow.js
// The clock's window over the song, and its per-frame work. W = the cycle on
// the outermost ring; the current ring is the playhead's. Follow keeps the
// playhead's ring at the chosen index (clockIndex); Freeze holds W and lets
// the current ring (and clockIndex) move with the playhead. Per frame, with no
// React re-render: the hand turns, and while following and playing, marks the
// playhead has not reached are faint. React state changes only when a cycle
// boundary is crossed or the user acts.
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { useClockIndex } from "./clockIndexStore";
import { syncWindow, windowForIndex, clampIndex, revealOpacity, clampWindow, reanchorWindow } from "./clockGeometry";

export function useClockWindow({ cycles, rings, wholeSong, svgRef }) {
  const { subscribePlayhead, getPlayheadTime, isPlaying } = useAudioEngine();
  const [clockIndex, setClockIndex] = useClockIndex();
  const [follow, setFollow] = useState(true);
  const [win, setWin] = useState({ W: 0, current: null });

  const S = useRef(null);
  if (!S.current) S.current = { index: clockIndex, W: 0, current: null };
  const st = S.current;
  st.follow = follow; st.playing = isPlaying; st.cycles = cycles; st.rings = rings; st.wholeSong = wholeSong;
  st.W = win.W; st.current = win.current;

  const frame = useCallback((t) => {
    const s = S.current;
    if (!s.cycles || s.cycles.count === 0) return;
    const P = s.cycles.cycleOf(t);
    const r = syncWindow({ follow: s.follow, W: s.W, P, index: clampIndex(s.index, s.rings), rings: s.rings, wholeSong: s.wholeSong });
    if (r.W !== s.W || r.current !== s.current) {
      s.W = r.W; s.current = r.current;
      setWin({ W: r.W, current: r.current });
    }
    if (!s.follow && !s.wholeSong && r.index !== s.index) {
      s.index = r.index;
      setClockIndex(r.index);
    }
    const svg = svgRef.current;
    if (!svg) return;
    const hand = svg.querySelector("[data-hand]");
    if (hand) {
      if (r.current == null) hand.setAttribute("visibility", "hidden");
      else {
        hand.setAttribute("visibility", "visible");
        hand.setAttribute("transform", `rotate(${(s.cycles.fracOf(t) * 360).toFixed(2)} ${hand.dataset.cx} ${hand.dataset.cy})`);
      }
    }
    for (const el of svg.querySelectorAll("[data-start]")) {
      const ring = el.dataset.ring != null ? +el.dataset.ring : r.current;   // drums are the current cycle
      const o = revealOpacity({ follow: s.follow, playing: s.playing, ring, current: r.current, start: +el.dataset.start, t });
      if (el.dataset.o !== String(o)) { el.dataset.o = String(o); el.style.opacity = o === 1 ? "" : String(o); }
    }
  }, [svgRef, setClockIndex]);

  // a new cycle length, or leaving whole song, while frozen: keep the window's place in the song
  const prev = useRef({ cycles, wholeSong });
  useEffect(() => {
    const p = prev.current, s = S.current;
    prev.current = { cycles, wholeSong };
    if (p.cycles === cycles && p.wholeSong === wholeSong) return;
    if (s.follow || wholeSong) return;   // Follow and whole song set the window themselves
    const P = cycles.cycleOf(getPlayheadTime());
    const W = reanchorWindow({ W: s.W, oldCycles: p.cycles, newCycles: cycles, P, index: s.index, rings, leftWholeSong: p.wholeSong && !wholeSong });
    if (W !== s.W) { s.W = W; setWin((w) => ({ ...w, W })); }
  }, [cycles, wholeSong, rings, getPlayheadTime]);

  useEffect(() => subscribePlayhead(frame), [subscribePlayhead, frame]);
  // after every render (new marks, new window, mode changes): bring the DOM up to date
  useEffect(() => { frame(getPlayheadTime()); });

  // the index set from outside (the Global slider, a ring drag): move the window, not the playhead
  useEffect(() => {
    const s = S.current;
    if (clockIndex === s.index) return;
    s.index = clockIndex;
    if (s.wholeSong || !s.cycles || s.cycles.count === 0) return;
    if (!s.follow) {
      const P = s.cycles.cycleOf(getPlayheadTime());
      const W = windowForIndex(P, clampIndex(clockIndex, s.rings));
      s.W = W;
      setWin((w) => ({ ...w, W }));
    }
    frame(getPlayheadTime());
  }, [clockIndex, frame, getPlayheadTime]);

  const setIndexFromDrag = useCallback((i) => setClockIndex(clampIndex(i, S.current.rings)), [setClockIndex]);
  const panBy = useCallback((k) => {
    if (!k) return;
    const s = S.current;
    s.follow = false;
    setFollow(false);
    s.W = clampWindow(s.W + k, s.rings, s.cycles?.count ?? 0);
    setWin((w) => ({ ...w, W: s.W }));
    frame(getPlayheadTime());
  }, [frame, getPlayheadTime]);
  const freeze = useCallback(() => { S.current.follow = false; setFollow(false); }, []);

  return { W: win.W, current: win.current, follow, setFollow, freeze, setIndexFromDrag, panBy };
}
