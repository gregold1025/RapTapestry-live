// src/components/ParamsOverlays/ParamsPortal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ParamsPortal({ children }) {
  const hostRef = useRef(null);
  if (!hostRef.current) hostRef.current = document.createElement("div");

  useEffect(() => {
    const host = hostRef.current;

    // Style the host so it's ALWAYS the real viewport, not a panel
    host.id = "params-overlay-root";
    host.style.position = "fixed";
    host.style.inset = "0"; // top/right/bottom/left: 0
    host.style.zIndex = "2147483647"; // above everything
    host.style.pointerEvents = "none"; // host ignores clicks…
    // the child overlay will re-enable pointerEvents
    // (see CSS below)

    // Mount at end of <body>
    document.body.appendChild(host);
    return () => {
      try {
        document.body.removeChild(host);
      } catch {}
    };
  }, []);

  return createPortal(children, hostRef.current);
}
