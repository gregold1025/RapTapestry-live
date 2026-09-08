// src/utils/selectorStore.js
//
// Tiny external store + selector hook (useSyncExternalStore). Providers push
// their memoised derived state into a store; leaf components subscribe with a
// selector and only re-render when THEIR selected value changes. This is how
// ~1,000 WordBlocks avoid re-rendering when one selection changes (React
// context re-renders every consumer regardless of React.memo).
import { useLayoutEffect, useRef, useSyncExternalStore } from "react";

export function createSelectorStore(initial) {
  let snapshot = initial;
  const subscribers = new Set();
  return {
    get: () => snapshot,
    set(next) {
      if (next === snapshot) return;
      snapshot = next;
      subscribers.forEach((cb) => cb());
    },
    subscribe(cb) {
      subscribers.add(cb);
      return () => subscribers.delete(cb);
    },
  };
}

/** Provider-side: create the store once and publish each new snapshot. */
export function useSelectorStoreProvider(snapshot) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = createSelectorStore(snapshot);
  useLayoutEffect(() => {
    ref.current.set(snapshot);
  }, [snapshot]);
  return ref.current;
}

/**
 * Consumer-side. `selector` must be pure and return a referentially stable
 * value for an unchanged snapshot (primitives, or objects reused by the
 * provider), otherwise the component re-renders on every publish.
 */
export function useSelectorStore(store, selector) {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.get()),
    () => selector(store.get())
  );
}

/** Latest-ref pattern: a stable object whose methods call the newest impls. */
export function useStableActions(impls) {
  const ref = useRef(impls);
  ref.current = impls;
  const stable = useRef(null);
  if (stable.current === null) {
    stable.current = {};
    for (const key of Object.keys(impls)) {
      stable.current[key] = (...args) => ref.current[key](...args);
    }
  }
  return stable.current;
}
