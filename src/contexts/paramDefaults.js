// src/contexts/paramDefaults.js
// Starting values for the bass and drum panels (Greg, 2026-11-06).

export const BASS_DEFAULTS = {
  rectHeight: 0, // gap (px) between the line and its toppers
  fillColor: "#404b77", // rgb(64, 75, 119)
  opacity: 0.2,
  blur: 1,
  thickness: 10, // spline stroke (px)
  band: { lo: 0, hi: 50 }, // the song's pitch range lands in the bottom half of the bass lane
  topper: "none", // "divider" | "none": a glyph strip above and below each note
};

export const DRUM_DEFAULTS = {
  strokeWeight: 5,
  tilt: 0,
  fillColor: "#000000",
  opacity: 0.4, // all drum glyphs (multiplies each row's opacity)
  size: 0.8, // all drum glyphs (multiplies each row's size)
};
