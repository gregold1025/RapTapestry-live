import { describe, it, expect } from "vitest";
import { stemMixReducer, initialStemMix, effectiveMutedOf } from "../stemMixReducer";

const STEMS = ["vocals", "drums", "bass", "other"];

describe("stemMixReducer", () => {
  it("starts unmuted, unsoloed, all visible", () => {
    expect(initialStemMix.soloed).toBeNull();
    for (const s of STEMS) {
      expect(initialStemMix.muted[s]).toBe(false);
      expect(initialStemMix.visible[s]).toBe(true);
    }
  });

  it("solo mutes every other stem in the effective map", () => {
    const st = stemMixReducer(initialStemMix, { type: "toggleSolo", stem: "drums" });
    const eff = effectiveMutedOf(st);
    expect(st.soloed).toBe("drums");
    expect(eff.drums).toBe(false);
    expect(eff.vocals).toBe(true);
    expect(eff.bass).toBe(true);
    expect(eff.other).toBe(true);
  });

  it("muting another stem while a solo is active clears the solo and keeps that stem muted", () => {
    let st = stemMixReducer(initialStemMix, { type: "toggleSolo", stem: "drums" });
    st = stemMixReducer(st, { type: "toggleMute", stem: "bass" });
    expect(st.soloed).toBeNull();
    expect(st.muted.bass).toBe(true);
    expect(effectiveMutedOf(st).vocals).toBe(false);
  });

  it("toggling the active solo clears it and unmutes everything", () => {
    let st = stemMixReducer(initialStemMix, { type: "toggleMute", stem: "vocals" });
    st = stemMixReducer(st, { type: "toggleSolo", stem: "drums" });
    st = stemMixReducer(st, { type: "toggleSolo", stem: "drums" });
    expect(st.soloed).toBeNull();
    for (const s of STEMS) expect(st.muted[s]).toBe(false);
  });

  it("soloing a second stem transfers the solo", () => {
    let st = stemMixReducer(initialStemMix, { type: "toggleSolo", stem: "drums" });
    st = stemMixReducer(st, { type: "toggleSolo", stem: "bass" });
    expect(st.soloed).toBe("bass");
    expect(effectiveMutedOf(st).drums).toBe(true);
    expect(effectiveMutedOf(st).bass).toBe(false);
  });

  it("setVisible flips only that stem", () => {
    const st = stemMixReducer(initialStemMix, { type: "setVisible", stem: "bass", visible: false });
    expect(st.visible.bass).toBe(false);
    expect(st.visible.vocals).toBe(true);
  });
});
