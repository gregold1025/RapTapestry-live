// src/contexts/UIStateContext.jsx
// The shell's switches: lyrics pane (left) shown or hidden; the right pane
// shows the parameters (Global, or one stem's nested panel) or the Queries
// view; the Line Staff pane (under the tapestry) open or closed, with its own
// bars-in-view.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const UIStateContext = createContext(null);

export const PARAM_PANELS = ["global", "vocals", "drums", "bass", "other"];
export const RIGHT_VIEWS = ["params", "queries"];

export function UIStateProvider({ children, initialRightView = "params", initialParamsPanel = "global" }) {
  const [lyricsOpen, setLyricsOpen] = useState(true);
  const [rightView, setRightView] = useState(initialRightView);
  const [rightOpen, setRightOpen] = useState(true);
  // header icons: the active one closes the pane; the other opens it on that view
  const toggleRightView = useCallback((v) => {
    setRightOpen((open) => !(open && rightViewRef.current === v));
    setRightView(v);
  }, []);
  const [paramsPanel, setParamsPanel] = useState(initialParamsPanel);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffBars, setStaffBars] = useState(4);
  const [staffMode, setStaffMode] = useState("words"); // "words" | "spelled" | "syllables"

  const rightViewRef = useRef(rightView);
  rightViewRef.current = rightView;
  const toggleLyrics = useCallback(() => setLyricsOpen((v) => !v), []);
  const toggleStaff = useCallback(() => setStaffOpen((v) => !v), []);
  // Opening a stem's panel also brings the parameters view forward.
  const openParamsPanel = useCallback((p) => { setParamsPanel(p); setRightView("params"); setRightOpen(true); }, []);

  const value = useMemo(
    () => ({ lyricsOpen, setLyricsOpen, toggleLyrics, rightView, setRightView, rightOpen, setRightOpen, toggleRightView, paramsPanel, setParamsPanel, openParamsPanel, staffOpen, setStaffOpen, toggleStaff, staffBars, setStaffBars, staffMode, setStaffMode }),
    [lyricsOpen, toggleLyrics, rightView, rightOpen, toggleRightView, paramsPanel, openParamsPanel, staffOpen, toggleStaff, staffBars, staffMode]
  );
  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error("useUIState must be used within a UIStateProvider");
  return ctx;
}
