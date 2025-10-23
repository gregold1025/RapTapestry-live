import React, { useMemo, useState, useCallback } from "react";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useAudioEngine } from "../../contexts/AudioContext";
import "./SelectionAnchors.css";

/**
 * Props:
 *  - transcriptionData: { lines: Array<{ text?: string, words?: {text?: string}[], start?: number }> }
 */
export default function LineAnchorsPanel({ transcriptionData }) {
  const {
    selections,
    removeSelection,
    toggleSelectionActive,
    setSelectionColor,
    updateSelection,
    matchesBySelectionId, // selectionId -> Set(lineIdx) | number[] | object
  } = useLineSelection();

  const lines = transcriptionData?.lines ?? [];
  const { seekAll } = useAudioEngine();

  const [expanded, setExpanded] = useState(true);
  const [openRows, setOpenRows] = useState({}); // { [selectionId]: boolean }

  const toggleRowOpen = useCallback((id) => {
    setOpenRows((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const anchorsUi = useMemo(() => {
    return (selections ?? []).map((s) => {
      const idx = toIndex(s.lineIdx);
      const line = lines?.[idx]?.text ?? ""; // ← `line` is now the text string
      const truncLine = line.slice(-10);
      //   console.log("LINE", truncLine);

      // Auto label: last 10 chars of line text
      const tail = getLineEndTail(line, 10);
      const autoLabel = "…" + truncLine;

      // Fallback to auto label when label empty/whitespace
      const label =
        typeof s.label === "string" && s.label.trim().length > 0
          ? s.label
          : autoLabel;

      // Build matches for this selection (each also shows …tail)
      const ids = toMatchIdxArray((matchesBySelectionId ?? {})[s.id]);
      const matches = ids
        .map((mIdx) => {
          const mLine = lines[toIndex(mIdx)];
          if (!mLine) return null;
          return {
            lineIdx: toIndex(mIdx),
            tail: getLineEndTail(mLine, 10) || "—",
            time: Number.isFinite(mLine.start) ? mLine.start : null,
          };
        })
        .filter(Boolean);

      return { sel: s, autoLabel, label, matches, matchCount: matches.length };
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
        <span className="lap-sec-title">Line Anchors</span>
        <span className="lap-sec-spacer" />
        <span className={`lap-caret ${expanded ? "open" : ""}`}>▾</span>
        <span className="lap-count" style={{ marginLeft: 6 }}>
          {selections?.length ?? 0}
        </span>
      </button>

      <div className={`lap-collapse ${expanded ? "is-open" : "is-closed"}`}>
        {(anchorsUi?.length ?? 0) === 0 ? (
          <p className="lap-empty">
            No line anchors yet. Tip: <kbd>Cmd/Ctrl</kbd>+click a line in the
            tapestry.
          </p>
        ) : (
          <div className="lap-rows">
            {anchorsUi.map(({ sel, label, autoLabel, matches, matchCount }) => {
              const nameValue = label || autoLabel;
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
                        value={nameValue}
                        placeholder={autoLabel}
                        onChange={(e) =>
                          updateSelection(sel.id, { label: e.target.value })
                        }
                        title="Rename anchor"
                      />
                    </div>

                    {/* Right: eye, COUNT badge (toggles dropdown), delete */}
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

                  {/* Per-row dropdown: list “…tail” for each match; clicking seeks */}
                  <div
                    className={`lap-row-drop ${
                      isOpen ? "is-open" : "is-closed"
                    }`}
                  >
                    {matches.length === 0 ? (
                      <div className="lap-drop-empty">No matches yet.</div>
                    ) : (
                      <ul className="lap-drop-list">
                        {matches.map((m) => (
                          <li key={`${sel.id}-${m.lineIdx}`}>
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

/* ----------------- helpers ----------------- */

// Accept numbers or numeric strings; return number or null
function toIndex(v) {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : null;
}

// Auto-label helper: last n chars of line.text; robust fallbacks.
function getLineEndTail(line, n = 10) {
  // Prefer line.text; fallback to joined words[].text
  let raw = (line?.text ?? "").replace(/\s+$/u, ""); // strip trailing WS/newlines
  console.log(raw);
  if (!raw && Array.isArray(line?.words)) {
    raw = line.words
      .map((w) => w?.text ?? "")
      .join("")
      .replace(/\s+$/u, "");
  }
  if (!raw) return "";
  const stripped = raw.replace(/[.,!?;:'"”’…)\]]+$/u, ""); // strip trailing punctuation
  return stripped.slice(-n);
}

// Normalize various set-like structures into an array of numeric indices
function toMatchIdxArray(matchSetLike) {
  if (!matchSetLike) return [];
  if (matchSetLike instanceof Set) return Array.from(matchSetLike);
  if (Array.isArray(matchSetLike)) return matchSetLike;
  return Object.keys(matchSetLike)
    .map((k) => Number(k))
    .filter((x) => Number.isFinite(x));
}

function formatSeconds(t) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m ? `${m}:${r.toString().padStart(2, "0")}` : `${r}s`;
}
