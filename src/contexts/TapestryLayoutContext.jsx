// src/contexts/TapestryLayoutContext.jsx
import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { computeLayout } from "../utils/computeLayout";
import { timeToPixels, getRowIndex } from "../utils/timeUtils";

const TapestryLayoutContext = createContext();

export function TapestryLayoutProvider({
  children,
  duration,
  estimated_bpm,
  downbeats = [],
  beats = [],
  barsPerRow = 8,
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  // Track the measured size of the tapestry container (updates on resize)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Observe container size changes
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initialize immediately
    setContainerSize({ width: el.clientWidth, height: el.clientHeight });

    const ro = new ResizeObserver(() => {
      // clientWidth/Height are sufficient and cheap here
      setContainerSize({ width: el.clientWidth, height: el.clientHeight });
    });

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
      // Early exit until we have the minimum data
      // console.warn("❌ Cannot compute layout yet", { container, duration, estimated_bpm, beatsCount: beats?.length ?? 0 });
      return;
    }

    const { width: clientWidth, height: clientHeight } = containerSize;
    if (!clientWidth || !clientHeight) return; // wait for measurement

    const newLayout = computeLayout({
      duration,
      width: clientWidth,
      height: clientHeight,
      beats, // use beats as the primary grid
      downbeats, // optional reference
      barsPerRow,
      estimated_bpm,
      // timeSig optional; defaults within computeLayout
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
    };

    setLayout(mappedLayout);
  }, [
    duration,
    estimated_bpm,
    beats,
    downbeats,
    barsPerRow,
    containerSize, // <- key: recompute when container resizes
  ]);

  return (
    <TapestryLayoutContext.Provider value={{ layout, containerRef }}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  return useContext(TapestryLayoutContext);
}
