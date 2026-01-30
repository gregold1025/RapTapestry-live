import React, { useState } from "react";
import "./HeaderSettingsMenu.css";

// Reuse your existing portal (same one used by drum/bass/vocals)
import ParamsPortal from "../ChannelStripView/ParamWindows/ParamsPortal.jsx";

// New overlay window
import GlobalSettingsOverlay from "./GlobalSettingsOverlay.jsx";

export default function HeaderSettingsMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="header-settings-btn"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Global settings"
      >
        <span className="hs-icon" aria-hidden="true">
          ⚙︎
        </span>
        <span className="hs-text">Settings</span>
      </button>

      {open && (
        <ParamsPortal>
          <GlobalSettingsOverlay onClose={() => setOpen(false)} />
        </ParamsPortal>
      )}
    </>
  );
}
