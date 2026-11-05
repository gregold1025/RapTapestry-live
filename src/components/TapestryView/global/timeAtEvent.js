// src/components/TapestryView/global/timeAtEvent.js
// The song time under a pointer event on a tapestry layer (wrap rows or the
// scroll row): svg-local coordinates via the layer's bounding box, then the
// layout's pointToTime.
export function timeAtEvent(e, layout) {
  const svg = e.currentTarget?.ownerSVGElement ?? (e.currentTarget?.tagName === "svg" ? e.currentTarget : null) ?? e.target?.ownerSVGElement ?? e.target?.closest?.("svg");
  if (!svg || !layout?.pointToTime) return null;
  const rect = svg.getBoundingClientRect();
  const vb = svg.viewBox?.baseVal;
  const sx = vb?.width ? vb.width / rect.width : 1;
  const sy = vb?.height ? vb.height / rect.height : 1;
  return layout.pointToTime((e.clientX - rect.left) * sx, (e.clientY - rect.top) * sy);
}
