/**
 * Coda comparison test suite.
 *
 * These cases correspond to the test case appendix in
 * research/rhyme-scoring-design-decisions.md. Each category tests a specific
 * aspect of the split coda algorithm (same-length positional vs different-length
 * order-preserving DP alignment).
 *
 * We test through rhymeComponents() which returns { nucleusSim, codaSim }.
 *
 * NOTE: Actual CONSONANT_SIM values from distinctive features:
 *   K↔T = 0.83 (both voiceless stops, differ in place)
 *   K↔P = 0.83 (both voiceless stops, differ in place)
 *   K↔N = 0.33 (differ in voicing, place, AND manner: stop vs nasal)
 *   K↔S = 0.50 (differ in manner: stop vs fricative)
 *   P↔T = 0.83 (both voiceless stops, differ in place)
 *   S↔T = 0.67 (same place, differ in manner)
 *   M↔N = 0.83 (both nasals, differ in place)
 */
import { describe, it, expect } from "vitest";
import { rhymeComponents, rhymeGate, decomposeSyllable, CONSONANT_SIM } from "../phonemeSimilarity.js";

function codaSimOf(phonesA, phonesB) {
  return rhymeComponents(phonesA, phonesB).codaSim;
}

// ─── Category A: Same-length codas (positional comparison) ───────────────────

describe("Category A: Same-length codas", () => {
  it("A1: identical codas [K,T]/[K,T] = 1.0", () => {
    const sim = codaSimOf("D IH S T R AH K T", "AH B S T R AH K T");
    expect(sim).toBe(1.0);
  });

  it("A2: [K,T]/[N,T] — K↔N is a large difference (stop vs nasal)", () => {
    const sim = codaSimOf("D IH S T R AH K T", "T AE L AH N T");
    // K↔N = 0.33, T↔T = 1.0, avg = 0.667
    expect(sim).toBeCloseTo(0.667, 2);
    expect(sim).toBeLessThan(1.0);
  });

  it("A3: [K,T]/[T,K] — K↔T are close (both voiceless stops)", () => {
    const sim = codaSimOf("AH K T", "AH T K");
    // K↔T = 0.83, T↔K = 0.83, avg = 0.833
    expect(sim).toBeCloseTo(0.833, 2);
  });

  it("A4: [N,D]/[N,D] = 1.0 (mind/find)", () => {
    const sim = codaSimOf("M AY N D", "F AY N D");
    expect(sim).toBe(1.0);
  });

  it("A5: [M,Z]/[N,Z] — nasal place difference (rhymes/lines)", () => {
    const sim = codaSimOf("R AY M Z", "L AY N Z");
    // M↔N = 0.83, Z=Z = 1.0, avg = 0.917
    expect(sim).toBeCloseTo(0.917, 2);
    expect(sim).toBeGreaterThan(0.85);
  });
});

// ─── Category B: Different-length codas (order-preserving alignment) ─────────

describe("Category B: Different-length codas", () => {
  it("B1: [K,T]/[K] — K finds K perfectly", () => {
    const sim = codaSimOf("D IH S T R AH K T", "B AH K");
    // K→K = 1.0, coverage = (1/2)^0.3 ≈ 0.81
    expect(sim).toBeCloseTo(0.812, 2);
    expect(sim).toBeGreaterThan(0.75);
  });

  it("B2: [K,T]/[T] — T finds T via DP (not locked to position 0)", () => {
    const sim = codaSimOf("D IH S T R AH K T", "S T R AH T");
    // T→T = 1.0, coverage ≈ 0.81
    expect(sim).toBeCloseTo(0.812, 2);
    // This was 0.47 under left-alignment. Must be much higher.
    expect(sim).toBeGreaterThan(0.75);
  });

  it("B3: [K,T]/[P] — P finds P↔K=0.83 as best match", () => {
    const sim = codaSimOf("D IH S T R AH K T", "AH P");
    // P→best(K=0.83, T=0.83) = 0.83, coverage ≈ 0.81, score ≈ 0.675
    expect(sim).toBeCloseTo(0.675, 2);
    expect(sim).toBeLessThan(codaSimOf("D IH S T R AH K T", "B AH K"));
  });

  it("B4: [K,T]/[S] — S best match is S↔T=0.67", () => {
    const sim = codaSimOf("D IH S T R AH K T", "AH S");
    // S→best(K=0.50, T=0.67) = 0.67, coverage ≈ 0.81, score ≈ 0.542
    expect(sim).toBeCloseTo(0.542, 2);
    expect(sim).toBeLessThan(codaSimOf("D IH S T R AH K T", "AH P"));
  });

  it("B5: [K,T,S]/[K,T] — plural suffix is trivial addition", () => {
    const sim = codaSimOf("D IH S T R AH K T S", "D IH S T R AH K T");
    // K→K, T→T = avg 1.0, coverage = (2/3)^0.3 ≈ 0.885
    expect(sim).toBeCloseTo(0.885, 1);
    expect(sim).toBeGreaterThan(0.85);
  });

  it("B6: [K,T,S]/[S] — S finds S despite length gap", () => {
    const sim = codaSimOf("D IH S T R AH K T S", "AH S");
    // S→S = 1.0, coverage = (1/3)^0.3 ≈ 0.72
    expect(sim).toBeCloseTo(0.72, 1);
    // Much higher than destruct/us (B4) because S finds S
    expect(sim).toBeGreaterThan(codaSimOf("D IH S T R AH K T", "AH S"));
  });

  it("B7: [M]/[M,Z] — plural Z doesn't hurt M match", () => {
    const sim = codaSimOf("R AY M", "R AY M Z");
    // M→M = 1.0, coverage ≈ 0.81
    expect(sim).toBeCloseTo(0.812, 2);
    expect(sim).toBeGreaterThan(0.75);
  });

  it("B8: rhymes/rhyme is symmetric with B7", () => {
    const forward = codaSimOf("R AY M", "R AY M Z");
    const reverse = codaSimOf("R AY M Z", "R AY M");
    expect(forward).toBeCloseTo(reverse, 4);
  });
});

// ─── Category C: Order preservation ──────────────────────────────────────────

describe("Category C: Order preservation", () => {
  it("C1 vs C2: destructs/destruct > destructs/dusk — order matters", () => {
    const natural = codaSimOf("D IH S T R AH K T S", "D IH S T R AH K T");
    const reordered = codaSimOf("D IH S T R AH K T S", "D AH S K");
    expect(natural).toBeGreaterThan(reordered);
    expect(natural).toBeGreaterThan(0.8);
    expect(reordered).toBeLessThan(0.65);
  });
});

// ─── Category D: Symmetry ────────────────────────────────────────────────────

describe("Category D: Symmetry", () => {
  it("D1: destruct↔strut same in both directions", () => {
    const forward = codaSimOf("D IH S T R AH K T", "S T R AH T");
    const reverse = codaSimOf("S T R AH T", "D IH S T R AH K T");
    expect(forward).toBeCloseTo(reverse, 4);
  });

  it("D2: destruct↔up same in both directions", () => {
    const forward = codaSimOf("D IH S T R AH K T", "AH P");
    const reverse = codaSimOf("AH P", "D IH S T R AH K T");
    expect(forward).toBeCloseTo(reverse, 4);
  });

  it("D3: rhyme↔rhymes same in both directions", () => {
    const forward = codaSimOf("R AY M", "R AY M Z");
    const reverse = codaSimOf("R AY M Z", "R AY M");
    expect(forward).toBeCloseTo(reverse, 4);
  });
});

// ─── Category E: Empty codas (open syllables) ────────────────────────────────

describe("Category E: Empty codas", () => {
  it("E1: both open syllables = 1.0", () => {
    expect(codaSimOf("F R IY", "S IY")).toBe(1.0);
  });

  it("E2: one open, one closed = 0.5 partial credit", () => {
    expect(codaSimOf("F R IY", "F IY T")).toBeCloseTo(0.5, 2);
  });

  it("E3: symmetric with E2", () => {
    expect(codaSimOf("F R IY", "F IY T")).toBeCloseTo(codaSimOf("F IY T", "F R IY"), 4);
  });
});

// ─── Category F: Ranking order ───────────────────────────────────────────────

describe("Category F: Ranking order (all AH words against 'destruct')", () => {
  const anchor = "D IH S T R AH K T";

  it("produces correct relative ranking", () => {
    const scores = {
      obstruct:  codaSimOf(anchor, "AH B S T R AH K T"),
      destructs: codaSimOf(anchor, "D IH S T R AH K T S"),
      buck:      codaSimOf(anchor, "B AH K"),
      strut:     codaSimOf(anchor, "S T R AH T"),
      talent:    codaSimOf(anchor, "T AE L AH N T"),
      up:        codaSimOf(anchor, "AH P"),
      us:        codaSimOf(anchor, "AH S"),
    };

    // Perfect match at top
    expect(scores.obstruct).toBe(1.0);
    // Plural suffix close to perfect
    expect(scores.destructs).toBeGreaterThan(0.85);
    expect(scores.destructs).toBeLessThan(scores.obstruct);
    // Single-consonant perfect matches: buck and strut find their consonant
    expect(scores.buck).toBeGreaterThan(0.75);
    expect(scores.strut).toBeGreaterThan(0.75);
    expect(Math.abs(scores.buck - scores.strut)).toBeLessThan(0.05);
    // "up" (P) — articulatory neighbor of K, no exact match but close
    expect(scores.up).toBeLessThan(scores.buck);
    expect(scores.up).toBeGreaterThan(0.6);
    // "talent" [N,T] — same length positional, K↔N is a big gap (0.33)
    expect(scores.talent).toBeLessThan(scores.buck);
    expect(scores.talent).toBeGreaterThan(0.5);
    // "us" (S) — weak match, lowest
    expect(scores.us).toBeLessThan(scores.up);
    expect(scores.us).toBeGreaterThan(0.4);
  });
});

// ─── Category G: rhymeGate integration ───────────────────────────────────────

describe("Category G: rhymeGate integration", () => {
  it("destruct/obstruct passes at high strictness", () => {
    const { match, quality } = rhymeGate(
      "D IH S T R AH K T", "AH B S T R AH K T",
      0.95, 0.80
    );
    expect(match).toBe(true);
    expect(quality).toBeGreaterThan(0.5);
  });

  it("destruct/us fails coda gate at strict threshold", () => {
    const { match } = rhymeGate(
      "D IH S T R AH K T", "AH S",
      0.70, 0.60  // codaSim ~0.54 < 0.60
    );
    expect(match).toBe(false);
  });

  it("destruct/buck passes moderate coda gate", () => {
    const { match } = rhymeGate(
      "D IH S T R AH K T", "B AH K",
      0.70, 0.50
    );
    expect(match).toBe(true);  // codaSim ~0.81 > 0.50
  });

  it("quality reflects nucleus distance above threshold", () => {
    // AH vs AH = 1.0, threshold 0.70 → quality = (1.0 - 0.70) / (1.0 - 0.70) = 1.0
    const { quality: q1 } = rhymeGate("AH K T", "AH K", 0.70, 0.40);
    expect(q1).toBeCloseTo(1.0, 2);

    // AH vs ER ≈ 0.88, threshold 0.70 → quality = (0.88 - 0.70) / 0.30 ≈ 0.60
    const { quality: q2 } = rhymeGate("AH K T", "ER S T", 0.70, 0.40);
    expect(q2).toBeGreaterThan(0.4);
    expect(q2).toBeLessThan(0.8);

    // Higher threshold → lower quality for same pair
    const { quality: q3 } = rhymeGate("AH K T", "ER S T", 0.85, 0.40);
    expect(q3).toBeLessThan(q2);
  });
});
