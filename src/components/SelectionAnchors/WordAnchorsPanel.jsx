// src/components/RightPanel/WordAnchorsPanel.jsx
import React, { useMemo, useState, useCallback } from "react";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import "./SelectionAnchors.css";

/**
 * WordAnchorsPanel
 * Displays and manages user-defined word anchors with auto-naming
 * using the actual word text (and optional phones tail).
 *
 * Usage (in App.jsx):
 *   <WordAnchorsPanel transcriptionData={lyricTranscription} />
 */
export default function WordAnchorsPanel({ transcriptionData }) {
  const {
    selections,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    updateSelection,
    matchesBySelectionId, // Record<selId, Set<string>>
    alliterationBySelectionId, // Record<selId, Set<string>>
  } = useWordSelection();

  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const [expanded, setExpanded] = useState(true);
  const [openRows, setOpenRows] = useState({}); // { [selectionId]: boolean }

  const toggleRowOpen = useCallback(
    (id) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  function getWordById(wordId) {
    const [li, wi] = String(wordId)
      .split("-")
      .map((n) => +n);
    const line = lines[li];
    const word = line?.words?.[wi];
    return { line, word, lineIdx: li, wordIdx: wi };
  }

  const anchorsUi = useMemo(() => {
    return (selections ?? []).map((s) => {
      const { word } = getWordById(s.wordId);
      const text = word?.text ?? "";
      const phones = Array.isArray(word?.phones)
        ? word.phones[0]
        : String(word?.phones || "");

      const autoLabel = text || "(word)";
      const label = s.label?.trim()?.length ? s.label : autoLabel;

      // rhyme/exact matches
      const matchIds = setToArray(matchesBySelectionId?.[s.id]);
      const matches = matchIds
        .map((id) => {
          const { word: w } = getWordById(id);
          if (!w) return null;
          const t = Number.isFinite(w.start) ? w.start : null;
          return {
            id,
            text: w.text || "—",
            time: t,
          };
        })
        .filter(Boolean);

      // alliteration matches
      const allitIds = setToArray(alliterationBySelectionId?.[s.id]);
      const alliterations = allitIds
        .map((id) => {
          const { word: w } = getWordById(id);
          if (!w) return null;
          const t = Number.isFinite(w.start) ? w.start : null;
          return {
            id,
            text: w.text || "—",
            time: t,
          };
        })
        .filter(Boolean);

      return {
        sel: s,
        label,
        autoLabel,
        matches,
        alliterations,
        matchCount: matches.length,
        allitCount: alliterations.length,
      };
    });
  }, [selections, matchesBySelectionId, alliterationBySelectionId, lines]);

  return (
    <div className="line-anchors-panel lap-section">
      {/* Section header */}
      <button
        className="lap-sec-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? "Collapse" : "Expand"}
      >
        <span className="lap-sec-title">Word Selections</span>
        <span className={`lap-caret ${expanded ? "open" : ""}`}>▾</span>
        <span className="lap-sec-spacer" />
        <span className="lap-count" style={{ marginLeft: 6 }}>
          {selections?.length ?? 0}
        </span>
      </button>

      {/* Collapsible body */}
      <div className={`lap-collapse ${expanded ? "is-open" : "is-closed"}`}>
        {!anchorsUi.length ? (
          <p className="lap-empty">
            No word selections yet. Tip: <kbd>Cmd/Ctrl</kbd>+click a word in the
            tapestry or click a word above to see rhyming and alliteration
            matches here.
          </p>
        ) : (
          <div className="lap-rows">
            {anchorsUi.map(
              ({
                sel,
                label,
                autoLabel,
                matches,
                alliterations,
                matchCount,
                allitCount,
              }) => {
                const isOpen = !!openRows[sel.id];

                return (
                  <div
                    key={sel.id}
                    className={`lap-row-wrap ${
                      sel.active ? "" : "is-inactive"
                    }`}
                  >
                    <div className="lap-row">
                      {/* Left: color + editable name */}
                      <div className="lap-left">
                        <input
                          className="lap-dot"
                          type="color"
                          value={sel.color}
                          title="Change color"
                          onChange={(e) =>
                            setSelectionColor(sel.id, e.target.value)
                          }
                        />
                        <input
                          className="lap-name"
                          value={label}
                          placeholder={autoLabel}
                          onChange={(e) =>
                            updateSelection(sel.id, { label: e.target.value })
                          }
                          title="Rename anchor"
                        />
                      </div>

                      {/* Right: eye, counts, delete */}
                      <div className="lap-right">
                        <button
                          className="lap-icon"
                          onClick={() => toggleSelectionActive(sel.id)}
                          title={sel.active ? "Hide matches" : "Show matches"}
                        >
                          {sel.active ? "👁" : "🙈"}
                        </button>

                        {/* rhyme/exact count */}
                        <span
                          className={`lap-count ${isOpen ? "open" : ""}`}
                          onClick={() => toggleRowOpen(sel.id)}
                          title={isOpen ? "Hide matches" : "Show matches"}
                          role="button"
                          aria-expanded={isOpen}
                        >
                          {matchCount}
                        </span>

                        {/* alliteration count (read-only badge; details are in dropdown list too) */}
                        <span
                          className={`lap-count ${isOpen ? "open" : ""}`}
                          onClick={() => toggleRowOpen(sel.id)}
                          title={isOpen ? "Hide matches" : "Show matches"}
                          role="button"
                          aria-expanded={isOpen}
                        >
                          {allitCount}
                        </span>

                        <button
                          className="lap-icon danger"
                          onClick={() => removeSelection(sel.id)}
                          title="Remove anchor"
                        >
                          ✕
                        </button>
                      </div>
                    </div>

                    {/* Dropdown: both rhymes/exacts and alliterations */}
                    <div
                      className={`lap-row-drop ${
                        isOpen ? "is-open" : "is-closed"
                      }`}
                    >
                      {!matches.length && !alliterations.length ? (
                        <div className="lap-drop-empty">No matches yet.</div>
                      ) : (
                        <div style={{ display: "flex", gap: 8, padding: 4 }}>
                          {/* Rhymes/Exact */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="lap-drop-empty"
                              style={{ padding: "4px 6px" }}
                            >
                              Rhymes/Exact
                            </div>
                            <ul className="lap-drop-list">
                              {matches.map((m) => (
                                <li key={`${sel.id}-${m.id}`}>
                                  <button
                                    className="lap-drop-item"
                                    onClick={() =>
                                      m.time != null && seekAll(m.time)
                                    }
                                    title="Jump to word"
                                  >
                                    <span className="lap-drop-text">
                                      {m.text}
                                    </span>
                                    {Number.isFinite(m.time) && (
                                      <span className="lap-drop-time">
                                        {formatSeconds(m.time)}
                                      </span>
                                    )}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Alliteration */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              className="lap-drop-empty"
                              style={{ padding: "4px 6px" }}
                            >
                              Alliteration
                            </div>
                            <ul className="lap-drop-list">
                              {alliterations.map((m) => (
                                <li key={`${sel.id}-${m.id}`}>
                                  <button
                                    className="lap-drop-item"
                                    onClick={() =>
                                      m.time != null && seekAll(m.time)
                                    }
                                    title="Jump to word"
                                  >
                                    <span className="lap-drop-text">
                                      {m.text}
                                    </span>
                                    {Number.isFinite(m.time) && (
                                      <span className="lap-drop-time">
                                        {formatSeconds(m.time)}
                                      </span>
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
