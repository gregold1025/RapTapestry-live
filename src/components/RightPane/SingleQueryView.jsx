import React, { useMemo, useState } from "react";
import { useQueries } from "../../contexts/QueryContext";
import { useUIState } from "../../contexts/UIStateContext";
import { useAudioControls } from "../../contexts/AudioContext";
import { RHYME_TYPES, FORM_BY_KEY } from "../../engine";
import "./RightPane.css";

function fmtTime(t) {
  const s = Math.max(0, Math.floor(t));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** The focused query: its words and phones, the rhyme types it shows, and every match. */
export default function SingleQueryView() {
  const { focused, queries, matchesByQueryId, songModel, setTypes, setColor, remove } = useQueries();
  const { setRightView } = useUIState();
  const { seekAll } = useAudioControls();
  const [groupBy, setGroupBy] = useState("time"); // "time" | "type"

  const words = useMemo(() => (focused ? focused.anchorIds.map((id) => songModel?.byId.get(id)).filter(Boolean) : []), [focused, songModel]);
  const all = focused ? (matchesByQueryId.get(focused.id) ?? []).filter((m) => m.type !== "anchor") : [];
  const counts = useMemo(() => { const c = {}; for (const m of all) c[m.type] = (c[m.type] ?? 0) + 1; return c; }, [all]);
  const shown = focused ? all.filter((m) => focused.types.has(m.type)) : [];

  if (!focused) {
    return (
      <div className="rp-root">
        <div className="rp-head"><h3 className="rp-head-title">Query</h3>{queries.length > 0 && <button type="button" className="rp-link" onClick={() => setRightView("queries")}>all queries</button>}</div>
        <div className="rp-body"><div className="rp-empty">Click a word in the lyrics or on the tapestry to make it the query. Shift-click another word to extend it across words.</div></div>
      </div>
    );
  }

  const toggleType = (key) => {
    const next = new Set(focused.types);
    if (next.has(key)) next.delete(key); else next.add(key);
    setTypes(focused.id, [...next]);
  };

  const groups = groupBy === "type"
    ? RHYME_TYPES.filter((t) => focused.types.has(t.key)).map((t) => ({ key: t.key, label: t.label, items: shown.filter((m) => m.type === t.key) })).filter((g) => g.items.length)
    : [{ key: "all", label: null, items: [...shown].sort((a, b) => a.start - b.start) }];

  return (
    <div className="rp-root">
      <div className="rp-head">
        <h3 className="rp-head-title">{words.length > 1 ? "Multi-word query" : "Word query"}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="rp-link" onClick={() => setRightView("queries")} title="All queries">all queries</button>
          <button type="button" className="rp-link" onClick={() => remove(focused.id)} title="Remove this query">remove</button>
        </div>
      </div>
      <div className="rp-body">
        <div className="sq-anchor" style={{ borderLeftColor: focused.color }}>
          <input className="ui-color-swatch" type="color" value={focused.color} onChange={(e) => setColor(focused.id, e.target.value)} aria-label="Query color" title="Query color" />
          <div style={{ minWidth: 0 }}>
            <div className="sq-anchor-text">{words.map((w) => w.text).join(" ")}</div>
            <div className="sq-anchor-phones">{words.map((w) => w.phones).join("  |  ")}</div>
            <div className="ui-note">{words.length > 1 ? "Matched as one rime of several syllables." : "Shift-click a nearby word in the lyrics to extend the query across words."} {all.length} matches in the song.</div>
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
                title={`${m.type}${m.form !== "word" ? " " + FORM_BY_KEY[m.form]?.label.toLowerCase() : ""}${m.expected ? " (by expectation)" : ""} • click to seek`}
              >
                <span className="sq-match-text" style={m.form === "mosaic" ? { textDecoration: "underline dashed" } : m.form === "embedded" ? { textDecoration: "underline dotted" } : undefined}>{m.text}</span>
                <span className="sq-match-meta">{groupBy === "time" ? m.type : ""}{m.form !== "word" ? ` ${m.form}` : ""}{m.expected ? " · expected" : ""}</span>
                <span className="sq-match-time">{fmtTime(m.start)}</span>
              </button>
            ))}
          </div>
        ))}
        {shown.length === 0 && <div className="rp-empty" style={{ height: "auto" }}>No matches for the selected types.</div>}
      </div>
    </div>
  );
}
