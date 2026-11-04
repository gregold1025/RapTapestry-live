import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import GlobalPanel from "./GlobalPanel";
import VocalsPanel from "./VocalsPanel";
import DrumsPanel from "./DrumsPanel";
import BassPanel from "./BassPanel";
import OtherPanel from "./OtherPanel";

const PANELS = {
  global: GlobalPanel,
  vocals: VocalsPanel,
  drums: DrumsPanel,
  bass: BassPanel,
  other: OtherPanel,
};

/** One panel at a time; null when the sidebar is closed. */
export default function LeftPanel() {
  const { leftPanel } = useUIState();
  const Panel = leftPanel ? PANELS[leftPanel] : null;
  return Panel ? <Panel /> : null;
}
