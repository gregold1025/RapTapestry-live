// src/contexts/UIStateContext.jsx
// Header selectors: which left panel is open (one at a time, or none) and
// which right view is shown (always exactly one).
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const UIStateContext = createContext(null);

export const LEFT_PANELS = ["global", "vocals", "drums", "bass", "other"];
export const RIGHT_VIEWS = ["lyrics", "queries", "query"];

export function UIStateProvider({ children, initialLeftPanel = "vocals", initialRightView = "lyrics" }) {
  const [leftPanel, setLeftPanel] = useState(initialLeftPanel);
  const [rightView, setRightView] = useState(initialRightView);

  // Clicking the active panel button again closes the left sidebar.
  const toggleLeftPanel = useCallback((p) => {
    setLeftPanel((cur) => (cur === p ? null : p));
  }, []);

  const value = useMemo(
    () => ({ leftPanel, setLeftPanel, toggleLeftPanel, rightView, setRightView }),
    [leftPanel, toggleLeftPanel, rightView]
  );
  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error("useUIState must be used within a UIStateProvider");
  return ctx;
}
