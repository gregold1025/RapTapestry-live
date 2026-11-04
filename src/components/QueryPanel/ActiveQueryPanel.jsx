// src/components/QueryPanel/ActiveQueryPanel.jsx
import React, { useState, useMemo, useRef } from "react";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useSyllableSelection } from "../../contexts/lyricsContexts/SyllableSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import {
  ALLITERATION_TIERS,
  VOWEL_SIM,
  CONSONANT_SIM,
  getThreshold,
  primaryVowel,
  decomposeSyllable,
} from "../../utils/phonemeSimilarity.js";
import { RhymeStrictnessModal, VowelSpaceModal, ConsonantSpaceModal } from "../PhonemeMatchList/PhonemeSpaceModal.jsx";
import { useSongData } from "../../contexts/SongDataContext.jsx";
import SelectionList from "./SelectionList.jsx";
import "./ActiveQueryPanel.css";

// ── Helpers ───────────────────────────────────────────────────────────────────

const DIST_MAX = 20;
function distToSlider(d) { return d >= 999 ? DIST_MAX : Math.min(d, DIST_MAX); }
function sliderToDist(v) { return v >= DIST_MAX ? 999 : v; }
function distLabel(v) { return v >= DIST_MAX ? "All" : `\u00b1${v} lines`; }

function fmtTime(t) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  return m ? `${m}:${String(s % 60).padStart(2, "0")}` : `${s}s`;
}

// ── Phoneme inline: [matches... lowest→highest] | [anchor] ────────────────────

function PhonemeInline({ anchorPhoneme, simMatrix, threshold }) {
  if (!anchorPhoneme || !simMatrix) return null;
  const simRow = simMatrix[anchorPhoneme];
  if (!simRow) return null;

  // Sorted ascending so lowest sim is leftmost, highest sim is closest to anchor
  const matches = Object.entries(simRow)
    .filter(([p]) => p !== anchorPhoneme && simRow[p] >= threshold)
    .sort(([, a], [, b]) => a - b)
    .slice(-6);

  return (
    <div className="aqp-phoneme-inline">
      {matches.map(([p, sim]) => (
        <span key={p} className="aqp-phoneme-match">
          <span className="aqp-phoneme-pct">{Math.round(sim * 100)}%</span>
          {"\u00a0"}{p}
        </span>
      ))}
      {matches.length > 0 && <span className="aqp-phoneme-sep" aria-hidden="true" />}
      <span className="aqp-phoneme-anchor">{anchorPhoneme}</span>
    </div>
  );
}

// ── Coda inline: similar to PhonemeInline but for coda consonants ─────────────

/**
 * Displays the actual coda clusters present in the current match set,
 * grouped by unique cluster with counts. Works backwards from the results
 * rather than showing a theoretical space of acceptable consonants.
 *
 * @param {string[]} anchorCodaCluster - the anchor's full coda, e.g. ["K", "T"]
 * @param {Map<string, string>} matchedCodas - Map of clusterLabel → count string
 */
function CodaInline({ anchorCodaCluster, matchedCodas }) {
  const clusterLabel = anchorCodaCluster?.length
    ? anchorCodaCluster.join(" ")
    : "(open)";

  const entries = matchedCodas ? [...matchedCodas.entries()] : [];

  return (
    <div className="aqp-phoneme-inline">
      {entries.slice(0, 6).map(([cluster, count]) => (
        <span key={cluster} className="aqp-phoneme-match">
          <span className="aqp-phoneme-pct">{count}</span>
          {"\u00a0"}{cluster || "(open)"}
        </span>
      ))}
      {entries.length > 0 && <span className="aqp-phoneme-sep" aria-hidden="true" />}
      <span className="aqp-phoneme-anchor">{clusterLabel}</span>
    </div>
  );
}

// ── Strictness slider with label + ⓘ + phoneme display + endpoints ────────────

function StrictnessSlider({ anchorPhoneme, simMatrix, threshold, anchorCodaCluster, matchedCodas, showCodaRow, value, onChange, ModalComponent }) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="aqp-full-slider-group">
      <div className="aqp-slider-label-row">
        <span className="aqp-slider-name">Strictness</span>
        {ModalComponent && (
          <button className="aqp-info-btn" onClick={() => setModalOpen(true)} title="Phoneme space reference">
            &#x2139;&#xFE0E;
          </button>
        )}
        <div className="aqp-slider-label-spacer" />
        <PhonemeInline anchorPhoneme={anchorPhoneme} simMatrix={simMatrix} threshold={threshold} />
      </div>
      {showCodaRow && (
        <div className="aqp-slider-label-row">
          <div className="aqp-slider-label-spacer" />
          <CodaInline anchorCodaCluster={anchorCodaCluster} matchedCodas={matchedCodas} />
        </div>
      )}
      <input
        type="range"
        className="aqp-full-slider"
        min={0} max={1} step={0.05}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
      <div className="aqp-slider-endpoints">
        <span>Loose</span>
        <span>Perfect</span>
      </div>
      {modalOpen && ModalComponent && <ModalComponent onClose={() => setModalOpen(false)} />}
    </div>
  );
}

// ── Distance slider with endpoints ────────────────────────────────────────────

function DistSlider({ value, onChange }) {
  const sv = distToSlider(value);
  return (
    <div className="aqp-full-slider-group">
      <div className="aqp-slider-label-row">
        <span className="aqp-slider-name">Distance</span>
        <span className="aqp-dist-val">{distLabel(sv)}</span>
      </div>
      <input
        type="range"
        className="aqp-full-slider"
        min={1} max={DIST_MAX} step={1}
        value={sv}
        onChange={(e) => onChange(sliderToDist(+e.target.value))}
      />
      <div className="aqp-slider-endpoints">
        <span>1 line</span>
        <span>All</span>
      </div>
    </div>
  );
}

// ── Match list — collapsible dropdown ────────────────────────────────────────

function SectionMatchList({ items, onSeek }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="aqp-matches-section">
      <button className="aqp-matches-hd" onClick={() => setOpen((v) => !v)}>
        <span className="aqp-matches-label">Matches</span>
        <span className="aqp-matches-count">{items.length}</span>
        <span className="aqp-matches-caret">{open ? "\u25b4" : "\u25be"}</span>
      </button>
      {open && (
        items.length === 0 ? (
          <div className="aqp-match-empty">No matches</div>
        ) : (
          <ul className="aqp-match-list">
            {items.map((m) => (
              <li key={m.id}>
                <button
                  className="aqp-match-item"
                  onClick={() => m.time != null && onSeek(m.time)}
                  title="Jump to word"
                >
                  <span className="aqp-match-text">{m.text}</span>
                  {m.time != null && <span className="aqp-match-time">{fmtTime(m.time)}</span>}
                </button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

// ── Color swatch — small rectangle, click opens native picker ─────────────────

function ColorSwatch({ color, onChange }) {
  const ref = useRef(null);
  return (
    <div className="aqp-color-swatch" onClick={() => ref.current?.click()} title="Change color">
      <div className="aqp-color-swatch-fill" style={{ background: color }} />
      <input
        ref={ref}
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="aqp-color-input-hidden"
      />
    </div>
  );
}

// ── Word query card ───────────────────────────────────────────────────────────

function WordQueryCard({ sel, transcriptionData }) {
  const {
    matchesBySelectionId,
    alliterationBySelectionId,
    assonanceBySelectionId,
    setSelectionParams,
    clearSelectionParams,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
  } = useWordSelection();

  const globalParams = useParams();
  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const r = (key) => sel.params?.[key] !== undefined ? sel.params[key] : globalParams[key];

  const [li, wi] = String(sel.wordId).split("-").map(Number);
  const word = lines[li]?.words?.[wi];
  const anchorText = word?.text ?? sel.wordId;
  const anchorPhones = Array.isArray(word?.phones) ? word.phones[0] : String(word?.phones || "");

  const decomposed   = anchorPhones ? decomposeSyllable(anchorPhones) : null;
  const anchorRhymeVowel = decomposed?.nucleus ?? null;          // last vowel — matches rhymeScore()
  const anchorAssonVowel = anchorPhones ? primaryVowel(anchorPhones) : null; // stressed vowel — matches assonanceScore()
  const anchorOnset  = decomposed?.onset[0] ?? null;
  const anchorCodaCluster = decomposed?.coda ?? [];

  const rhymeMap = matchesBySelectionId?.[sel.id] ?? new Map();
  const allitSet = alliterationBySelectionId?.[sel.id] ?? new Set();
  const asonSet  = assonanceBySelectionId?.[sel.id] ?? new Set();

  const rhymeActive = r("showRhymes");
  const allitTier   = r("alliterationTier");
  const allitActive = allitTier !== "off";
  const asonActive  = r("showAssonance");

  function resolveMatchItems(wordIds) {
    return [...wordIds].map((id) => {
      const [l, w] = String(id).split("-").map(Number);
      const wObj = lines[l]?.words?.[w];
      if (!wObj) return null;
      return { id, text: wObj.text || "\u2014", time: Number.isFinite(wObj.start) ? wObj.start : null };
    }).filter(Boolean);
  }

  const rhymeItems = resolveMatchItems(rhymeMap.keys());
  const allitItems = resolveMatchItems(allitSet);
  const asonItems  = resolveMatchItems(asonSet);

  const overrideCount = Object.keys(sel.params ?? {}).length;
  const [activeTab, setActiveTab] = useState("rhyme");

  return (
    <div className="aqp-card">
      <div className="aqp-title-row">
        <ColorSwatch color={sel.color} onChange={(c) => setSelectionColor(sel.id, c)} />
        <span
          className="aqp-anchor-word aqp-anchor-seekable"
          onClick={() => word?.start != null && seekAll(word.start)}
          title="Jump to word"
        >{anchorText}</span>
        {anchorPhones && <span className="aqp-anchor-phones">{anchorPhones}</span>}
        <div className="aqp-title-actions">
          {overrideCount > 0 && (
            <button className="aqp-action-btn" onClick={() => clearSelectionParams(sel.id)} title="Reset overrides">
              Reset
            </button>
          )}
          <button className="aqp-action-btn" onClick={() => toggleSelectionActive(sel.id)}
            title={sel.active ? "Hide matches" : "Show matches"}>
            {sel.active ? "\uD83D\uDC41\uFE0E" : "\uD83D\uDE48"}
          </button>
          <button className="aqp-action-btn danger" onClick={() => removeSelection(sel.id)} title="Remove selection">
            &times;
          </button>
        </div>
      </div>

      <div className="aqp-tab-bar">
        <div
          className={`aqp-tab ${activeTab === "rhyme" ? "is-open" : ""} ${rhymeActive ? "is-active" : ""}`}
          onClick={() => setActiveTab((t) => t === "rhyme" ? null : "rhyme")}
        >
          <button
            className={`aqp-tab-dot ${rhymeActive ? "is-on" : ""}`}
            style={rhymeActive ? { background: sel.color, borderColor: sel.color } : {}}
            onClick={(e) => { e.stopPropagation(); setSelectionParams(sel.id, { showRhymes: !rhymeActive }); }}
            title={rhymeActive ? "Hide rhymes" : "Show rhymes"}
          />
          <span className="aqp-tab-label">Rhyme</span>
        </div>

        <div
          className={`aqp-tab ${activeTab === "allit" ? "is-open" : ""} ${allitActive ? "is-active" : ""}`}
          onClick={() => setActiveTab((t) => t === "allit" ? null : "allit")}
        >
          <button
            className={`aqp-tab-dot ${allitActive ? "is-on" : ""}`}
            style={allitActive ? { background: sel.color, borderColor: sel.color } : {}}
            onClick={(e) => {
              e.stopPropagation();
              const tiers = ["off", "near", "exact"];
              const next = tiers[(tiers.indexOf(allitTier) + 1) % tiers.length];
              setSelectionParams(sel.id, { alliterationTier: next });
            }}
            title={allitActive ? `Allit. (${allitTier}) — click to cycle` : "Enable alliteration"}
          />
          <span className="aqp-tab-label">Allit.</span>
        </div>

        <div
          className={`aqp-tab ${activeTab === "ason" ? "is-open" : ""} ${asonActive ? "is-active" : ""}`}
          onClick={() => setActiveTab((t) => t === "ason" ? null : "ason")}
        >
          <button
            className={`aqp-tab-dot ${asonActive ? "is-on" : ""}`}
            style={asonActive ? { background: sel.color, borderColor: sel.color } : {}}
            onClick={(e) => { e.stopPropagation(); setSelectionParams(sel.id, { showAssonance: !asonActive }); }}
            title={asonActive ? "Hide assonance" : "Show assonance"}
          />
          <span className="aqp-tab-label">Ason.</span>
        </div>
      </div>

      {activeTab === "rhyme" && (() => {
        const nucleusThreshold = getThreshold(r("rhymeStrictness"), "rhyme");

        // Compute actual coda clusters from matched words (work backwards from results)
        const codaCounts = new Map();
        for (const wordId of rhymeMap.keys()) {
          const [l, w] = String(wordId).split("-").map(Number);
          const matchWord = lines[l]?.words?.[w];
          if (!matchWord) continue;
          const matchPhones = Array.isArray(matchWord.phones) ? matchWord.phones[0] : String(matchWord.phones || "");
          const matchDecomp = matchPhones ? decomposeSyllable(matchPhones) : null;
          const codaLabel = matchDecomp?.coda?.length ? matchDecomp.coda.join(" ") : "";
          codaCounts.set(codaLabel, (codaCounts.get(codaLabel) ?? 0) + 1);
        }
        // Sort by count descending, format as "×N"
        const matchedCodas = new Map(
          [...codaCounts.entries()]
            .sort(([, a], [, b]) => b - a)
            .map(([cluster, count]) => [cluster, "\u00d7" + count])
        );

        return (
        <div className="aqp-tab-body">
          <StrictnessSlider
            anchorPhoneme={anchorRhymeVowel}
            simMatrix={VOWEL_SIM}
            threshold={nucleusThreshold}
            anchorCodaCluster={anchorCodaCluster}
            matchedCodas={matchedCodas}
            showCodaRow
            value={r("rhymeStrictness")}
            onChange={(v) => setSelectionParams(sel.id, { rhymeStrictness: v })}
            ModalComponent={RhymeStrictnessModal}
          />
          <DistSlider
            value={r("rhymeSearchDistance")}
            onChange={(v) => setSelectionParams(sel.id, { rhymeSearchDistance: v })}
          />
          <SectionMatchList items={rhymeItems} onSeek={seekAll} />
        </div>
        );
      })()}

      {activeTab === "allit" && (
        <div className="aqp-tab-body">
          <div className="aqp-tier-row">
            {Object.entries(ALLITERATION_TIERS).map(([key, tier]) => (
              <button
                key={key}
                className={`aqp-tier-btn ${allitTier === key ? "is-active" : ""}`}
                onClick={() => setSelectionParams(sel.id, { alliterationTier: key })}
                style={allitTier === key ? { borderColor: sel.color, color: sel.color } : {}}
                title={tier.description}
              >
                {tier.label}
              </button>
            ))}
          </div>
          <div className="aqp-full-slider-group">
            <div className="aqp-slider-label-row">
              <span className="aqp-slider-name">Onset</span>
              <div className="aqp-slider-label-spacer" />
              <PhonemeInline
                anchorPhoneme={anchorOnset}
                simMatrix={CONSONANT_SIM}
                threshold={ALLITERATION_TIERS[allitTier]?.threshold ?? 1}
              />
            </div>
          </div>
          <DistSlider
            value={r("alliterationSearchDistance")}
            onChange={(v) => setSelectionParams(sel.id, { alliterationSearchDistance: v })}
          />
          <SectionMatchList items={allitItems} onSeek={seekAll} />
        </div>
      )}

      {activeTab === "ason" && (
        <div className="aqp-tab-body">
          <StrictnessSlider
            anchorPhoneme={anchorAssonVowel}
            simMatrix={VOWEL_SIM}
            threshold={getThreshold(r("assonanceStrictness"), "assonance")}
            value={r("assonanceStrictness")}
            onChange={(v) => setSelectionParams(sel.id, { assonanceStrictness: v })}
            ModalComponent={VowelSpaceModal}
          />
          <DistSlider
            value={r("assonanceSearchDistance")}
            onChange={(v) => setSelectionParams(sel.id, { assonanceSearchDistance: v })}
          />
          <SectionMatchList items={asonItems} onSeek={seekAll} />
        </div>
      )}
    </div>
  );
}

// ── Line query card ───────────────────────────────────────────────────────────

function LineQueryCard({ sel, transcriptionData }) {
  const {
    matchesBySelectionId,
    setSelectionParams,
    clearSelectionParams,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
  } = useLineSelection();

  const globalParams = useParams();
  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const r = (key) => sel.params?.[key] !== undefined ? sel.params[key] : globalParams[key];

  const lineText = lines[sel.lineIdx]?.text ?? `Line ${sel.lineIdx}`;
  const tail = lineText.trim().replace(/[.,!?;:'""\u2019\u2026)\]]+$/u, "").slice(-28);

  const matchSet = matchesBySelectionId?.[sel.id] ?? new Set();
  const matchItems = [...matchSet].map((lineIdx) => {
    const l = lines[lineIdx];
    if (!l) return null;
    const time = l.words?.[0]?.start;
    const text = (l.text ?? "").trim().replace(/[.,!?;:'""\u2019\u2026)\]]+$/u, "").slice(-22) || "\u2014";
    return { id: lineIdx, text, time: Number.isFinite(time) ? time : null };
  }).filter(Boolean);

  const overrideCount = Object.keys(sel.params ?? {}).length;

  return (
    <div className="aqp-card">
      <div className="aqp-title-row">
        <ColorSwatch color={sel.color} onChange={(c) => setSelectionColor(sel.id, c)} />
        <span
          className="aqp-anchor-word aqp-anchor-line aqp-anchor-seekable"
          onClick={() => {
            const time = lines[sel.lineIdx]?.words?.[0]?.start;
            if (time != null) seekAll(time);
          }}
          title="Jump to line"
        >&hellip;{tail}</span>
        <div className="aqp-title-actions">
          {overrideCount > 0 && (
            <button className="aqp-action-btn" onClick={() => clearSelectionParams(sel.id)} title="Reset overrides">
              Reset
            </button>
          )}
          <button className="aqp-action-btn" onClick={() => toggleSelectionActive(sel.id)}
            title={sel.active ? "Hide matches" : "Show matches"}>
            {sel.active ? "\uD83D\uDC41\uFE0E" : "\uD83D\uDE48"}
          </button>
          <button className="aqp-action-btn danger" onClick={() => removeSelection(sel.id)} title="Remove">
            &times;
          </button>
        </div>
      </div>
      <div className="aqp-tab-body" style={{ borderTop: "1px solid #1e2d42" }}>
        <StrictnessSlider
          anchorPhoneme={null}
          simMatrix={null}
          threshold={0}
          value={r("rhymeStrictness")}
          onChange={(v) => setSelectionParams(sel.id, { rhymeStrictness: v })}
          ModalComponent={RhymeStrictnessModal}
        />
        <DistSlider
          value={r("rhymeSearchDistance") ?? 999}
          onChange={(v) => setSelectionParams(sel.id, { rhymeSearchDistance: v })}
        />
        <SectionMatchList items={matchItems} onSeek={seekAll} />
      </div>
    </div>
  );
}

// ── Syllable query card ───────────────────────────────────────────────────────

function SyllableQueryCard({ sel }) {
  const {
    flat,
    matchesBySelectionId,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    vowelColors,
  } = useSyllableSelection();

  const { wildcardSkips, setWildcardSkips, minMatchLen, setMinMatchLen } = useParams();
  const { seekAll } = useAudioEngine();

  const matchSet = matchesBySelectionId?.[sel.id] ?? new Set();

  // Group matched syllable ids by word (li-wi), take the earliest start per word
  const wordHits = new Map(); // "li-wi" → start time
  [...matchSet].forEach((id) => {
    const syl = flat.find((s) => s.id === id);
    if (!syl) return;
    const key = `${syl.li}-${syl.wi}`;
    const prev = wordHits.get(key);
    if (prev === undefined || (Number.isFinite(syl.start) && syl.start < prev)) {
      wordHits.set(key, Number.isFinite(syl.start) ? syl.start : null);
    }
  });
  const matchItems = [...wordHits.entries()].map(([key, time]) => ({ id: key, text: key, time }))
    .sort((a, b) => (a.time ?? Infinity) - (b.time ?? Infinity));

  const syllableIds = sel.syllableIds ?? [];
  const chosenVowels = syllableIds.map((id) => sel.chosenById?.[id] ?? "AH");

  return (
    <div className="aqp-card">
      <div className="aqp-title-row">
        <ColorSwatch color={sel.color} onChange={(c) => setSelectionColor(sel.id, c)} />
        <div className="aqp-title-actions" style={{ marginLeft: "auto" }}>
          <button className="aqp-action-btn" onClick={() => toggleSelectionActive(sel.id)}
            title={sel.active ? "Hide matches" : "Show matches"}>
            {sel.active ? "\uD83D\uDC41\uFE0E" : "\uD83D\uDE48"}
          </button>
          <button className="aqp-action-btn danger" onClick={() => removeSelection(sel.id)} title="Remove">
            &times;
          </button>
        </div>
      </div>

      <div className="aqp-syl-header">
        <div className="aqp-syl-circles-row">
          {chosenVowels.map((v, i) => (
            <div key={i} className="aqp-syl-col">
              <div
                className="aqp-syl-circle"
                style={{ background: vowelColors?.[v] ?? "#334", border: `2px solid ${sel.color}` }}
              />
              <span className="aqp-syl-name">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="aqp-tab-body" style={{ borderTop: "1px solid #1e2d42" }}>
        <div className="aqp-full-slider-group">
          <div className="aqp-slider-label-row">
            <span className="aqp-slider-name">Max Skips</span>
            <span className="aqp-dist-val">{wildcardSkips}</span>
          </div>
          <input
            type="range"
            className="aqp-full-slider"
            min={0} max={4} step={1}
            value={wildcardSkips}
            onChange={(e) => setWildcardSkips(+e.target.value)}
          />
          <div className="aqp-slider-endpoints">
            <span>0</span>
            <span>4</span>
          </div>
        </div>

        <div className="aqp-full-slider-group">
          <div className="aqp-slider-label-row">
            <span className="aqp-slider-name">Min Length</span>
            <span className="aqp-dist-val">{minMatchLen}</span>
          </div>
          <input
            type="range"
            className="aqp-full-slider"
            min={1} max={syllableIds.length || 4} step={1}
            value={minMatchLen}
            onChange={(e) => setMinMatchLen(+e.target.value)}
          />
          <div className="aqp-slider-endpoints">
            <span>1</span>
            <span>{syllableIds.length || 4}</span>
          </div>
        </div>

        <SectionMatchList items={matchItems} onSeek={seekAll} />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="aqp-empty">
      <span>Click any word in the lyrics to analyze it</span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

/** The most recently interacted selection across word / line / syllable queries. */
export function useFocusedQuery() {
  const { selections: wordSels, focusedWordSelId, wordInteractionStamp } = useWordSelection();
  const { selections: lineSels, focusedLineSelId, lineInteractionStamp } = useLineSelection();
  const { selections: sylSels, focusedSyllableSelId, syllableInteractionStamp } = useSyllableSelection();

  const focusedWordSel = wordSels.find((s) => s.id === focusedWordSelId) ?? null;
  const focusedLineSel = lineSels.find((s) => s.id === focusedLineSelId) ?? null;
  const focusedSylSel  = sylSels.find((s) => s.id === focusedSyllableSelId) ?? null;

  // 3-way stamp comparison — most recently interacted type wins
  const focused = useMemo(() => {
    const candidates = [
      focusedWordSel ? { type: "word",     sel: focusedWordSel, stamp: wordInteractionStamp }     : null,
      focusedLineSel ? { type: "line",     sel: focusedLineSel, stamp: lineInteractionStamp }     : null,
      focusedSylSel  ? { type: "syllable", sel: focusedSylSel,  stamp: syllableInteractionStamp } : null,
    ].filter(Boolean);
    if (!candidates.length) return null;
    return candidates.reduce((a, b) => (b.stamp >= a.stamp ? b : a));
  }, [focusedWordSel, focusedLineSel, focusedSylSel, wordInteractionStamp, lineInteractionStamp, syllableInteractionStamp]);

  const hasSelections = wordSels.length > 0 || lineSels.length > 0 || sylSels.length > 0;
  return { focused, hasSelections };
}

/** The focused query's card, without the selection strip. */
export function FocusedQueryCard({ emptyText = "Click a word or line to analyze it" }) {
  const { lyricTranscription: transcriptionData } = useSongData();
  const { focused } = useFocusedQuery();
  if (!focused) return <div className="aqp-empty"><span>{emptyText}</span></div>;
  if (focused.type === "word") return <WordQueryCard key={focused.sel.id} sel={focused.sel} transcriptionData={transcriptionData} />;
  if (focused.type === "line") return <LineQueryCard key={focused.sel.id} sel={focused.sel} transcriptionData={transcriptionData} />;
  return <SyllableQueryCard key={focused.sel.id} sel={focused.sel} />;
}

export default function ActiveQueryPanel() {
  const { hasSelections } = useFocusedQuery();
  return (
    <div className="aqp-root">
      {hasSelections && (
        <div className="aqp-sel-strip">
          <SelectionList />
        </div>
      )}
      <div className="aqp-body">
        <FocusedQueryCard />
      </div>
    </div>
  );
}
