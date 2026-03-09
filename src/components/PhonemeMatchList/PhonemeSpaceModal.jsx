// src/components/PhonemeMatchList/PhonemeSpaceModal.jsx
//
// Modal overlays showing the static phoneme proximity spaces:
//   VowelSpaceModal     — 2D F1/F2 Bark-scale vowel plot
//   ConsonantTableModal — consonants grouped by manner of articulation
//
// Triggered from the PhonemeMatchList info button in LyricPresets.

import React, { useEffect } from "react";
import { VOWEL_COORDS } from "../../utils/phonemeSimilarity.js";
import "./PhonemeSpaceModal.css";

// ── Vowel Space SVG ───────────────────────────────────────────────────────────

function VowelSpaceSVG() {
  const W = 280, H = 220, PAD = 28;
  const plotW = W - PAD * 2;
  const plotH = H - PAD * 2;

  const vowels = Object.entries(VOWEL_COORDS);

  return (
    <svg width={W} height={H} className="psm-svg" role="img" aria-label="Vowel proximity space">
      {/* Axis labels */}
      <text x={W / 2} y={PAD - 10} className="psm-axis-label" textAnchor="middle">front (F2)</text>
      <text x={PAD - 10} y={H / 2} className="psm-axis-label" textAnchor="middle"
        transform={`rotate(-90, ${PAD - 10}, ${H / 2})`}>open (F1)</text>

      {/* Corner labels */}
      <text x={PAD} y={PAD - 2} className="psm-corner" textAnchor="middle">close</text>
      <text x={PAD} y={H - PAD + 14} className="psm-corner" textAnchor="middle">open</text>
      <text x={W - PAD} y={PAD - 2} className="psm-corner" textAnchor="end">front</text>
      <text x={W - PAD} y={H - PAD + 14} className="psm-corner" textAnchor="end">back</text>

      {/* Vowels */}
      {vowels.map(([v, { x, y }]) => {
        // x: 0=back, 1=front → right = front; y: 0=open, 1=close → up = close
        const cx = PAD + x * plotW;
        const cy = PAD + (1 - y) * plotH;
        return (
          <g key={v}>
            <circle cx={cx} cy={cy} r={12} className="psm-vowel-circle" />
            <text x={cx} y={cy + 4} className="psm-vowel-label" textAnchor="middle">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Consonant Table ───────────────────────────────────────────────────────────

const CONSONANT_GROUPS = [
  { manner: "Stop",        consonants: ["P", "B", "T", "D", "K", "G"] },
  { manner: "Fricative",   consonants: ["F", "V", "TH", "DH", "S", "Z", "SH", "ZH", "HH"] },
  { manner: "Affricate",   consonants: ["CH", "JH"] },
  { manner: "Nasal",       consonants: ["M", "N", "NG"] },
  { manner: "Liquid",      consonants: ["L", "R"] },
  { manner: "Glide",       consonants: ["W", "Y"] },
];

function ConsonantTable() {
  return (
    <div className="psm-cons-table">
      {CONSONANT_GROUPS.map(({ manner, consonants }) => (
        <div key={manner} className="psm-cons-row">
          <span className="psm-cons-manner">{manner}</span>
          <div className="psm-cons-phones">
            {consonants.map((c) => (
              <span key={c} className="psm-cons-chip">{c}</span>
            ))}
          </div>
        </div>
      ))}
      <p className="psm-cons-note">
        Near-alliteration pairs share 5 of 6 features (place, manner, voicing, nasality, laterality, sibilancy).
        Exact pairs share all 6.
      </p>
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, description, onClose, children }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="psm-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="psm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="psm-header">
          <span className="psm-title">{title}</span>
          <button className="psm-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <p className="psm-desc">{description}</p>
        {children}
      </div>
    </div>
  );
}

// ── Public exports ────────────────────────────────────────────────────────────

export function VowelSpaceModal({ onClose }) {
  return (
    <Modal
      title="Vowel Proximity Space"
      description={
        "Vowels positioned by acoustic proximity — F1 (jaw height, vertical) " +
        "and F2 (tongue frontness, horizontal) in Bark scale. " +
        "Assonance and rhyme matching compares the primary stressed vowel of each word. " +
        "Vowels closer together in this space are more likely to be perceived as similar."
      }
      onClose={onClose}
    >
      <VowelSpaceSVG />
    </Modal>
  );
}

export function ConsonantSpaceModal({ onClose }) {
  return (
    <Modal
      title="Consonant Feature Space"
      description={
        "Consonants grouped by manner of articulation. " +
        "Alliteration matching compares the onset (first) consonant of each word " +
        "across six phonological features. Near-tier pairs differ by exactly one feature, " +
        "capturing voiced/unvoiced pairs (P/B, T/D, K/G, F/V, S/Z) and sibilance chains (S/SH/Z)."
      }
      onClose={onClose}
    >
      <ConsonantTable />
    </Modal>
  );
}
