// src/components/TapestryView/global/LoopGlyphs.jsx
// The loop section on the tapestry: a shaded band over the looped time (per
// row in wrap) and two handles, draggable along the rows, that move its start
// and end. Drawn in its own layer above the glyphs.
import React, { useRef } from "react";
import { useTapestryLayout } from "../../../contexts/TapestryLayoutContext";
import { useAudioEngine } from "../../../contexts/AudioContext";
import { dragLoopEdge } from "../../../utils/loop";

const HANDLE_W = 8;

export default function LoopGlyphs() {
  const { layout } = useTapestryLayout();
  const { loop, setLoop, duration } = useAudioEngine();
  const dragRef = useRef(null);

  if (!layout || !loop.on || !(loop.end > loop.start)) return null;
  const { rowHeight, width, timeToPixels, pointToTime } = layout;

  const { x: x0, row: r0 } = timeToPixels(loop.start);
  let { x: x1, row: r1 } = timeToPixels(loop.end);
  // an end on a row boundary belongs to the right edge of the row before
  if (x1 === 0 && r1 > r0) { x1 = width; r1 -= 1; }
  const bands = [];
  for (let row = r0; row <= r1; row++) {
    const a = row === r0 ? x0 : 0;
    const b = row === r1 ? x1 : width;
    bands.push(<rect key={`loop-${row}`} x={a} y={row * rowHeight} width={Math.max(0, b - a)} height={rowHeight} fill="#1a1a1a" opacity={0.07} pointerEvents="none" />);
  }

  const startDrag = (which) => (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const svg = e.currentTarget.ownerSVGElement;
    const rect = svg.getBoundingClientRect();
    const scaleX = svg.viewBox.baseVal.width / rect.width || 1;
    const scaleY = svg.viewBox.baseVal.height / rect.height || 1;
    // the edge NOT held stays fixed; crossing it just swaps which is start/end
    dragRef.current = { fixed: which === "start" ? loop.end : loop.start, scaleX, scaleY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e) => {
    const d = dragRef.current;
    if (!d) return;
    if (e.buttons === 0) { dragRef.current = null; return; }
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    const x = (e.clientX - rect.left) * d.scaleX;
    const y = (e.clientY - rect.top) * d.scaleY;
    const t = pointToTime(x, y);
    setLoop((prev) => ({ ...prev, ...dragLoopEdge(d.fixed, t, duration || Math.max(prev.end, t)) }));
  };
  const endDrag = (e) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
  };

  const handle = (which, x, row) => (
    <g key={`h-${which}`} data-loop-handle={which} style={{ cursor: "ew-resize" }} pointerEvents="all"
      onPointerDown={startDrag(which)} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={() => { dragRef.current = null; }}
      onClick={(e) => e.stopPropagation()}>
      <rect x={x - HANDLE_W / 2} y={row * rowHeight} width={HANDLE_W} height={rowHeight} fill="transparent" />
      <line x1={x} x2={x} y1={row * rowHeight} y2={(row + 1) * rowHeight} stroke="#1a1a1a" strokeWidth={2} />
      <rect x={which === "start" ? x : x - 7} y={row * rowHeight + 2} width={7} height={12} rx={1.5} fill="#1a1a1a" />
    </g>
  );

  return (
    <>
      {bands}
      {handle("start", x0, r0)}
      {handle("end", x1, r1)}
    </>
  );
}
