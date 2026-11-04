import React from "react";
import { useQueries } from "../../contexts/QueryContext";
import { useUIState } from "../../contexts/UIStateContext";
import { RHYME_TYPES } from "../../engine";
import { EyeButton } from "../ui";
import "./RightPane.css";

/** All queries, most recent first: color, anchor text, match counts per type, eye, remove. */
export default function QueryListView() {
  const { queries, focusedId, matchesByQueryId, songModel, focus, toggleActive, remove, clear } = useQueries();
  const { setRightView } = useUIState();

  const rows = [...queries].sort((a, b) => b.createdAt - a.createdAt);
  const anchorText = (q) => q.anchorIds.map((id) => songModel?.byId.get(id)?.text ?? id).join(" ");

  return (
    <div className="rp-root">
      <div className="rp-head">
        <h3 className="rp-head-title">Queries</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {queries.length > 0 && <button type="button" className="rp-link" onClick={clear} title="Remove every query">clear</button>}
          {focusedId && <button type="button" className="rp-link" onClick={() => setRightView("query")} title="Open the focused query">open focused</button>}
        </div>
      </div>
      <div className="rp-body">
        {rows.length === 0 ? (
          <div className="rp-empty">No queries yet. Click a word in the lyrics or on the tapestry; shift-click to extend it across words; click a line's square to query its last word.</div>
        ) : (
          <div className="ql-list">
            {rows.map((q) => {
              const ms = (matchesByQueryId.get(q.id) ?? []).filter((m) => m.type !== "anchor");
              const counts = {};
              for (const m of ms) counts[m.type] = (counts[m.type] ?? 0) + 1;
              const shown = ms.filter((m) => q.types.has(m.type)).length;
              return (
                <div
                  key={q.id}
                  className={`ql-row ${q.id === focusedId ? "is-focused" : ""} ${q.active ? "" : "is-inactive"}`}
                  style={q.id === focusedId ? { borderLeftColor: q.color } : undefined}
                  onClick={() => focus(q.id)}
                  onDoubleClick={() => { focus(q.id); setRightView("query"); }}
                  title="Click: focus • Double-click: open"
                >
                  <span className="ql-dot" style={{ background: q.color }} />
                  <span className="ql-text">{anchorText(q)}</span>
                  <span className="ql-counts" title={RHYME_TYPES.map((t) => `${t.label}: ${counts[t.key] ?? 0}`).join("\n")}>
                    {RHYME_TYPES.filter((t) => counts[t.key]).map((t) => (
                      <span key={t.key} className={`ql-count ${q.types.has(t.key) ? "" : "is-off"}`}>{t.label.slice(0, 3).toLowerCase()} {counts[t.key]}</span>
                    ))}
                    <span className="ql-total">{shown}</span>
                  </span>
                  <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", gap: 4 }}>
                    <EyeButton on={q.active} onClick={() => toggleActive(q.id)} />
                    <button type="button" className="ui-ibtn" onClick={() => remove(q.id)} title="Remove">&times;</button>
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
