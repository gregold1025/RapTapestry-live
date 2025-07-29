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
  duration,
  estimated_bpm,
  barsPerRow = 8,
}) {
  const containerRef = useRef(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !duration || !estimated_bpm) {
      console.warn("❌ Cannot compute layout yet", {
        container,
        duration,
        estimated_bpm,
      });
      return;
    }

    const { clientWidth, clientHeight } = container;

    const newLayout = computeLayout({
      duration,
      width: clientWidth,
      height: clientHeight,
      estimated_bpm,
      barsPerRow,
    });

    console.log("✅ Layout computed:", newLayout);
    setLayout(newLayout);
  }, [duration, estimated_bpm, barsPerRow]);

  return (
    <TapestryLayoutContext.Provider value={{ layout, containerRef }}>
      {children}
    </TapestryLayoutContext.Provider>
  );
}

export function useTapestryLayout() {
  return useContext(TapestryLayoutContext);
}
