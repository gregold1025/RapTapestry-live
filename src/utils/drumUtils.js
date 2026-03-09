// Vertical position as fraction of rowHeight (0=top, 1=bottom)
// Drum notation order: cymbals at top, kick at bottom
export const HIT_Y_FRAC = {
  crash:        0.08,
  ride:         0.18,
  hihat_open:   0.28,
  hihat_closed: 0.35,
  tom:          0.48,
  snare:        0.60,
  kick:         0.75,
  // legacy backward-compat
  high:         0.28,
  mid:          0.48,
  low:          0.75,
};

export function hitYFrac(category) {
  return HIT_Y_FRAC[category] ?? HIT_Y_FRAC.low;
}

export function hitYOffset(category, rowHeight) {
  return hitYFrac(category) * rowHeight;
}

// velocity 1-127 → opacity 0.3-1.0; missing velocity → defaultOpacity
export function velocityToOpacity(velocity, defaultOpacity = 0.8) {
  if (velocity == null || !Number.isFinite(velocity)) return defaultOpacity;
  return 0.3 + (Math.max(1, Math.min(127, velocity)) / 127) * 0.7;
}
