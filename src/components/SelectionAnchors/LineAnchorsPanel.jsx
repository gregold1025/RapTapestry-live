import React, { useMemo, useState, useCallback } from "react";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useParams } from "../../contexts/ParamsContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import "./SelectionAnchors.css";

const DIST_MAX = 20;
function distToSlider(d) { return d >= 999 ? DIST_MAX : Math.min(d, DIST_MAX); }
function sliderToDist(v) { return v >= DIST_MAX ? 999 : v; }
function distLabel(v) { return v >= DIST_MAX ? "All" : `\u00b1${v}`; }

// ── Tiny controls ─────────────────────────────────────────────────────────────

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

function LineParamsPanel({ sel, setSelectionParams, clearSelectionParams, globalParams }) {
  const r = (key) => sel.params?.[key] !== undefined ? sel.params[key] : globalParams[key];

  return (
    <div className="lap-ps-panel">
      <div className="lap-ps-header">
        <span className="lap-ps-title">Query Params</span>
        <button
          className="lap-ps-reset"
          onClick={() => clearSelectionParams(sel.id)}
          title="Reset to global defaults"
        >
          Reset
        </button>
      </div>

      <div className="lap-ps-section">
        <div className="lap-ps-section-header">
          <span className="lap-ps-section-label">End Rhyme</span>
        </div>
        <MiniSlider
          label="Strictness" value={r("rhymeStrictness")}
          onChange={(v) => setSelectionParams(sel.id, { rhymeStrictness: v })}
        />
        <MiniSlider
          label="Distance" min={1} max={DIST_MAX} step={1}
          value={distToSlider(r("rhymeSearchDistance") ?? 999)}
          display={distLabel(distToSlider(r("rhymeSearchDistance") ?? 999))}
          onChange={(v) => setSelectionParams(sel.id, { rhymeSearchDistance: sliderToDist(v) })}
        />
        <div className="lap-ps-toggles">
          <MiniToggle
            checked={r("exactMatches")}
            onChange={(v) => setSelectionParams(sel.id, { exactMatches: v })}
          >Exact Match</MiniToggle>
        </div>
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function LineAnchorsPanel({ transcriptionData }) {
  const {
    selections,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    updateSelection,
    setSelectionParams,
    clearSelectionParams,
    matchesBySelectionId,
  } = useLineSelection();

  const globalParams = useParams();
  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const [expanded, setExpanded] = useState(true);
  const [openRows, setOpenRows] = useState({});
  const [openParams, setOpenParams] = useState({});

  const toggleRowOpen = useCallback(
    (id) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );
  const toggleParams = useCallback(
    (id) => setOpenParams((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  const anchorsUi = useMemo(() => {
    return (selections ?? []).map((s) => {
      const lineIdx = toNumber(s.lineIdx);
      const lineObj = lines[lineIdx];
      const lineText = lineObj?.text ?? "";
      const autoLabel = `\u2026${getLineTail(lineText, 10)}`;
      const label = s.label?.trim()?.length > 0 ? s.label : autoLabel;

      const matchIds = normalizeToArray(matchesBySelectionId?.[s.id]);
      const matches = matchIds
        .map((i) => {
          const m = lines[toNumber(i)];
          if (!m) return null;
          return {
            idx: i,
            tail: getLineTail(m.text, 10) || "\u2014",
            time: Number.isFinite(m.start) ? m.start : null,
          };
        })
        .filter(Boolean);

      const overrideCount = Object.keys(s.params ?? {}).length;

      return { sel: s, label, autoLabel, matches, matchCount: matches.length, overrideCount };
    });
  }, [selections, matchesBySelectionId, lines]);

  return (
    <div className="line-anchors-panel lap-section">
      <button
        className="lap-sec-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? "Collapse" : "Expand"}
      >
        <span className="lap-sec-title">Line Selections</span>
        <span className={`lap-caret ${expanded ? "open" : ""}`}>&#9662;</span>
        <span className="lap-sec-spacer" />
        <span className="lap-count" style={{ marginLeft: 6 }}>
          {selections?.length ?? 0}
        </span>
      </button>

      <div className={`lap-collapse ${expanded ? "is-open" : "is-closed"}`}>
        {!anchorsUi.length ? (
          <p className="lap-empty">
            No line selections yet. Use the &square; beside each line above to make
            selections, or <kbd>Cmd/Ctrl</kbd>+click a line in the tapestry.
          </p>
        ) : (
          <div className="lap-rows">
            {anchorsUi.map(({ sel, label, autoLabel, matches, matchCount, overrideCount }) => {
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
                      <button
                        className={`lap-icon ${isParamsOpen ? "is-active" : ""}`}
                        onClick={() => toggleParams(sel.id)}
                        title="Per-selection parameters"
                        style={overrideCount > 0 ? { borderColor: sel.color } : {}}
                      >
                        {overrideCount > 0
                          ? <span style={{ fontSize: "0.7rem", fontWeight: 700, color: sel.color }}>{overrideCount}</span>
                          : "\u2699\ufe0e"}
                      </button>

                      <button
                        className="lap-icon"
                        onClick={() => toggleSelectionActive(sel.id)}
                        title={sel.active ? "Hide matches" : "Show matches"}
                      >
                        {sel.active ? "\uD83D\uDC41" : "\uD83D\uDE48"}
                      </button>

                      <button
                        className={`lap-count ${isOpen ? "open" : ""}`}
                        onClick={() => toggleRowOpen(sel.id)}
                        aria-expanded={isOpen}
                        title={isOpen ? "Hide matched endings" : "Show matched endings"}
                      >
                        {matchCount}
                      </button>

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
                    <LineParamsPanel
                      sel={sel}
                      setSelectionParams={setSelectionParams}
                      clearSelectionParams={clearSelectionParams}
                      globalParams={globalParams}
                    />
                  )}

                  {/* Matches dropdown */}
                  <div className={`lap-row-drop ${isOpen ? "is-open" : "is-closed"}`}>
                    {!matches.length ? (
                      <div className="lap-drop-empty">No matches yet.</div>
                    ) : (
                      <ul className="lap-drop-list">
                        {matches.map((m) => (
                          <li key={`${sel.id}-${m.idx}`}>
                            <button
                              className="lap-drop-item"
                              onClick={() => m.time != null && seekAll(m.time)}
                              title="Jump to line"
                            >
                              <span className="lap-drop-text">\u2026{m.tail}</span>
                              {Number.isFinite(m.time) && (
                                <span className="lap-drop-time">{formatSeconds(m.time)}</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

const toNumber = (v) => (Number.isFinite(+v) ? +v : null);

const getLineTail = (text = "", n = 10) =>
  text
    .trim()
    .replace(/[.,!?;:'""\u2019\u2026)\]]+$/u, "")
    .slice(-n);

const normalizeToArray = (v) => {
  if (!v) return [];
  if (v instanceof Set) return [...v];
  if (Array.isArray(v)) return v;
  return Object.keys(v).map(Number).filter(Number.isFinite);
};

const formatSeconds = (t) => {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${r.toString().padStart(2, "0")}` : `${r}s`;
};
