// src/components/ChannelStripView/index.jsx
import React, { useMemo, useState } from "react";
import { useAudioEngine } from "../../contexts/AudioContext";
import { useParams } from "../../contexts/ParamsContext";
import { ChannelStrip } from "./ChannelStrip.jsx";
import { VocalsParamsOverlay } from "./ParamWindows/vocals/VocalsParamsOverlay";
import { BassParamsOverlay } from "./ParamWindows/bass/BassParamsOverlay";
import { DrumsParamsOverlay } from "./ParamWindows/drums/DrumsParamsOverlay";
import ParamsPortal from "./ParamWindows/ParamsPortal.jsx";
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

  // ✅ Header collapse state (mirrors GlyphControls)
  const [collapsed, setCollapsed] = useState(false);

  const [showVisual, setShowVisual] = useState({
    vocals: true,
    bass: true,
    drums: true,
    other: true,
  });

  const [editingStem, setEditingStem] = useState(null);

  // exactly one solo at a time (null = none)
  const [soloedStem, setSoloedStem] = useState(null);

  // user mutes (used when there is no solo)
  const [mutedMap, setMutedMap] = useState({
    vocals: false,
    bass: false,
    drums: false,
    other: false,
  });

  const applyAudioMuteStates = (nextSoloedStem, nextMuted) => {
    const refs = audioRefs.current || {};
    Object.keys(refs).forEach((stem) => {
      const el = refs[stem];
      if (!el) return;
      if (nextSoloedStem) {
        el.muted = stem !== nextSoloedStem;
      } else {
        el.muted = !!nextMuted[stem];
      }
    });
  };

  // --- MUTE handler
  const handleMute = (stemKey, isMuted) => {
    setMutedMap((prev) => {
      const next = { ...prev, [stemKey]: isMuted };

      if (soloedStem) {
        // Count how many forced mutes (excluding soloedStem)
        const otherStems = Object.keys(prev).filter((k) => k !== soloedStem);
        const forcedMuted = otherStems.filter(
          (k) => prev[k] || forcedMuteMap[k]
        );

        // If all other stems are muted (forced or user), and one is unmuted now
        if (forcedMuted.length === otherStems.length && !isMuted) {
          // Solo is deactivated, clicked stem is unmuted, others remain muted
          const newMuted = { ...prev };
          otherStems.forEach((k) => {
            if (k !== stemKey) newMuted[k] = true;
            else newMuted[k] = false;
          });
          newMuted[soloedStem] = false;
          setSoloedStem(null);
          setMutedMap(newMuted);
          applyAudioMuteStates(null, newMuted);
          return newMuted;
        }

        // If solo is active and ANY mute button is clicked, cancel solo
        setSoloedStem(null);
        applyAudioMuteStates(null, next);
        return next;
      }

      applyAudioMuteStates(soloedStem, next);
      return next;
    });
  };

  // --- SOLO handler (exclusive) ---
  const handleSolo = (stemKey, nextIsSolo) => {
    if (!soloedStem && nextIsSolo) {
      // No solo active, solo this stem and mute others
      setSoloedStem(stemKey);
      applyAudioMuteStates(stemKey, mutedMap);
    } else if (soloedStem === stemKey && !nextIsSolo) {
      // Clicking the ACTIVE solo → clear solo and UNMUTE EVERYTHING
      const allFalse = Object.fromEntries(
        Object.keys(mutedMap).map((k) => [k, false])
      );
      setSoloedStem(null);
      setMutedMap(allFalse);
      applyAudioMuteStates(null, allFalse);
    } else if (soloedStem && soloedStem !== stemKey && nextIsSolo) {
      // Transfer solo to new stem, mute others
      setSoloedStem(stemKey);
      applyAudioMuteStates(stemKey, mutedMap);
    }
  };

  const handleVisual = (stemKey, visible) => {
    setShowVisual((v) => ({ ...v, [stemKey]: visible }));
  };

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

  // When solo is active, others are force-muted (for child UI state)
  const forcedMuteMap = useMemo(() => {
    if (!soloedStem) return {};
    return {
      vocals: soloedStem !== "vocals",
      bass: soloedStem !== "bass",
      drums: soloedStem !== "drums",
      other: soloedStem !== "other",
    };
  }, [soloedStem]);

  // Single source of truth for each strip's *effective* mute state
  const effectiveMutedMap = useMemo(() => {
    return {
      vocals: soloedStem ? !!forcedMuteMap.vocals : !!mutedMap.vocals,
      bass: soloedStem ? !!forcedMuteMap.bass : !!mutedMap.bass,
      drums: soloedStem ? !!forcedMuteMap.drums : !!mutedMap.drums,
      other: soloedStem ? !!forcedMuteMap.other : !!mutedMap.other,
    };
  }, [soloedStem, forcedMuteMap, mutedMap]);

  const stems = ["vocals", "bass", "drums", "other"];

  return (
    <div
      className={`track-controls-shell ${collapsed ? "is-collapsed" : ""}`}
      role="region"
      aria-label="Track controls"
    >
      {/* ✅ Header mirrors GlyphControls anatomy */}
      <div
        className="tc-header"
        onClick={() => setCollapsed((v) => !v)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setCollapsed((v) => !v);
          }
        }}
        aria-expanded={!collapsed}
      >
        <div className="tc-header-left">
          <span className="tc-title">Track Controls</span>
          {/* Info icon w/ tooltip (same behavior as GlyphControls) */}
          <span
            className="tc-info"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <span className="tc-info-icon" aria-hidden="true">
              i
            </span>

            <div className="tc-tooltip" role="tooltip">
              <p className="tc-tooltip-text">
                Use these controls to solo/mute stems, toggle their visibility
                on the tapestry, and open per-stem parameter edit windows.
              </p>
            </div>
          </span>
          <span className="tc-chev" aria-hidden="true">
            {collapsed ? "▴" : "▾"}
          </span>
        </div>
      </div>

      {/* Body (existing grid), collapsible */}
      <div className="tc-body">
        <div className="channel-strips-panel">
          {stems.map((stem) => (
            <ChannelStrip
              key={stem}
              stemKey={stem}
              audio={audioRefs.current[stem]}
              // Solo (controlled)
              isSolo={soloedStem === stem}
              onSoloToggle={handleSolo}
              // Mute (controlled visual + audio sync)
              initialMuted={mutedMap[stem]}
              forcedMute={forcedMuteMap[stem]}
              effectiveMuted={effectiveMutedMap[stem]}
              onMuteToggle={handleMute}
              // Visual toggle in tapestry
              initialVisible={showVisual[stem]}
              onVisualToggle={handleVisual}
              onEditClick={handleEdit}
            />
          ))}

          {editingStem === "vocals" && (
            <ParamsPortal>
              <VocalsParamsOverlay onClose={handleCloseOverlay} />
            </ParamsPortal>
          )}
          {editingStem === "bass" && (
            <ParamsPortal>
              <BassParamsOverlay onClose={handleCloseOverlay} />
            </ParamsPortal>
          )}
          {editingStem === "drums" && (
            <ParamsPortal>
              <DrumsParamsOverlay onClose={handleCloseOverlay} />
            </ParamsPortal>
          )}
        </div>
      </div>
    </div>
  );
}
