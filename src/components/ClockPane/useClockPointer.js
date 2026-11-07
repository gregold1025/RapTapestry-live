// src/components/ClockPane/useClockPointer.js
// The clock's pointer rules (the tapestry's and Line Staff's, on a circle):
//   - a plain click on the background seeks to that place on the spiral (in
//     the drum band: that angle in the playhead's cycle); the spiral does not
//     move (the clock freezes, so Follow cannot shift it);
//   - a drag anywhere pans through the song, smoothly (Greg, 2026-11-06):
//     inward = earlier, outward = later, one cycle per turn gap, as far as
//     the song goes (past the center too); it freezes and never seeks.
// Word clicks are the words' own (ClockWords); a drag that ends on a word
// does not click it.
import { useEffect, useRef } from "react";
import { useAudioControls } from "../../contexts/AudioContext";
import { pointerToSong, ringPitch, dragMode, clickTarget, radialPan, clampWindow } from "./clockGeometry";

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
      return pointerToSong(x, y, cx, cy, S.current.win.getW(), rings, rOuter, rInner);
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      const [x, y] = local(e);
      S.current.drag = { x: e.clientX, y: e.clientY, x0: x, y0: y, mode: dragMode({ wholeSong: S.current.wholeSong }), W0: S.current.win.getW(), moved: false };
    };
    const onMove = (e) => {
      const d = S.current.drag;
      if (!d || !d.mode) return;
      const w = S.current.win;
      if (!d.moved) {
        if (Math.hypot(e.clientX - d.x, e.clientY - d.y) <= MOVE_PX) return;
        d.moved = true;
        svg.style.cursor = "grabbing";
        w.freeze();
      }
      const g = S.current.geo;
      const [x, y] = local(e);
      const k = radialPan({ cx: g.cx, cy: g.cy, x0: d.x0, y0: d.y0, x, y, spacing: ringPitch(g.rings, g.rOuter, g.rInner) });
      w.panTo(clampWindow(d.W0 + k, g.rings, S.current.cycles?.count ?? 0, d.W0));
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
      if (!c || c.count === 0) return;
      const tgt = clickTarget({ r: p.r, u: p.u, frac: p.frac, W: w.getW(), rings: g.rings, P: w.P, count: c.count, rOuter: g.rOuter, drumBand: g.drumBand });
      if (!tgt) return;
      w.freeze();
      seekAll(c.timeAt(tgt.cycle, tgt.frac));
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
