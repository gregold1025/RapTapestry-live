// src/components/Shell/StemsStrip.jsx
// The global stems panel, in the header: one row per stem with eye / M / S.
// Clicking a stem's name opens that stem's nested panel on the left; the
// Global button opens the shared layout panel. Both close on a second click.
import React from "react";
import { useStemMix } from "../../contexts/StemMixContext";
import { useUIState } from "../../contexts/UIStateContext";
import { EyeButton, MuteButton, SoloButton } from "../ui";

export const STEM_ROWS = [
  { key: "vocals", label: "Vocals", canHide: true },
  { key: "drums", label: "Drums", canHide: true },
  { key: "bass", label: "Bass", canHide: true },
  { key: "other", label: "Other", canHide: false },
];

/** With the audio graph mounted: the strip reads the stem mix. */
export default function StemsStrip({ mix = true }) {
  return mix ? <StripWithMix /> : <Strip stem={null} />;
}

function StripWithMix() {
  const stem = useStemMix();
  return <Strip stem={stem} />;
}

function Strip({ stem }) {
  const { leftPanel, toggleLeftPanel } = useUIState();

  return (
    <div className="rt-stems" role="group" aria-label="Stems">
      <button
        type="button"
        className={`rt-stem-global ${leftPanel === "global" ? "is-active" : ""}`}
        aria-pressed={leftPanel === "global"}
        onClick={() => toggleLeftPanel("global")}
        title={leftPanel === "global" ? "Close the global panel" : "Global: layout and appearance shared by every view"}
      >
        Global
      </button>
      <div className="rt-stem-rows">
        {STEM_ROWS.map((s) => {
          const open = leftPanel === s.key;
          const on = stem ? !!stem.visible[s.key] : true;
          return (
            <div key={s.key} className={`rt-stem-row ${open ? "is-open" : ""}`}>
              <button
                type="button"
                className={`rt-stem-name ${on ? "" : "is-off"}`}
                aria-pressed={open}
                onClick={() => toggleLeftPanel(s.key)}
                title={open ? "Close this panel" : `Open the ${s.label} panel`}
              >
                {s.label}
              </button>
              {stem && (
                <>
                  <EyeButton
                    on={on && s.canHide}
                    onClick={() => s.canHide && stem.setVisible(s.key, !stem.visible[s.key])}
                    title={s.canHide ? undefined : "No visual for this stem yet"}
                  />
                  <MuteButton on={!!stem.muted[s.key] && !stem.soloed} onClick={() => stem.toggleMute(s.key)} />
                  <SoloButton on={stem.soloed === s.key} onClick={() => stem.toggleSolo(s.key)} />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
