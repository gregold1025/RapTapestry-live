// src/components/ClockPane/clockIndexStore.js
// The current ring's position (0 = the rim). It changes every cycle while
// frozen and playing, so it lives in this small store, not in ParamsContext
// (whose every consumer would re-render each bar). The clock and the Global
// slider subscribe to it.
import { useSyncExternalStore } from "react";
import { CLOCK_DEFAULTS } from "./clockDefaults";
import { clampIndex } from "./clockGeometry";

export function createClockIndexStore(initial = 0) {
  let value = initial;
  const subs = new Set();
  const set = (v) => {
    if (v === value) return;
    value = v;
    subs.forEach((f) => f());
  };
  return {
    get: () => value,
    set,
    clampTo: (rings) => set(clampIndex(value, rings)),
    subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
  };
}

export const clockIndexStore = createClockIndexStore(CLOCK_DEFAULTS.index);

/** [index, setIndex] for the app's clock. */
export function useClockIndex() {
  const v = useSyncExternalStore(clockIndexStore.subscribe, clockIndexStore.get, clockIndexStore.get);
  return [v, clockIndexStore.set];
}
