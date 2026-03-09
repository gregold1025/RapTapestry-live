// src/components/PhonemeMatchList/PhonemeSpaceModal.jsx
//
// Modal overlays showing phoneme reference diagrams.
//   RhymeStrictnessModal  — full rhyme formula: nucleus (60%) + coda (40%)
//   VowelSpaceModal       — vowel F1/F2 proximity space (used for assonance)
//   ConsonantSpaceModal   — consonant feature groups (used for alliteration)

import React, { useEffect } from "react";
import { VOWEL_COORDS } from "../../utils/phonemeSimilarity.js";
import "./PhonemeSpaceModal.css";

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ title, description, onClose, wide, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="psm-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className={`psm-panel ${wide ? "psm-panel--wide" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="psm-header">
          <span className="psm-title">{title}</span>
          <button className="psm-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        {description && <p className="psm-desc">{description}</p>}
        {children}
      </div>
    </div>
  );
}

// ── Vowel Space SVG ───────────────────────────────────────────────────────────

function VowelSpaceSVG({ width = 400, height = 320, pad = 36 }) {
  const plotW = width - pad * 2;
  const plotH = height - pad * 2;
  const vowels = Object.entries(VOWEL_COORDS);

  return (
    <svg width={width} height={height} className="psm-svg" role="img" aria-label="Vowel proximity space">
      {/* Axis labels */}
      <text x={width / 2} y={pad - 12} className="psm-axis-label" textAnchor="middle">← back · · F2 · · front →</text>
      <text x={pad - 14} y={height / 2} className="psm-axis-label" textAnchor="middle"
        transform={`rotate(-90, ${pad - 14}, ${height / 2})`}>← open · · F1 · · close →</text>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((t) => (
        <g key={t}>
          <line x1={pad + t * plotW} y1={pad} x2={pad + t * plotW} y2={pad + plotH}
            stroke="#1a2535" strokeWidth="1" />
          <line x1={pad} y1={pad + t * plotH} x2={pad + plotW} y2={pad + t * plotH}
            stroke="#1a2535" strokeWidth="1" />
        </g>
      ))}

      {/* Vowels */}
      {vowels.map(([v, { x, y }]) => {
        const cx = pad + x * plotW;
        const cy = pad + (1 - y) * plotH;
        return (
          <g key={v}>
            <circle cx={cx} cy={cy} r={16} className="psm-vowel-circle" />
            <text x={cx} y={cy + 4} className="psm-vowel-label" textAnchor="middle">{v}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Coda consonant reference table ───────────────────────────────────────────

function CodaTable() {
  const rows = [
    { a: "— (open)", b: "— (open)", sim: "1.00", example: "go / show" },
    { a: "— (open)", b: "D (closed)", sim: "0.30", example: "go / gold" },
    { a: "T", b: "T", sim: "1.00", example: "cat / bat" },
    { a: "T", b: "D", sim: "0.83", example: "cat / bad" },
    { a: "M", b: "Z", sim: "0.33", example: "rhyme / rhymes ★", highlight: true },
  ];

  return (
    <div className="psm-coda-section">
      <p className="psm-section-note">
        Only the <em>final</em> consonant is compared. Open syllables score 1.0 against each other; 0.3 against any closed syllable.
      </p>
      <table className="psm-coda-table">
        <thead>
          <tr>
            <th>Coda A</th>
            <th>Coda B</th>
            <th>Sim.</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={r.highlight ? "psm-row-highlight" : ""}>
              <td className="psm-coda-cell">{r.a}</td>
              <td className="psm-coda-cell">{r.b}</td>
              <td className="psm-coda-sim">{r.sim}</td>
              <td className="psm-coda-eg">{r.example}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="psm-plural-note">
        <span className="psm-plural-star">★</span>
        <span>
          "rhyme" vs "rhymes": identical vowel (60% × 1.00) + M vs Z coda (40% × 0.33) = <strong>score 0.73</strong>.
          Clears <em>loose</em> (≥ 0.70) but not <em>strict</em> (≥ 0.97).
        </span>
      </div>
    </div>
  );
}

// ── Consonant Table (for alliteration) ───────────────────────────────────────

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

// ── Public exports ────────────────────────────────────────────────────────────

export function RhymeStrictnessModal({ onClose }) {
  return (
    <Modal title="Rhyme Strictness" onClose={onClose} wide>
      <p className="psm-desc">
        Rhyme score = <strong>60% vowel nucleus</strong> + <strong>40% coda consonant</strong>.
        Loose threshold ≥ 0.70 · Strict threshold ≥ 0.97.
      </p>
      <div className="psm-two-col">
        <div className="psm-col">
          <div className="psm-section-heading">Vowel Nucleus — 60%</div>
          <p className="psm-section-note">
            Proximity in F1/F2 acoustic space (Bark-scaled). Higher strictness requires vowels nearer the anchor.
          </p>
          <VowelSpaceSVG width={360} height={290} pad={34} />
        </div>
        <div className="psm-col">
          <div className="psm-section-heading">Coda Consonant — 40%</div>
          <CodaTable />
        </div>
      </div>
    </Modal>
  );
}

export function VowelSpaceModal({ onClose }) {
  return (
    <Modal
      title="Vowel Proximity Space"
      description={
        "Vowels positioned by acoustic proximity — F1 (jaw height, vertical) " +
        "and F2 (tongue frontness, horizontal) in Bark scale. " +
        "Assonance matches on the primary stressed vowel only; coda consonant is ignored."
      }
      onClose={onClose}
    >
      <VowelSpaceSVG width={420} height={330} pad={38} />
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
