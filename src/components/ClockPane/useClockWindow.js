// src/components/ClockPane/useClockWindow.js
// The clock's window over the song and its per-frame drawing. W (in cycles,
// fractional) is the song position at the spiral's outer end. Follow moves W
// with the playhead, so the playhead stays halfway round the middle ring and
// the spiral expands outward without turning; Freeze holds W (a drag pans it).
// Each frame, without a React re-render: the spiral and everything on it are
// redrawn when W moves (clockDraw), the hand turns, and marks fade (ahead of
// the playhead while following; at the spiral's ends). React state changes
// only when W crosses a whole cycle (which cycles are drawn) or the playhead
// enters a new cycle (the drums). The glow follows the word being sung.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { songPos, syncWindow, reanchorWindow, wordAt, wordGlowSpan } from "./clockGeometry";
import { drawSpiral, drawGlow, drawOpacity } from "./clockDraw";

export function useClockWindow({ cycles, rings, wholeSong, svgRef, geo, words }) {
  const { subscribePlayhead, getPlayheadTime, isPlaying } = useAudioEngine();
  const [follow, setFollow] = useState(true);
  const [win, setWin] = useState({ Wi: 0, P: -1 });

  const S = useRef(null);
  if (!S.current) S.current = { W: 0, Wi: 0, P: -1, drawnW: NaN, glowKey: "" };
  const st = S.current;
  st.follow = follow; st.playing = isPlaying; st.cycles = cycles; st.rings = rings; st.wholeSong = wholeSong; st.geo = geo; st.words = words;

  const frame = useCallback((t, force = false) => {
    const s = S.current;
    if (!s.cycles || s.cycles.count === 0 || !s.geo) return;
    const P = s.cycles.cycleOf(t);
    s.W = syncWindow({ follow: s.follow, W: s.W, U: songPos(s.cycles, t), rings: s.rings, wholeSong: s.wholeSong });
    const Wi = s.wholeSong ? 0 : Math.floor(s.W);
    if (Wi !== s.Wi || P !== s.P) { s.Wi = Wi; s.P = P; setWin({ Wi, P }); }
    const svg = svgRef.current;
    if (!svg) return;
    if (force || s.W !== s.drawnW) { drawSpiral(svg, { W: s.W, geo: s.geo, wholeSong: s.wholeSong }); s.drawnW = s.W; }
    const wi = wordAt(s.words, t);
    const glowKey = `${s.W}|${wi}`;
    if (force || glowKey !== s.glowKey) {
      drawGlow(svg, { W: s.W, span: wordGlowSpan({ word: s.words?.[wi] ?? null, cycles: s.cycles, W: s.W, rings: s.rings }), geo: s.geo });
      s.glowKey = glowKey;
    }
    const hand = svg.querySelector("[data-hand]");
    if (hand) {
      if (P < 0) hand.setAttribute("visibility", "hidden");
      else {
        hand.setAttribute("visibility", "visible");
        hand.setAttribute("transform", `rotate(${(s.cycles.fracOf(t) * 360).toFixed(2)} ${hand.dataset.cx} ${hand.dataset.cy})`);
      }
    }
    drawOpacity(svg, { follow: s.follow, playing: s.playing, t, W: s.W, rings: s.rings, wholeSong: s.wholeSong });
  }, [svgRef]);

  // a new cycle length, or leaving whole song, while frozen: keep the window's place in the song
  const prev = useRef({ cycles, wholeSong });
  useEffect(() => {
    const p = prev.current, s = S.current;
    prev.current = { cycles, wholeSong };
    if (p.cycles === cycles && p.wholeSong === wholeSong) return;
    if (s.follow || wholeSong) return;   // Follow and whole song set the window themselves
    const t = getPlayheadTime();
    s.W = reanchorWindow({ W: s.W, oldCycles: p.cycles, newCycles: cycles, U: songPos(cycles, t), rings, leftWholeSong: p.wholeSong && !wholeSong });
    frame(t, true);
  }, [cycles, wholeSong, rings, getPlayheadTime, frame]);

  useEffect(() => subscribePlayhead(frame), [subscribePlayhead, frame]);
  // after every render (new marks, sizes, modes), before paint: draw everything for the current window
  useLayoutEffect(() => { frame(getPlayheadTime(), true); });

  /** Move the window to W (a drag): freezes. */
  const panTo = useCallback((W) => {
    const s = S.current;
    s.follow = false;
    setFollow(false);
    s.W = W;
    frame(getPlayheadTime());
  }, [frame, getPlayheadTime]);
  const freeze = useCallback(() => { S.current.follow = false; setFollow(false); }, []);
  const getW = useCallback(() => S.current.W, []);

  return { Wi: win.Wi, P: win.P, follow, setFollow, freeze, panTo, getW };
}
