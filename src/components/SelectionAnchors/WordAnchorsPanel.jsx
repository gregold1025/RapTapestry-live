// src/components/RightPanel/WordAnchorsPanel.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import { ALLITERATION_TIERS, getThreshold, primaryVowel, decomposeSyllable } from "../../utils/phonemeSimilarity.js";
import { VowelMatchList, ConsonantMatchList } from "../PhonemeMatchList/PhonemeMatchList.jsx";
import "./SelectionAnchors.css";

const DIST_MAX = 20;
function distToSlider(d) { return d >= 999 ? DIST_MAX : Math.min(d, DIST_MAX); }
function sliderToDist(v) { return v >= DIST_MAX ? 999 : v; }
function distLabel(v) { return v >= DIST_MAX ? "All" : `\u00b1${v}`; }

// ── Tiny shared controls (inline, no import needed) ──────────────────────────

function MiniSlider({ label, value, min = 0, max = 1, step = 0.05, display, onChange }) {
  return (
    <label className="lap-ps-control">
      <div className="lap-ps-row">
        <span>{label}</span>
        {display != null && <span className="lap-ps-value">{display}</span>}
      </div>
      <input
        type="range" min={min} max={max} step={step}
        value={value} onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}

function MiniToggle({ checked, onChange, children }) {
  return (
    <label className="lap-ps-toggle">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      {children}
    </label>
  );
}

// ── Per-selection params panel ────────────────────────────────────────────────

function SelectionParamsPanel({ sel, anchorPhones, setSelectionParams, clearSelectionParams, globalParams }) {
  // Resolve current effective value: per-selection override ?? global fallback
  const r = (key) => sel.params?.[key] !== undefined ? sel.params[key] : globalParams[key];

  const allitTier = r("alliterationTier");
  const allitActive = allitTier !== "off";

  // Derive anchor phonemes for match list diagrams
  const anchorVowel = anchorPhones ? primaryVowel(anchorPhones) : null;
  const anchorOnset = anchorPhones ? decomposeSyllable(anchorPhones).onset[0] ?? null : null;

  return (
    <div className="lap-ps-panel">
      <div className="lap-ps-header">
        <span className="lap-ps-title">Query Params</span>
        <button
          className="lap-ps-reset"
          onClick={() => clearSelectionParams(sel.id)}
          title="Reset all to global defaults"
        >
          Reset
        </button>
      </div>

      {/* ── Rhyme ── */}
      <div className="lap-ps-section">
        <div className="lap-ps-section-header">
          <MiniToggle
            checked={r("showRhymes")}
            onChange={(v) => setSelectionParams(sel.id, { showRhymes: v })}
          >
            Rhyme
          </MiniToggle>
        </div>
        {r("showRhymes") && (
          <>
            <MiniSlider
              label="Strictness" value={r("rhymeStrictness")}
              onChange={(v) => setSelectionParams(sel.id, { rhymeStrictness: v })}
            />
            <MiniSlider
              label="Distance" min={1} max={DIST_MAX} step={1}
              value={distToSlider(r("rhymeSearchDistance"))}
              display={distLabel(distToSlider(r("rhymeSearchDistance")))}
              onChange={(v) => setSelectionParams(sel.id, { rhymeSearchDistance: sliderToDist(v) })}
            />
            <div className="lap-ps-toggles">
              <MiniToggle
                checked={r("exactMatches")}
                onChange={(v) => setSelectionParams(sel.id, { exactMatches: v })}
              >Exact</MiniToggle>
            </div>
            <VowelMatchList
              anchorPhoneme={anchorVowel}
              threshold={getThreshold(r("rhymeStrictness"), "rhyme")}
            />
          </>
        )}
      </div>

      {/* ── Alliteration ── */}
      <div className="lap-ps-section">
        <div className="lap-ps-section-header">
          <span className="lap-ps-section-label">Alliteration</span>
          <div className="lap-ps-tier-row">
            {Object.entries(ALLITERATION_TIERS).map(([key, tier]) => (
              <button
                key={key}
                className={`lap-ps-tier-btn ${allitTier === key ? "is-active" : ""}`}
                onClick={() => setSelectionParams(sel.id, { alliterationTier: key })}
                title={tier.description}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>
        {allitActive && (
          <>
            <MiniSlider
              label="Distance" min={1} max={DIST_MAX} step={1}
              value={distToSlider(r("alliterationSearchDistance"))}
              display={distLabel(distToSlider(r("alliterationSearchDistance")))}
              onChange={(v) => setSelectionParams(sel.id, { alliterationSearchDistance: sliderToDist(v) })}
            />
            <ConsonantMatchList
              anchorPhoneme={anchorOnset}
              threshold={ALLITERATION_TIERS[allitTier]?.threshold ?? 1}
            />
          </>
        )}
      </div>

      {/* ── Assonance ── */}
      <div className="lap-ps-section">
        <div className="lap-ps-section-header">
          <MiniToggle
            checked={r("showAssonance")}
            onChange={(v) => setSelectionParams(sel.id, { showAssonance: v })}
          >
            Assonance
          </MiniToggle>
        </div>
        {r("showAssonance") && (
          <>
            <MiniSlider
              label="Strictness" value={r("assonanceStrictness")}
              onChange={(v) => setSelectionParams(sel.id, { assonanceStrictness: v })}
            />
            <MiniSlider
              label="Distance" min={1} max={DIST_MAX} step={1}
              value={distToSlider(r("assonanceSearchDistance"))}
              display={distLabel(distToSlider(r("assonanceSearchDistance")))}
              onChange={(v) => setSelectionParams(sel.id, { assonanceSearchDistance: sliderToDist(v) })}
            />
            <VowelMatchList
              anchorPhoneme={anchorVowel}
              threshold={getThreshold(r("assonanceStrictness"), "assonance")}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function WordAnchorsPanel({ transcriptionData }) {
  const {
    selections,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    updateSelection,
    setSelectionParams,
    clearSelectionParams,
    matchesBySelectionId,
    alliterationBySelectionId,
  } = useWordSelection();

  const globalParams = useParams();
  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const [expanded, setExpanded] = useState(true);
  const [openRows, setOpenRows] = useState({});       // { [selId]: boolean } — matches list
  const [openParams, setOpenParams] = useState({});   // { [selId]: boolean } — params panel

  const toggleRowOpen = useCallback(
    (id) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );
  const toggleParams = useCallback(
    (id) => setOpenParams((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  function getWordById(wordId) {
    const [li, wi] = String(wordId).split("-").map((n) => +n);
    const line = lines[li];
    const word = line?.words?.[wi];
    return { line, word, lineIdx: li, wordIdx: wi };
  }

  const anchorsUi = useMemo(() => {
    return (selections ?? []).map((s) => {
      const { word } = getWordById(s.wordId);
      const text = word?.text ?? "";
      const anchorPhones = Array.isArray(word?.phones) ? word.phones[0] : String(word?.phones || "");

      const autoLabel = text || "(word)";
      const label = s.label?.trim()?.length ? s.label : autoLabel;

      const matchIds = setToArray(matchesBySelectionId?.[s.id]);
      const matches = matchIds
        .map((id) => {
          const { word: w } = getWordById(id);
          if (!w) return null;
          const t = Number.isFinite(w.start) ? w.start : null;
          return { id, text: w.text || "\u2014", time: t };
        })
        .filter(Boolean);

      const allitIds = setToArray(alliterationBySelectionId?.[s.id]);
      const alliterations = allitIds
        .map((id) => {
          const { word: w } = getWordById(id);
          if (!w) return null;
          const t = Number.isFinite(w.start) ? w.start : null;
          return { id, text: w.text || "\u2014", time: t };
        })
        .filter(Boolean);

      // Count overrides so user can see a selection has custom params
      const overrideCount = Object.keys(s.params ?? {}).length;

      return {
        sel: s, label, autoLabel, matches, alliterations,
        matchCount: matches.length, allitCount: alliterations.length,
        overrideCount, anchorPhones,
      };
    });
  }, [selections, matchesBySelectionId, alliterationBySelectionId, lines]);

  return (
    <div className="line-anchors-panel lap-section">
      <button
        className="lap-sec-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? "Collapse" : "Expand"}
      >
        <span className="lap-sec-title">Word Selections</span>
        <span className={`lap-caret ${expanded ? "open" : ""}`}>&#9662;</span>
        <span className="lap-sec-spacer" />
        <span className="lap-count" style={{ marginLeft: 6 }}>
          {selections?.length ?? 0}
        </span>
      </button>

      <div className={`lap-collapse ${expanded ? "is-open" : "is-closed"}`}>
        {!anchorsUi.length ? (
          <p className="lap-empty">
            No word selections yet. Click on words above or{" "}
            <kbd>Cmd/Ctrl</kbd>+click a word rectangle in the tapestry.
          </p>
        ) : (
          <div className="lap-rows">
            {anchorsUi.map(
              ({ sel, label, autoLabel, matches, alliterations, matchCount, allitCount, overrideCount, anchorPhones }) => {
                const isOpen = !!openRows[sel.id];
                const isParamsOpen = !!openParams[sel.id];

                return (
                  <div
                    key={sel.id}
                    className={`lap-row-wrap ${sel.active ? "" : "is-inactive"}`}
                  >
                    <div className="lap-row">
                      <div className="lap-left">
                        <input
                          className="lap-dot"
                          type="color"
                          value={sel.color}
                          title="Change color"
                          onChange={(e) => setSelectionColor(sel.id, e.target.value)}
                        />
                        <input
                          className="lap-name"
                          value={label}
                          placeholder={autoLabel}
                          onChange={(e) => updateSelection(sel.id, { label: e.target.value })}
                          title="Rename"
                        />
                      </div>

                      <div className="lap-right">
                        {/* Params toggle — gear icon, badge shows override count */}
                        <button
                          className={`lap-icon ${isParamsOpen ? "is-active" : ""}`}
                          onClick={() => toggleParams(sel.id)}
                          title="Per-selection parameters"
                          style={overrideCount > 0 ? { borderColor: sel.color } : {}}
                        >
                          {overrideCount > 0 ? <span style={{ fontSize: "0.7rem", fontWeight: 700, color: sel.color }}>{overrideCount}</span> : "\u2699\ufe0e"}
                        </button>

                        <button
                          className="lap-icon"
                          onClick={() => toggleSelectionActive(sel.id)}
                          title={sel.active ? "Hide matches" : "Show matches"}
                        >
                          {sel.active ? "\uD83D\uDC41" : "\uD83D\uDE48"}
                        </button>

                        <span
                          className={`lap-count ${isOpen ? "open" : ""}`}
                          onClick={() => toggleRowOpen(sel.id)}
                          title={isOpen ? "Hide matches" : "Show matches"}
                          role="button"
                          aria-expanded={isOpen}
                        >
                          {matchCount}
                        </span>

                        <span
                          className={`lap-count ${isOpen ? "open" : ""}`}
                          onClick={() => toggleRowOpen(sel.id)}
                          title={isOpen ? "Hide alliterations" : "Show alliterations"}
                          role="button"
                          aria-expanded={isOpen}
                        >
                          {allitCount}
                        </span>

                        <button
                          className="lap-icon danger"
                          onClick={() => removeSelection(sel.id)}
                          title="Remove"
                        >
                          &times;
                        </button>
                      </div>
                    </div>

                    {/* Per-selection params panel */}
                    {isParamsOpen && (
                      <SelectionParamsPanel
                        sel={sel}
                        anchorPhones={anchorPhones}
                        setSelectionParams={setSelectionParams}
                        clearSelectionParams={clearSelectionParams}
                        globalParams={globalParams}
                      />
                    )}

                    {/* Matches dropdown */}
                    <div className={`lap-row-drop ${isOpen ? "is-open" : "is-closed"}`}>
                      {!matches.length && !alliterations.length ? (
                        <div className="lap-drop-empty">No matches yet.</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, padding: 4 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="lap-drop-empty" style={{ padding: "4px 6px" }}>
                              Rhymes/Exact
                            </div>
                            <ul className="lap-drop-list">
                              {matches.map((m) => (
                                <li key={`${sel.id}-${m.id}`}>
                                  <button
                                    className="lap-drop-item"
                                    onClick={() => m.time != null && seekAll(m.time)}
                                    title="Jump to word"
                                  >
                                    <span className="lap-drop-text">{m.text}</span>
                                    {Number.isFinite(m.time) && (
                                      <span className="lap-drop-time">{formatSeconds(m.time)}</span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="lap-drop-empty" style={{ padding: "4px 6px" }}>
                              Alliteration
                            </div>
                            <ul className="lap-drop-list">
                              {alliterations.map((m) => (
                                <li key={`${sel.id}-${m.id}`}>
                                  <button
                                    className="lap-drop-item"
                                    onClick={() => m.time != null && seekAll(m.time)}
                                    title="Jump to word"
                                  >
                                    <span className="lap-drop-text">{m.text}</span>
                                    {Number.isFinite(m.time) && (
                                      <span className="lap-drop-time">{formatSeconds(m.time)}</span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function setToArray(v) {
  if (!v) return [];
  if (v instanceof Set) return [...v];
  if (Array.isArray(v)) return v;
  return Object.keys(v).map(String);
}

const formatSeconds = (t) => {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${r.toString().padStart(2, "0")}` : `${r}s`;
};
