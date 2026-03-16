import React, { useState } from "react";
import "./LyricPresets.css";
import { useParams } from "../../contexts/ParamsContext";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { ALLITERATION_TIERS, getThreshold, primaryVowel, decomposeSyllable } from "../../utils/phonemeSimilarity.js";
import { VowelMatchList, ConsonantMatchList } from "../PhonemeMatchList/PhonemeMatchList.jsx";

// ── Helpers ──────────────────────────────────────────────────────────────────

const DIST_MAX = 20;

function distToSlider(d) { return d >= 999 ? DIST_MAX : Math.min(d, DIST_MAX); }
function sliderToDist(v) { return v >= DIST_MAX ? 999 : v; }
function distLabel(v) { return v >= DIST_MAX ? "All" : `\u00b1${v} lines`; }

// ── Sub-components ───────────────────────────────────────────────────────────

function PctSlider({ label, value, onChange, loose, strict }) {
  return (
    <label className="lp-control">
      <div className="lp-row">
        <span>{label}</span>
      </div>
      <input
        type="range" min={0} max={1} step={0.05}
        value={value} onChange={(e) => onChange(+e.target.value)}
      />
      <div className="lp-hints"><span>{loose}</span><span>{strict}</span></div>
    </label>
  );
}

function DistSlider({ value, onChange }) {
  const sv = distToSlider(value);
  return (
    <label className="lp-control">
      <div className="lp-row">
        <span>Search Distance</span>
        <span className="lp-value">{distLabel(sv)}</span>
      </div>
      <input
        type="range" min={1} max={DIST_MAX} step={1}
        value={sv} onChange={(e) => onChange(sliderToDist(+e.target.value))}
      />
      <div className="lp-hints"><span>1 line</span><span>All</span></div>
    </label>
  );
}

function Toggle({ checked, onChange, children }) {
  return (
    <label className="lp-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function LyricPresets() {
  const {
    showRhymes,             setShowRhymes,
    rhymeStrictness,        setRhymeStrictness,
    rhymeSearchDistance,    setRhymeSearchDistance,
    exactMatches,           setExactMatches,
    showEndRhymes,          setShowEndRhymes,

    alliterationTier,            setAlliterationTier,
    alliterationSearchDistance,  setAlliterationSearchDistance,

    showAssonance,          setShowAssonance,
    assonanceStrictness,    setAssonanceStrictness,
    assonanceSearchDistance, setAssonanceSearchDistance,

    syllableStrictness,     setSyllableStrictness,
    wildcardSkips,          setWildcardSkips,
    minMatchLen,            setMinMatchLen,

    wordActiveColor,
  } = useParams();

  const { latestAnchorPhones } = useWordSelection();

  const [openPanel, setOpenPanel] = useState(null);

  function togglePanel(key) {
    setOpenPanel((prev) => (prev === key ? null : key));
  }

  const TIER_CYCLE = ["off", "near", "exact"];
  function cycleAllit() {
    const idx = TIER_CYCLE.indexOf(alliterationTier);
    setAlliterationTier(TIER_CYCLE[(idx + 1) % TIER_CYCLE.length]);
  }

  const allitActive = alliterationTier !== "off";

  // Derive anchor phonemes from the most recent active word selection
  const anchorVowel    = latestAnchorPhones ? primaryVowel(latestAnchorPhones) : null;
  const anchorOnset    = latestAnchorPhones ? decomposeSyllable(latestAnchorPhones).onset[0] ?? null : null;

  const BUTTONS = [
    {
      key: "rhyme",
      label: "Rhyme",
      active: showRhymes,
      onToggle: () => setShowRhymes(!showRhymes),
    },
    {
      key: "alliteration",
      label: allitActive ? `Allit. (${alliterationTier})` : "Alliteration",
      active: allitActive,
      onToggle: cycleAllit,
    },
    {
      key: "assonance",
      label: "Assonance",
      active: showAssonance,
      onToggle: () => setShowAssonance(!showAssonance),
    },
    {
      key: "syllables",
      label: "Syllables",
      active: false,
      onToggle: () => togglePanel("syllables"),
    },
  ];

  const subPanels = {
    rhyme: (
      <div className="lp-submenu-content">
        <PctSlider
          label="Strictness" value={rhymeStrictness} onChange={setRhymeStrictness}
          loose="Slant rhymes" strict="Near-perfect"
        />
        <DistSlider value={rhymeSearchDistance} onChange={setRhymeSearchDistance} />
        <div className="lp-toggles">
          <Toggle checked={showEndRhymes} onChange={setShowEndRhymes}>End Rhymes</Toggle>
          <Toggle checked={exactMatches} onChange={setExactMatches}>Exact Match</Toggle>
        </div>
        <VowelMatchList
          anchorPhoneme={anchorVowel}
          threshold={getThreshold(rhymeStrictness, "rhyme")}
          showInfo
        />
      </div>
    ),

    alliteration: (
      <div className="lp-submenu-content">
        <div className="lp-tier-row">
          {Object.entries(ALLITERATION_TIERS).map(([key, tier]) => (
            <button
              key={key} type="button"
              className={`lp-tier-btn ${alliterationTier === key ? "is-active" : ""}`}
              onClick={() => setAlliterationTier(key)}
            >
              {tier.label}
            </button>
          ))}
        </div>
        {allitActive && (
          <div className="lp-tier-desc">
            <strong>{ALLITERATION_TIERS[alliterationTier].label}:</strong>{" "}
            {ALLITERATION_TIERS[alliterationTier].description}
            {ALLITERATION_TIERS[alliterationTier].examples.length > 0 && (
              <div className="lp-tier-examples">
                {ALLITERATION_TIERS[alliterationTier].examples.join("  \u00b7  ")}
              </div>
            )}
          </div>
        )}
        <DistSlider value={alliterationSearchDistance} onChange={setAlliterationSearchDistance} />
        {allitActive && (
          <ConsonantMatchList
            anchorPhoneme={anchorOnset}
            threshold={ALLITERATION_TIERS[alliterationTier].threshold ?? 1}
            showInfo
          />
        )}
      </div>
    ),

    assonance: (
      <div className="lp-submenu-content">
        <PctSlider
          label="Strictness" value={assonanceStrictness} onChange={setAssonanceStrictness}
          loose="Near vowels" strict="Same vowel class"
        />
        <DistSlider value={assonanceSearchDistance} onChange={setAssonanceSearchDistance} />
        <VowelMatchList
          anchorPhoneme={anchorVowel}
          threshold={getThreshold(assonanceStrictness, "assonance")}
          showInfo
        />
      </div>
    ),

    syllables: (
      <div className="lp-submenu-content">
        <p className="lp-desc">
          Click a syllable to set the start of a range, click another to complete it.
          Matching vowel sequences are highlighted across the song.
        </p>
        <PctSlider
          label="Match Sensitivity" value={syllableStrictness} onChange={setSyllableStrictness}
          loose="Near vowels" strict="Exact vowels"
        />
        <label className="lp-control">
          <div className="lp-row">
            <span>Max Wildcard Skips</span>
            <span className="lp-value">{wildcardSkips}</span>
          </div>
          <input
            type="range" min={0} max={3} step={1}
            value={wildcardSkips} onChange={(e) => setWildcardSkips(+e.target.value)}
          />
        </label>
        <label className="lp-control">
          <div className="lp-row">
            <span>Min Match Length</span>
            <span className="lp-value">{minMatchLen} syllable{minMatchLen !== 1 ? "s" : ""}</span>
          </div>
          <input
            type="range" min={1} max={4} step={1}
            value={minMatchLen} onChange={(e) => setMinMatchLen(+e.target.value)}
          />
        </label>
      </div>
    ),
  };

  return (
    <div className="preset-panel">
      <div className="preset-btn-row" role="group" aria-label="Lyric highlight presets">
        {BUTTONS.map(({ key, label, active, onToggle }) => (
          <div key={key} className="preset-item">
            <button
              className={`preset-main-btn ${active ? "is-active" : ""}`}
              type="button"
              aria-pressed={active}
              style={{ "--active-color": wordActiveColor }}
              onClick={onToggle}
            >
              {label}
            </button>
            <button
              className={`preset-expand-btn ${openPanel === key ? "is-open" : ""}`}
              type="button"
              onClick={(e) => { e.stopPropagation(); togglePanel(key); }}
              aria-expanded={openPanel === key}
              title="Parameters"
            >
              {openPanel === key ? "\u25b4" : "\u25be"}
            </button>
          </div>
        ))}
      </div>

      {openPanel && (
        <div className="preset-submenu">
          {subPanels[openPanel]}
        </div>
      )}
    </div>
  );
}
