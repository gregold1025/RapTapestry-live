// src/contexts/TapestryLayoutContext.jsx
import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
} from "react";

import { computeLayout } from "../utils/computeLayout";
import { timeToPixels, getRowIndex } from "../utils/timeUtils";
import { useParams } from "./ParamsContext";

const TapestryLayoutContext = createContext(null);

export function TapestryLayoutProvider({
  children,
  duration,
  estimated_bpm,
  downbeats = [],
  beats = [],
  barsPerRow = 8,

  // Optional overrides (if you pass these explicitly, they win)
  rowHeightMode: rowHeightModeOverride,
  fixedRowHeightPx: fixedRowHeightPxOverride,
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  // Read from ParamsContext (global settings)
  const {
    rowHeightMode: rowHeightModeFromParams,
    fixedRowHeightPx: fixedRowHeightPxFromParams,
  } = useParams();

  // Decide final values: override props > params > defaults
  const rowHeightMode =
    rowHeightModeOverride ?? rowHeightModeFromParams ?? "fit";
  const fixedRowHeightPx =
    fixedRowHeightPxOverride ?? fixedRowHeightPxFromParams ?? 140;

  // Keep layout inputs in a ref so the ResizeObserver callback always
  // sees current values without needing to re-subscribe on every change.
  const inputsRef = useRef({
    duration, estimated_bpm, beats, downbeats, barsPerRow,
    rowHeightMode, fixedRowHeightPx,
  });
  inputsRef.current = {
    duration, estimated_bpm, beats, downbeats, barsPerRow,
    rowHeightMode, fixedRowHeightPx,
  };

  // Single function that reads container size and computes layout in one pass
  const recompute = React.useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const clientWidth = el.clientWidth;
    const clientHeight = el.clientHeight;
    if (!clientWidth || !clientHeight) return;

    const {
      duration: dur, estimated_bpm: bpm, beats: b, downbeats: db,
      barsPerRow: bpr, rowHeightMode: rhm, fixedRowHeightPx: frhp,
    } = inputsRef.current;

    if (!dur || !bpm || !Array.isArray(b) || b.length === 0) return;

    const newLayout = computeLayout({
      duration: dur,
      width: clientWidth,
      height: clientHeight,
      beats: b,
      downbeats: db,
      barsPerRow: bpr,
      estimated_bpm: bpm,
      rowHeightMode: rhm,
      fixedRowHeightPx: frhp,
    });

    if (!newLayout) return;

    const mappedLayout = {
      ...newLayout,
      timeToPixels: (t) =>
        timeToPixels(
          t,
          newLayout.rowBoundaries,
          newLayout.gridTimes,
          newLayout.width,
          newLayout.rowHeight,
          newLayout.beatsPerRow
        ),
      getRowIndex: (t) => getRowIndex(t, newLayout.rowBoundaries),
      contentHeight: newLayout.rowHeight * newLayout.numberOfRows,
    };

    setLayout(mappedLayout);
  }, []);

  // Observe container size -- computes layout directly (no intermediate state)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    recompute();

    const ro = new ResizeObserver(() => recompute());
    ro.observe(el);
    return () => ro.disconnect();
  }, [recompute]);

  // Recompute when layout inputs change (not resize -- those are handled above)
  useEffect(() => {
    recompute();
  }, [
    duration, estimated_bpm, beats, downbeats, barsPerRow,
    rowHeightMode, fixedRowHeightPx, recompute,
  ]);

  const value = useMemo(() => ({ layout, containerRef }), [layout]);

  return (
    <TapestryLayoutContext.Provider value={value}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  const ctx = useContext(TapestryLayoutContext);
  if (!ctx) {
    throw new Error(
      "useTapestryLayout must be used within a TapestryLayoutProvider"
    );
  }
  return ctx;
}
