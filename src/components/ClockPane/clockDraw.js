// src/components/ClockPane/clockDraw.js
// Draws the spiral's moving parts straight into the svg, without React: the
// window W changes every frame while following, and a radius cannot move by
// a transform. The components render elements that carry song positions:
//   path[data-u0][data-u1]   a stretch of spiral (word arcs, hit strokes,
//                            lines; labels add data-tlen and data-off)
//   circle[data-u]           a point on the spiral (rhyme-vowel dots)
//   path[data-face]          the spiral's own line, in fading pieces
//   path[data-glow]          the playhead's cycle
//   [data-umid][data-start]  a mark whose opacity is the reveal × the end fades
import { spiralPath, labelSpan, radiusAt, polar, facePieces, fadeLen, markOpacity } from "./clockGeometry";

/** Every stretch and point on the spiral, and the spiral itself, for window W. */
export function drawSpiral(svg, { W, geo, wholeSong }) {
  const { cx, cy, rOuter, rInner, rings } = geo;
  for (const el of svg.querySelectorAll("path[data-u0]")) {
    const u0 = +el.dataset.u0;
    const u1 = el.dataset.tlen ? labelSpan(u0, +el.dataset.u1, W, +el.dataset.tlen, rings, rOuter, rInner) : +el.dataset.u1;
    el.setAttribute("d", spiralPath(cx, cy, u0, u1, W, rings, rOuter, rInner, +(el.dataset.off || 0)));
  }
  for (const el of svg.querySelectorAll("circle[data-u]")) {
    const u = +el.dataset.u;
    const p = polar(cx, cy, radiusAt(u - W, rings, rOuter, rInner), u - Math.floor(u));
    el.setAttribute("cx", p.x.toFixed(2));
    el.setAttribute("cy", p.y.toFixed(2));
  }
  const pieces = facePieces(W, rings, wholeSong ? 0 : fadeLen(rings));
  svg.querySelectorAll("path[data-face]").forEach((el, k) => {
    const p = pieces[k];
    el.setAttribute("d", p ? spiralPath(cx, cy, p.u0, p.u1, W, rings, rOuter, rInner) : "");
    el.setAttribute("opacity", p ? p.alpha.toFixed(3) : "0");
  });
}

/** The glow on the playhead's cycle P, where it lies on the spiral's visible stretch. */
export function drawGlow(svg, { W, P, geo }) {
  const { cx, cy, rOuter, rInner, rings } = geo;
  const u0 = Math.max(P, W), u1 = Math.min(P + 1, W + rings);
  const d = P >= 0 && u1 > u0 ? spiralPath(cx, cy, u0, u1, W, rings, rOuter, rInner) : "";
  for (const el of svg.querySelectorAll("path[data-glow]")) el.setAttribute("d", d);
}

/** Each mark's opacity: faint ahead of the playhead while following, fading at the spiral's ends. */
export function drawOpacity(svg, { follow, playing, t, W, rings, wholeSong }) {
  for (const el of svg.querySelectorAll("[data-umid]")) {
    const o = markOpacity({ follow, playing, start: +el.dataset.start, t, umid: +el.dataset.umid, W, rings, wholeSong });
    const key = o.toFixed(3);
    if (el.dataset.o === key) continue;
    el.dataset.o = key;
    el.style.opacity = o >= 0.999 ? "" : key;
    el.style.pointerEvents = o < 0.05 ? "none" : "";   // faded out: not hoverable or clickable
  }
}
