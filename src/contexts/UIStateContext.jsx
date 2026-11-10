// src/contexts/UIStateContext.jsx
// The shell's switches: lyrics pane (left) shown or hidden; the right pane
// shows the parameters (Global, or one stem's nested panel) or the Queries
// view; the Line Staff pane (under the tapestry) open or closed, with its own
// bars-in-view.
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { INITIAL_SECTIONS, toggleSection, focusSection } from "./globalSections";
import { UI_KEYS, uiToApply } from "../session/uiKeys";

const UIStateContext = createContext(null);

export const PARAM_PANELS = ["global", "vocals", "drums", "bass", "other"];
export const RIGHT_VIEWS = ["params", "queries"];

export function UIStateProvider({ children, initialRightView = "params", initialParamsPanel = "global" }) {
  const [lyricsOpen, setLyricsOpen] = useState(true);
  const [rightView, setRightView] = useState(initialRightView);
  const [rightOpen, setRightOpen] = useState(true);
  // header icons: the active one closes the pane; the other opens it on that view
  const toggleRightView = useCallback((v) => {
    const same = rightViewRef.current === v;
    setRightOpen((open) => !(open && same));
    setRightView(v);
  }, []);
  const [paramsPanel, setParamsPanel] = useState(initialParamsPanel);
  const [staffOpen, setStaffOpen] = useState(false);
  const [staffBars, setStaffBars] = useState(4);
  const [staffMode, setStaffMode] = useState("words"); // "words" | "spelled" | "syllables"
  const [clockOpen, setClockOpen] = useState(false);   // the Rhyme Clock overlay
  const [clockFull, setClockFull] = useState(false);   // the clock at full size over the stage
  const [matchGroupBy, setMatchGroupBy] = useState("time");   // the focused query's matches: "time" | "type"
  // Global's collapsible submenus (tapestry, Line Staff, Rhyme Clock); focus = the last one a
  // pane's settings button asked for, with a counter so the panel scrolls to it every time
  const [globalSections, setGlobalSections] = useState(INITIAL_SECTIONS);
  const [globalFocus, setGlobalFocus] = useState(null);
  const toggleGlobalSection = useCallback((k) => setGlobalSections((s) => toggleSection(s, k)), []);

  const rightViewRef = useRef(rightView);
  rightViewRef.current = rightView;
  const toggleLyrics = useCallback(() => setLyricsOpen((v) => !v), []);
  const toggleStaff = useCallback(() => setStaffOpen((v) => !v), []);
  const toggleClock = useCallback(() => setClockOpen((v) => !v), []);
  // Opening a stem's panel also brings the parameters view forward.
  // `section` (Global only): open that submenu, fold the other two, scroll to it.
  const openParamsPanel = useCallback((p, section) => {
    setParamsPanel(p); setRightView("params"); setRightOpen(true);
    if (section) { setGlobalSections((s) => focusSection(s, section)); setGlobalFocus((f) => ({ key: section, n: (f?.n ?? 0) + 1 })); }
  }, []);
  // A click that makes or opens a query brings the Queries view forward.
  const openQueries = useCallback(() => { setRightView("queries"); setRightOpen(true); }, []);

  // Sessions (Greg 2026-11-09): the view's keys, the defaults being the first render's.
  const current = { lyricsOpen, rightOpen, rightView, paramsPanel, staffOpen, staffBars, staffMode, clockOpen, clockFull, globalSections, matchGroupBy };
  const currentRef = useRef(current);
  currentRef.current = current;
  const defaultsRef = useRef(null);
  if (!defaultsRef.current) defaultsRef.current = current;
  const setters = { setLyricsOpen, setRightOpen, setRightView, setParamsPanel, setStaffOpen, setStaffBars, setStaffMode, setClockOpen, setClockFull, setGlobalSections, setMatchGroupBy };
  const getUISnapshot = useCallback(() => Object.fromEntries(UI_KEYS.map((k) => [k, currentRef.current[k]])), []);
  const applyUISnapshot = useCallback((snapshot) => {
    const next = uiToApply(snapshot, defaultsRef.current);
    for (const k of UI_KEYS) setters[`set${k[0].toUpperCase()}${k.slice(1)}`](next[k]);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- state setters are stable

  const value = useMemo(
    () => ({ lyricsOpen, setLyricsOpen, toggleLyrics, rightView, setRightView, rightOpen, setRightOpen, toggleRightView, paramsPanel, setParamsPanel, openParamsPanel, openQueries, staffOpen, setStaffOpen, toggleStaff, staffBars, setStaffBars, staffMode, setStaffMode, clockOpen, setClockOpen, toggleClock, clockFull, setClockFull, globalSections, setGlobalSections, toggleGlobalSection, globalFocus, matchGroupBy, setMatchGroupBy, getUISnapshot, applyUISnapshot }),
    [lyricsOpen, toggleLyrics, rightView, rightOpen, toggleRightView, paramsPanel, openParamsPanel, openQueries, staffOpen, toggleStaff, staffBars, staffMode, clockOpen, toggleClock, clockFull, globalSections, toggleGlobalSection, globalFocus, matchGroupBy, getUISnapshot, applyUISnapshot]
  );
  return <UIStateContext.Provider value={value}>{children}</UIStateContext.Provider>;
}

export function useUIState() {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error("useUIState must be used within a UIStateProvider");
  return ctx;
}
