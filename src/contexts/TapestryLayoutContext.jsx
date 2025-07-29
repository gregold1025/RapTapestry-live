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
  barsPerRow = 8,
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (
      !container ||
      !duration ||
      !estimated_bpm ||
      !Array.isArray(downbeats) ||
      downbeats.length === 0
    ) {
      console.warn("❌ Cannot compute layout yet", {
        container,
        duration,
        estimated_bpm,
        downbeatsCount: downbeats?.length ?? 0,
      });
      return;
    }

    const { clientWidth, clientHeight } = container;

    const newLayout = computeLayout({
      duration,
      width: clientWidth,
      height: clientHeight,
      downbeats,
      barsPerRow,
    });

    // Attach utilities
    const mappedLayout = {
      ...newLayout,
      timeToPixels: (t) =>
        timeToPixels(
          t,
          newLayout.rowBoundaries,
          downbeats,
          newLayout.width,
          newLayout.rowHeight,
          barsPerRow
        ),
      getRowIndex: (t) => getRowIndex(t, newLayout.rowBoundaries),
      downbeats, // make available for grid/glyph components
    };

    setLayout(mappedLayout);
  }, [duration, estimated_bpm, downbeats, barsPerRow]);

  return (
    <TapestryLayoutContext.Provider value={{ layout, containerRef }}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  return useContext(TapestryLayoutContext);
}
