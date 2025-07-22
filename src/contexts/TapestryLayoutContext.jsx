// src/contexts/TapestryLayoutContext.jsx

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { computeLayout } from "../utils/computeLayout";

const TapestryLayoutContext = createContext();

export function TapestryLayoutProvider({
  children,
  transcriptionData,
  estimated_bpm = 103,
  barsPerRow = 8,
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container || !transcriptionData?.lines?.length) {
      console.warn("❌ Cannot compute layout yet", {
        container,
        transcriptionData,
      });
      return;
    }

    const { clientWidth, clientHeight } = container;

    const newLayout = computeLayout({
      transcriptionData,
      width: clientWidth,
      height: clientHeight,
      estimated_bpm,
      barsPerRow,
    });

    console.log("✅ One-time layout computed:", newLayout);
    setLayout(newLayout);
  }, [transcriptionData, estimated_bpm, barsPerRow]);

  return (
    <TapestryLayoutContext.Provider value={{ layout, containerRef }}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  return useContext(TapestryLayoutContext);
}
