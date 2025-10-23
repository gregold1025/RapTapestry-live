import React, { useMemo, useState, useCallback } from "react";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import "./SelectionAnchors.css";

/**
 * LineAnchorsPanel
 * Displays and manages user-defined line anchors with auto-naming
 * based on the last 10 characters of each line in the transcription.
 */
export default function LineAnchorsPanel({ transcriptionData }) {
  const {
    selections,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    updateSelection,
    matchesBySelectionId,
  } = useLineSelection();

  const { seekAll } = useAudioEngine();
  const lines = transcriptionData?.lines ?? [];

  const [expanded, setExpanded] = useState(true);
  const [openRows, setOpenRows] = useState({}); // { [selectionId]: boolean }

  const toggleRowOpen = useCallback(
    (id) => setOpenRows((prev) => ({ ...prev, [id]: !prev[id] })),
    []
  );

  /** Build display data for all anchors */
  const anchorsUi = useMemo(() => {
    return (selections ?? []).map((s) => {
      const lineIdx = toNumber(s.lineIdx);
      const lineObj = lines[lineIdx];
      const lineText = lineObj?.text ?? "";
      const autoLabel = `…${getLineTail(lineText, 10)}`;

      const label = s.label?.trim()?.length > 0 ? s.label : autoLabel;

      const matchIds = normalizeToArray(matchesBySelectionId?.[s.id]);
      const matches = matchIds
        .map((i) => {
          const m = lines[toNumber(i)];
          if (!m) return null;
          return {
            idx: i,
            tail: getLineTail(m.text, 10) || "—",
            time: Number.isFinite(m.start) ? m.start : null,
          };
        })
        .filter(Boolean);

      return { sel: s, label, autoLabel, matches, matchCount: matches.length };
    });
  }, [selections, matchesBySelectionId, lines]);

  return (
    <div className="line-anchors-panel lap-section">
      {/* Section header */}
      <button
        className="lap-sec-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        title={expanded ? "Collapse" : "Expand"}
      >
        <span className="lap-sec-title">Line Anchors</span>
        <span className="lap-sec-spacer" />
        <span className={`lap-caret ${expanded ? "open" : ""}`}>▾</span>
        <span className="lap-count" style={{ marginLeft: 6 }}>
          {selections?.length ?? 0}
        </span>
      </button>

      {/* Collapsible body */}
      <div className={`lap-collapse ${expanded ? "is-open" : "is-closed"}`}>
        {!anchorsUi.length ? (
          <p className="lap-empty">
            No line anchors yet. Tip: <kbd>Cmd/Ctrl</kbd>+click a line in the
            tapestry or use the □ beside a line.
          </p>
        ) : (
          <div className="lap-rows">
            {anchorsUi.map(({ sel, label, autoLabel, matches, matchCount }) => {
              const isOpen = !!openRows[sel.id];

              return (
                <div
                  key={sel.id}
                  className={`lap-row-wrap ${sel.active ? "" : "is-inactive"}`}
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

                    {/* Right: eye, count, delete */}
                    <div className="lap-right">
                      <button
                        className="lap-icon"
                        onClick={() => toggleSelectionActive(sel.id)}
                        title={sel.active ? "Hide matches" : "Show matches"}
                      >
                        {sel.active ? "👁" : "🙈"}
                      </button>

                      <button
                        className={`lap-count ${isOpen ? "open" : ""}`}
                        onClick={() => toggleRowOpen(sel.id)}
                        aria-expanded={isOpen}
                        title={
                          isOpen
                            ? "Hide matched endings"
                            : "Show matched endings"
                        }
                      >
                        {matchCount}
                      </button>

                      <button
                        className="lap-icon danger"
                        onClick={() => removeSelection(sel.id)}
                        title="Remove anchor"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Dropdown matches */}
                  <div
                    className={`lap-row-drop ${
                      isOpen ? "is-open" : "is-closed"
                    }`}
                  >
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
                              <span className="lap-drop-text">…{m.tail}</span>
                              {Number.isFinite(m.time) && (
                                <span className="lap-drop-time">
                                  {formatSeconds(m.time)}
                                </span>
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
    .replace(/[.,!?;:'"”’…)\]]+$/u, "")
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
