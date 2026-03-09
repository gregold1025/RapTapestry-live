// src/__tests__/drums.test.js
import { describe, it, expect } from 'vitest';
import {
  HIT_Y_FRAC,
  hitYFrac,
  hitYOffset,
  velocityToOpacity,
} from '../utils/drumUtils.js';

// ─────────────────────────────────────────────
// hitYFrac — vertical ordering
// ─────────────────────────────────────────────

describe('hitYFrac vertical ordering', () => {
  it('all 7 categories return values in range [0, 1]', () => {
    const cats = ['crash', 'ride', 'hihat_open', 'hihat_closed', 'tom', 'snare', 'kick'];
    for (const c of cats) {
      const f = hitYFrac(c);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it('cymbals are at top, kick at bottom: crash < ride < hihat_open < hihat_closed < tom < snare < kick', () => {
    expect(hitYFrac('crash')).toBeLessThan(hitYFrac('ride'));
    expect(hitYFrac('ride')).toBeLessThan(hitYFrac('hihat_open'));
    expect(hitYFrac('hihat_open')).toBeLessThan(hitYFrac('hihat_closed'));
    expect(hitYFrac('hihat_closed')).toBeLessThan(hitYFrac('tom'));
    expect(hitYFrac('tom')).toBeLessThan(hitYFrac('snare'));
    expect(hitYFrac('snare')).toBeLessThan(hitYFrac('kick'));
  });
});

// ─────────────────────────────────────────────
// hitYOffset
// ─────────────────────────────────────────────

describe('hitYOffset', () => {
  it('returns hitYFrac * rowHeight', () => {
    const rowHeight = 100;
    expect(hitYOffset('kick', rowHeight)).toBeCloseTo(hitYFrac('kick') * rowHeight, 6);
    expect(hitYOffset('snare', rowHeight)).toBeCloseTo(hitYFrac('snare') * rowHeight, 6);
    expect(hitYOffset('crash', rowHeight)).toBeCloseTo(hitYFrac('crash') * rowHeight, 6);
  });

  it('kick at rowHeight=100 → 75', () => {
    expect(hitYOffset('kick', 100)).toBeCloseTo(75, 6);
  });

  it('crash at rowHeight=100 → 8', () => {
    expect(hitYOffset('crash', 100)).toBeCloseTo(8, 6);
  });
});

// ─────────────────────────────────────────────
// Legacy backward compatibility
// ─────────────────────────────────────────────

describe('legacy category backward compat', () => {
  it('high maps same as hihat_open', () => {
    expect(hitYFrac('high')).toBe(hitYFrac('hihat_open'));
  });

  it('mid maps same as tom', () => {
    expect(hitYFrac('mid')).toBe(hitYFrac('tom'));
  });

  it('low maps same as kick', () => {
    expect(hitYFrac('low')).toBe(hitYFrac('kick'));
  });
});

// ─────────────────────────────────────────────
// Unknown category fallback
// ─────────────────────────────────────────────

describe('unknown category fallback', () => {
  it('unknown category falls back to low (kick) position', () => {
    expect(hitYFrac('whatever')).toBe(hitYFrac('low'));
    expect(hitYFrac(undefined)).toBe(hitYFrac('low'));
    expect(hitYFrac('cowbell')).toBe(hitYFrac('low'));
  });
});

// ─────────────────────────────────────────────
// velocityToOpacity
// ─────────────────────────────────────────────

describe('velocityToOpacity', () => {
  it('velocity=127 → 1.0', () => {
    expect(velocityToOpacity(127)).toBeCloseTo(1.0, 4);
  });

  it('velocity=1 → ~0.305 (close to 0.3)', () => {
    const result = velocityToOpacity(1);
    expect(result).toBeGreaterThanOrEqual(0.3);
    expect(result).toBeLessThan(0.32);
  });

  it('velocity=64 → midpoint between 0.3 and 1.0', () => {
    const result = velocityToOpacity(64);
    expect(result).toBeGreaterThan(0.3);
    expect(result).toBeLessThan(1.0);
    // roughly 0.3 + (64/127)*0.7 ≈ 0.653
    expect(result).toBeCloseTo(0.3 + (64 / 127) * 0.7, 3);
  });

  it('missing velocity (undefined) returns defaultOpacity=0.8', () => {
    expect(velocityToOpacity(undefined)).toBe(0.8);
    expect(velocityToOpacity(null)).toBe(0.8);
  });

  it('custom defaultOpacity used when velocity missing', () => {
    expect(velocityToOpacity(undefined, 0.5)).toBe(0.5);
  });

  it('velocity=200 clamps to 127 → 1.0', () => {
    expect(velocityToOpacity(200)).toBeCloseTo(1.0, 4);
  });

  it('velocity=0 clamps to 1 → ~0.305', () => {
    const result = velocityToOpacity(0);
    expect(result).toBeGreaterThanOrEqual(0.3);
    expect(result).toBeLessThan(0.32);
  });

  it('non-finite velocity (NaN) returns defaultOpacity', () => {
    expect(velocityToOpacity(NaN)).toBe(0.8);
  });
});
