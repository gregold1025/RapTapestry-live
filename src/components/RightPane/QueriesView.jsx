// src/components/RightPane/QueriesView.jsx
// Every query in one view: the list (color, its words inside the line, counts
// per type, show / hide, remove) and, under it, the focused query opened up
// (phones, rhyme-type chips with counts, the matches; click a match to seek).
import React, { useMemo, useState } from "react";
import { useQueries } from "../../contexts/QueryContext";
import { useAudioControls } from "../../contexts/AudioContext";
import { RHYME_TYPES, FORM_BY_KEY } from "../../engine";
import { queryLabel } from "../../utils/queryLabel";
import { EyeButton } from "../ui";
import "./RightPane.css";

function fmtTime(t) {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

/** The query's name: its anchor in bold inside the surrounding line. */
export function QueryName({ q, song, chars = 40, className = "" }) {
  const l = useMemo(() => queryLabel(q, song, chars), [q, song, chars]);
  return (
    <span className={`ql-name ${className}`} title={`${l.before}${l.anchor}${l.after}`.replace(/…/g, "")}>
      {q.kind === "line" && <span className="ql-kind" title="Line query: matched by the end rhyme of the last word">line</span>}
      <span className="ql-ctx">{l.before}</span><b>{l.anchor}</b><span className="ql-ctx">{l.after}</span>
    </span>
  );
}

function countsOf(ms) {
  const c = {};
  for (const m of ms) if (m.type !== "anchor") c[m.type] = (c[m.type] ?? 0) + 1;
  return c;
}

export default function QueriesView() {
  const { queries, focusedId, focused, matchesByQueryId, songModel, focus, toggleActive, remove, clear, setTypes, setColor } = useQueries();
  const { seekAll } = useAudioControls();
  const [groupBy, setGroupBy] = useState("time");

  const rows = [...queries].sort((a, b) => b.createdAt - a.createdAt);
  const all = focused ? (matchesByQueryId.get(focused.id) ?? []).filter((m) => m.type !== "anchor") : [];
  const counts = useMemo(() => countsOf(all), [all]);
  const shown = focused ? all.filter((m) => focused.types.has(m.type)) : [];
  const words = useMemo(() => (focused ? focused.anchorIds.map((id) => songModel?.byId.get(id)).filter(Boolean) : []), [focused, songModel]);

  const toggleType = (key) => {
    const next = new Set(focused.types);
    if (next.has(key)) next.delete(key); else next.add(key);
    setTypes(focused.id, [...next]);
  };
  const groups = groupBy === "type"
    ? RHYME_TYPES.filter((t) => focused?.types.has(t.key)).map((t) => ({ key: t.key, label: t.label, items: shown.filter((m) => m.type === t.key) })).filter((g) => g.items.length)
    : [{ key: "all", label: null, items: [...shown].sort((a, b) => a.start - b.start) }];

  return (
    <div className="rp-root">
      <div className="rp-head">
        <h3 className="rp-head-title">Queries</h3>
        {queries.length > 0 && <button type="button" className="rp-link" onClick={clear} title="Remove every query">clear</button>}
      </div>

      <div className="ql-list" role="list">
        {rows.length === 0 && (
          <div className="rp-empty" style={{ height: "auto" }}>No queries yet. Click a word in the lyrics or on the tapestry; shift-click to extend it across words; click a line's square for a line query (end rhyme).</div>
        )}
        {rows.map((q) => {
          const ms = (matchesByQueryId.get(q.id) ?? []).filter((m) => m.type !== "anchor");
          const c = countsOf(ms);
          const n = ms.filter((m) => q.types.has(m.type)).length;
          return (
            <div
              key={q.id}
              role="listitem"
              className={`ql-row ${q.id === focusedId ? "is-focused" : ""} ${q.active ? "" : "is-inactive"}`}
              style={q.id === focusedId ? { borderLeftColor: q.color } : undefined}
              onClick={() => focus(q.id)}
              title="Click to open this query below"
            >
              <span className="ql-dot" style={{ background: q.color }} />
              <QueryName q={q} song={songModel} />
              <span className="ql-counts" title={RHYME_TYPES.map((t) => `${t.label}: ${c[t.key] ?? 0}`).join("\n")}>
                <span className="ql-total">{n}</span>
              </span>
              <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", gap: 4 }}>
                <EyeButton on={q.active} onClick={() => toggleActive(q.id)} />
                <button type="button" className="ui-ibtn" onClick={() => remove(q.id)} title="Remove">&times;</button>
              </span>
            </div>
          );
        })}
      </div>

      {focused && (
        <div className="rp-body sq-body">
          <div className="sq-anchor" style={{ borderLeftColor: focused.color }}>
            <input className="ui-color-swatch" type="color" value={focused.color} onChange={(e) => setColor(focused.id, e.target.value)} aria-label="Query color" title="Query color" />
            <div style={{ minWidth: 0 }}>
              <div className="sq-anchor-text"><QueryName q={focused} song={songModel} chars={60} /></div>
              <div className="sq-anchor-phones">{words.map((w) => w.phones).join("  |  ")}</div>
              <div className="ui-note">
                {focused.kind === "line" ? "Lines whose last word rhymes with this one." : words.length > 1 ? "Matched as one rime of several syllables." : "Shift-click a nearby word in the lyrics to extend the query across words."} {all.length} matches.
              </div>
            </div>
          </div>

          <div className="sq-types" role="group" aria-label="Rhyme types shown">
            {RHYME_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`rp-chip ${focused.types.has(t.key) ? "is-active" : ""}`}
                onClick={() => toggleType(t.key)}
                title={`${t.desc}\nExample: ${t.example}`}
                style={focused.types.has(t.key) ? { background: focused.color, borderColor: focused.color, color: "#1a1a1a" } : undefined}
              >
                {t.label} <b>{counts[t.key] ?? 0}</b>
              </button>
            ))}
          </div>

          <div className="sq-list-head">
            <span className="ui-section-label">Matches ({shown.length})</span>
            <span className="ui-seg ui-seg--sm" style={{ width: 120 }}>
              <button type="button" className={groupBy === "time" ? "is-active" : ""} onClick={() => setGroupBy("time")}>by time</button>
              <button type="button" className={groupBy === "type" ? "is-active" : ""} onClick={() => setGroupBy("type")}>by type</button>
            </span>
          </div>
          {groups.map((g) => (
            <div key={g.key} className="sq-group">
              {g.label && <div className="sq-group-label">{g.label}</div>}
              {g.items.map((m, i) => (
                <button
                  key={`${g.key}-${i}`}
                  type="button"
                  className="sq-match"
                  onClick={() => seekAll(m.start)}
                  title={`${m.type}${m.form && m.form !== "word" ? " " + (FORM_BY_KEY[m.form]?.label ?? m.form).toLowerCase() : ""}${m.expected ? " (by expectation)" : ""} • click to seek`}
                >
                  <span className="sq-match-text" style={m.form === "mosaic" ? { textDecoration: "underline dashed" } : m.form === "embedded" ? { textDecoration: "underline dotted" } : undefined}>
                    {focused.kind === "line" ? <LineText text={m.text} /> : m.text}
                  </span>
                  <span className="sq-match-meta">{groupBy === "time" ? m.type : ""}{m.form && m.form !== "word" ? ` ${m.form}` : ""}{m.expected ? " · expected" : ""}</span>
                  <span className="sq-match-time">{fmtTime(m.start)}</span>
                </button>
              ))}
            </div>
          ))}
          {shown.length === 0 && <div className="rp-empty" style={{ height: "auto" }}>No matches for the selected types.</div>}
        </div>
      )}
    </div>
  );
}

/** A matched line: its text with the last word (the rhyme) in bold. */
function LineText({ text }) {
  const i = text.lastIndexOf(" ");
  return i < 0 ? <b>{text}</b> : <><span className="ql-ctx">{text.slice(0, i + 1)}</span><b>{text.slice(i + 1)}</b></>;
}
