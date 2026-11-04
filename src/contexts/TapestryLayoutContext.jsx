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
import { timeToPixels, getRowIndex, xToTime, pointToTime } from "../utils/timeUtils";
import { computeLanes } from "../utils/laneLayout";
import { useParams } from "./ParamsContext";

const TapestryLayoutContext = createContext(null);

export function TapestryLayoutProvider({
  children,
  duration,
  estimated_bpm,
  downbeats = [],
  beats = [],
  barsPerRow: barsPerRowOverride,
  // "wrap" | "scroll"; the Line Staff pane passes "scroll"
  timeLayout: timeLayoutOverride,

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
    barsPerRow: barsPerRowFromParams,
    timeLayout,
    stemsLayout,
    showVocals,
    showDrums,
    showBass,
  } = useParams();

  // Decide final values: override props > params > defaults
  const rowHeightMode =
    rowHeightModeOverride ?? rowHeightModeFromParams ?? "fit";
  const fixedRowHeightPx =
    fixedRowHeightPxOverride ?? fixedRowHeightPxFromParams ?? 140;
  const barsPerRow = barsPerRowOverride ?? barsPerRowFromParams ?? 8;

  // Stem lanes inside a row (fractions of rowHeight); see utils/laneLayout.
  const lanes = useMemo(
    () => computeLanes({ stemsLayout, visible: { drums: showDrums, vocals: showVocals, bass: showBass } }),
    [stemsLayout, showDrums, showVocals, showBass]
  );

  // Keep layout inputs in a ref so the ResizeObserver callback always
  // sees current values without needing to re-subscribe on every change.
  const scroll = (timeLayoutOverride ?? timeLayout) === "scroll";
  const inputsRef = useRef({
    duration, estimated_bpm, beats, downbeats, barsPerRow,
    rowHeightMode, fixedRowHeightPx, scroll,
  });
  inputsRef.current = {
    duration, estimated_bpm, beats, downbeats, barsPerRow,
    rowHeightMode, fixedRowHeightPx, scroll,
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
      barsPerRow: bpr, rowHeightMode: rhm, fixedRowHeightPx: frhp, scroll: scr,
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
      // Scroll time layout (ported from the Line Staff): one row as wide as
      // the song, `barsPerRow` bars visible in the container at a time.
      singleRow: scr,
      pxPerBar: clientWidth / bpr,
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
      // content x -> time (single row only; wrap rows need the row too)
      xToTime: (x) => xToTime(x, newLayout.gridTimes, newLayout.columnWidth),
      pointToTime: (x, y) => pointToTime(x, y, newLayout),
      contentHeight: newLayout.rowHeight * newLayout.numberOfRows,
      viewWidth: clientWidth,
      viewHeight: clientHeight,
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
    rowHeightMode, fixedRowHeightPx, scroll, recompute,
  ]);

  const laneFor = React.useCallback((stem) => lanes[stem] ?? { top: 0, height: 1 }, [lanes]);
  const value = useMemo(() => ({ layout, containerRef, lanes, laneFor }), [layout, lanes, laneFor]);

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
