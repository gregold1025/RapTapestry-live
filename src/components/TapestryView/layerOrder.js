// src/components/TapestryView/layerOrder.js
// The stacked layers of the tapestry and the Line Staff, bottom to top. The grid (bar, beat and
// sub-beat lines, row lines) is the bottom layer, so every glyph sits on it (Greg 2026-11-10);
// the loop region stays on top.
export const layerOrder = (variant) => ["grid", "bass", variant === "staff" ? "staff-vocals" : "vocals", "drums", "loop"];
