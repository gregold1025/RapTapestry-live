// src/components/TapestryView/hooks/useCanvasHoverInfo.js
import { useState, useCallback } from "react";

// Tracks { metadata: {...}, x, y } or null
export function useCanvasHoverInfo() {
  const [hoverInfo, setHoverInfo] = useState(null);

  // Call when the mouse enters a glyph
  const onHoverEnter = useCallback((evt, metadata) => {
    const { clientX: x, clientY: y } = evt;
    setHoverInfo({ metadata, x, y });
  }, []);

  // Call if you want the tooltip to follow the mouse
  const onHoverMove = useCallback((evt) => {
    setHoverInfo((prev) => {
      if (!prev) return null;
      const { clientX: x, clientY: y } = evt;
      return { ...prev, x, y };
    });
  }, []);

  // Call when the mouse leaves
  const onHoverLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  return { hoverInfo, onHoverEnter, onHoverMove, onHoverLeave };
}
