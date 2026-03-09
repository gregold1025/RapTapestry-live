// src/components/PhonemeMatchList/PhonemeMatchList.jsx
//
// Compact reference panel showing which phonemes match a given anchor phoneme
// above the current similarity threshold.
//
// Anchor phoneme: white
// Matching phonemes: light grey, sorted by similarity descending
//
// Usage:
//   <VowelMatchList anchorPhoneme="AH" threshold={0.78} />
//   <VowelMatchList anchorPhoneme="AH" threshold={0.78} showInfo />
//   <ConsonantMatchList anchorPhoneme="G" threshold={0.83} showInfo />

import React, { useState } from "react";
import { VOWEL_SIM, CONSONANT_SIM } from "../../utils/phonemeSimilarity.js";
import { VowelSpaceModal, ConsonantSpaceModal } from "./PhonemeSpaceModal.jsx";
import "./PhonemeMatchList.css";
import "./PhonemeSpaceModal.css";

// ── Shared rendering ──────────────────────────────────────────────────────────

function MatchList({ anchorPhoneme, simMatrix, threshold, placeholder, ModalComponent }) {
  const [modalOpen, setModalOpen] = useState(false);

  const hasInfo = !!ModalComponent;

  if (!anchorPhoneme) {
    return (
      <div className="pml-row">
        <div className="pml-placeholder">{placeholder ?? "Select a word anchor to see match space"}</div>
        {hasInfo && (
          <button className="pml-info-btn" onClick={() => setModalOpen(true)} title="Phoneme space reference">
            &#x2139;&#xFE0E;
          </button>
        )}
        {modalOpen && <ModalComponent onClose={() => setModalOpen(false)} />}
      </div>
    );
  }

  const simRow = simMatrix[anchorPhoneme];
  if (!simRow) {
    return <div className="pml-placeholder">No data for {anchorPhoneme}</div>;
  }

  const matches = Object.entries(simRow)
    .filter(([p]) => p !== anchorPhoneme && simRow[p] >= threshold)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="pml-root">
      <div className="pml-anchor">{anchorPhoneme}</div>
      {matches.length === 0 ? (
        <div className="pml-placeholder">No other phonemes match at this threshold</div>
      ) : (
        <div className="pml-matches">
          {matches.map(([p, sim]) => (
            <div key={p} className="pml-item">
              <span className="pml-phoneme">{p}</span>
              <span className="pml-pct">{Math.round(sim * 100)}%</span>
            </div>
          ))}
        </div>
      )}
      {hasInfo && (
        <button className="pml-info-btn" onClick={() => setModalOpen(true)} title="Phoneme space reference">
          &#x2139;&#xFE0E;
        </button>
      )}
      {modalOpen && <ModalComponent onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ── Public exports ────────────────────────────────────────────────────────────

export function VowelMatchList({ anchorPhoneme, threshold, showInfo = false }) {
  return (
    <MatchList
      anchorPhoneme={anchorPhoneme}
      simMatrix={VOWEL_SIM}
      threshold={threshold}
      placeholder="Select a word anchor to see vowel match space"
      ModalComponent={showInfo ? VowelSpaceModal : null}
    />
  );
}

export function ConsonantMatchList({ anchorPhoneme, threshold, showInfo = false }) {
  return (
    <MatchList
      anchorPhoneme={anchorPhoneme}
      simMatrix={CONSONANT_SIM}
      threshold={threshold}
      placeholder="Select a word anchor to see consonant match space"
      ModalComponent={showInfo ? ConsonantSpaceModal : null}
    />
  );
}
