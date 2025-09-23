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
  beats = [], // <— NEW prop (already passed from App.jsx)
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
      !Array.isArray(beats) ||
      beats.length === 0
    ) {
      console.warn("❌ Cannot compute layout yet", {
        container,
        duration,
        estimated_bpm,
        beatsCount: beats?.length ?? 0,
      });
      return;
    }

    const { clientWidth, clientHeight } = container;

    const newLayout = computeLayout({
      duration,
      width: clientWidth,
      height: clientHeight,
      beats, // use beats as the primary grid
      downbeats, // kept for reference if you still want to show them somewhere
      barsPerRow,
      estimated_bpm,
      // timeSig optional; defaults to 4/4 inside computeLayout
    });

    if (!newLayout) return;

    const mappedLayout = {
      ...newLayout,
      timeToPixels: (t) =>
        timeToPixels(
          t,
          newLayout.rowBoundaries,
          newLayout.gridTimes, // <— use inferred beats grid
          newLayout.width,
          newLayout.rowHeight,
          newLayout.beatsPerRow // <— segments per row = beats per row
        ),
      getRowIndex: (t) => getRowIndex(t, newLayout.rowBoundaries),
    };

    setLayout(mappedLayout);
  }, [duration, estimated_bpm, beats, downbeats, barsPerRow]);

  return (
    <TapestryLayoutContext.Provider value={{ layout, containerRef }}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  return useContext(TapestryLayoutContext);
}
