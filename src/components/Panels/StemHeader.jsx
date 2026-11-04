import React from "react";
import { useStemMix } from "../../contexts/StemMixContext";
import { EyeButton, MuteButton, SoloButton } from "../ui";
import "./Panels.css";

/** Title + subtitle on the left; eye / M / S on the right (shared stem mix). */
export default function StemHeader({ stem, title, subtitle, canHide = true }) {
  const { muted, soloed, visible, toggleMute, toggleSolo, setVisible } = useStemMix();
  return (
    <div className="pn-header">
      <div>
        <h2 className="pn-title">{title}</h2>
        {subtitle ? <p className="pn-subtitle">{subtitle}</p> : null}
      </div>
      <div className="pn-header-actions">
        <EyeButton
          size="lg"
          on={!!visible[stem]}
          onClick={() => canHide && setVisible(stem, !visible[stem])}
          title={canHide ? undefined : "No visual for this stem yet"}
        />
        <MuteButton size="lg" on={!!muted[stem] && !soloed} onClick={() => toggleMute(stem)} />
        <SoloButton size="lg" on={soloed === stem} onClick={() => toggleSolo(stem)} />
      </div>
    </div>
  );
}
