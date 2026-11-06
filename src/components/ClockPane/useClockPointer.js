// src/components/ClockPane/useClockPointer.js
// The clock's pointer rules (the tapestry's and Line Staff's, on a circle):
//   - a plain click on the background seeks to that ring and angle; the rings
//     do not move (the clock freezes, so Follow cannot shift them), and the
//     clicked ring becomes the current ring;
//   - a drag that starts on the current ring moves it in or out, a ring at a
//     time (the window moves, not the playhead);
//   - any other drag pans through the song, one cycle per full turn
//     (clockwise = later), and freezes; it never seeks.
// Word clicks are the words' own (ClockWords); a drag that ends on a word
// does not click it.
import { useEffect, useRef } from "react";
import { useAudioControls } from "../../contexts/AudioContext";
import { pointerToClock, unwrapDelta, ringRadius, dragMode } from "./clockGeometry";

const MOVE_PX = 4;

export function useClockPointer({ svgRef, geo, cycles, win, wholeSong, active }) {
  const { seekAll } = useAudioControls();
  const S = useRef({ drag: null, justDragged: false });
  S.current.geo = geo; S.current.cycles = cycles; S.current.win = win; S.current.wholeSong = wholeSong;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const local = (e) => {
      const r = svg.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const at = (e) => {
      const { cx, cy, rings, rOuter, rInner } = S.current.geo;
      const [x, y] = local(e);
      return pointerToClock(x, y, cx, cy, rings, rOuter, rInner);
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      const { geo: g, win: w } = S.current;
      const p = at(e);
      const onCurrentRing = w.current != null && Math.abs(p.r - ringRadius(w.current, g.rings, g.rOuter, g.rInner)) <= 5;
      S.current.drag = { x: e.clientX, y: e.clientY, mode: dragMode({ onCurrentRing, wholeSong: S.current.wholeSong, rings: g.rings }), frac: p.frac, turns: 0, moved: false };
    };
    const onMove = (e) => {
      const d = S.current.drag;
      if (!d || !d.mode) return;
      const w = S.current.win;
      if (!d.moved) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) <= MOVE_PX) return;
        d.moved = true;
        svg.style.cursor = d.mode === "ring" ? "ns-resize" : "grabbing";
        if (d.mode === "pan") w.freeze();
      }
      const p = at(e);
      if (d.mode === "ring") {
        if (p.ring !== w.current) w.setIndexFromDrag(p.ring);
        return;
      }
      d.turns += unwrapDelta(d.frac, p.frac);
      d.frac = p.frac;
      while (d.turns >= 1) { d.turns -= 1; w.panBy(1); }
      while (d.turns <= -1) { d.turns += 1; w.panBy(-1); }
    };
    const onUp = () => {
      const d = S.current.drag;
      if (!d) return;
      S.current.drag = null;
      svg.style.cursor = "";
      if (d.moved) { S.current.justDragged = true; setTimeout(() => { S.current.justDragged = false; }, 0); }
    };
    // Native, so it runs before React's root handler: a drag's closing click
    // never reaches a word; a background click seeks.
    const onClick = (e) => {
      if (S.current.justDragged) { e.stopPropagation(); e.preventDefault(); return; }
      if (e.target.closest?.("[data-word]")) return;   // a word's own click
      const { geo: g, cycles: c, win: w } = S.current;
      const p = at(e);
      if (!c || c.count === 0 || p.r > g.rOuter + g.drumBand) return;
      const cycle = w.W + p.ring;
      if (cycle < 0 || cycle >= c.count) return;
      w.freeze();
      seekAll(c.timeAt(cycle, p.frac));
    };
    svg.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    svg.addEventListener("click", onClick);
    return () => {
      svg.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      svg.removeEventListener("click", onClick);
    };
  }, [svgRef, seekAll, active]);
}
