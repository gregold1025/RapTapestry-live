// File: src/components/ChannelStrips/ChannelStripsPanel.jsx

import React, { useState } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { useParams } from "../../contexts/ParamsContext";
import { ChannelStrip } from "./ChannelStrip.jsx";
import { VocalsParamsOverlay } from "./ParamWindows/vocals/VocalsParamsOverlay";

import { BassParamsOverlay } from "./ParamWindows/bass/BassParamsOverlay";
import "./ChannelStrip.css";

export default function ChannelStripsPanel({ onEditClick }) {
  const { audioRefs } = useAudioEngine();
  const {
    wildcardSkips,
    minMatchLen,
    vowelColors,
    setWildcardSkips,
    setMinMatchLen,
    setVowelColors,
  } = useParams();

  const [showVisual, setShowVisual] = useState({
    vocals: true,
    bass: true,
    drums: true,
    other: true,
  });

  // which stem’s params window is open
  const [editingStem, setEditingStem] = useState(null);

  const [bassParams, setBassParams] = useState({
    rectHeight: 10,
    fillColor: "#aaccff",
    opacity: 0.7,
  });

  const handleSaveBassParams = ({ rectHeight, fillColor, opacity }) => {
    setBassParams({ rectHeight, fillColor, opacity });
    setEditingStem(null);
  };

  const handleMute = (stemKey, isMuted) =>
    (audioRefs.current[stemKey].muted = isMuted);
  const handleVisual = (stemKey, visible) =>
    setShowVisual((v) => ({ ...v, [stemKey]: visible }));
  const handleEdit = (stemKey) => {
    setEditingStem(stemKey);
    onEditClick?.(stemKey);
  };

  const handleCloseOverlay = () => setEditingStem(null);

  const handleSaveParams = ({ wildcard, minMatch, colors }) => {
    setWildcardSkips(wildcard);
    setMinMatchLen(minMatch);
    setVowelColors(colors);
    setEditingStem(null);
  };

  return (
    <div className="channel-strips-panel">
      {["vocals", "bass", "drums", "other"].map((stem) => (
        <ChannelStrip
          key={stem}
          stemKey={stem}
          audio={audioRefs.current[stem]}
          initialVisible={showVisual[stem]}
          onMuteToggle={handleMute}
          onVisualToggle={handleVisual}
          onEditClick={handleEdit}
        />
      ))}

      {editingStem === "vocals" && (
        <VocalsParamsOverlay
          initialWildcard={wildcardSkips}
          initialMinMatch={minMatchLen}
          initialColors={vowelColors}
          onSave={handleSaveParams}
          onClose={handleCloseOverlay}
        />
      )}
      {editingStem === "bass" && (
        <BassParamsOverlay
          initialHeight={bassParams.rectHeight}
          initialColor={bassParams.fillColor}
          initialOpacity={bassParams.opacity}
          onSave={handleSaveBassParams}
          onClose={handleCloseOverlay}
        />
      )}
    </div>
  );
}
