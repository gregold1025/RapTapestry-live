// src/components/ParamsOverlays/ParamsPortal.jsx
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export default function ParamsPortal({ children }) {
  const hostRef = useRef(null);
  if (!hostRef.current) hostRef.current = document.createElement("div");

  useEffect(() => {
    const host = hostRef.current;
    host.id = "params-overlay-root";
    host.style.position = "fixed";
    host.style.inset = "0";
    host.style.zIndex = "2147483647"; // very high, above app chrome
    // IMPORTANT: do NOT set pointer-events here
    document.body.appendChild(host);
    return () => {
      try {
        document.body.removeChild(host);
      } catch {}
    };
  }, []);

  return createPortal(children, hostRef.current);
}
