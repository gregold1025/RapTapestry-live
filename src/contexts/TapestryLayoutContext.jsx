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

  // Track measured size of the tapestry container (updates on resize)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Observe container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const read = () =>
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });

    // Initialize immediately
    read();

    const ro = new ResizeObserver(() => read());
    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  // Recompute layout whenever inputs or container size change
  useEffect(() => {
    const container = containerRef.current;

    if (
      !container ||
      !duration ||
      !estimated_bpm ||
      !Array.isArray(beats) ||
      beats.length === 0
    ) {
      return;
    }

    const { width: clientWidth, height: clientHeight } = containerSize;
    if (!clientWidth || !clientHeight) return;

    const newLayout = computeLayout({
      duration,
      width: clientWidth,
      height: clientHeight,
      beats,
      downbeats,
      barsPerRow,
      estimated_bpm,

      // sizing mode controls
      rowHeightMode,
      fixedRowHeightPx,
    });

    if (!newLayout) return;

    const mappedLayout = {
      ...newLayout,

      // helpers derived from layout
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

      // convenience: total content height in px for scrollable wrapper sizing
      contentHeight: newLayout.rowHeight * newLayout.numberOfRows,
    };

    setLayout(mappedLayout);
  }, [
    duration,
    estimated_bpm,
    beats,
    downbeats,
    barsPerRow,
    containerSize,
    rowHeightMode,
    fixedRowHeightPx,
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
