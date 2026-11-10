// src/components/RightPane/RhymeInfo.jsx
// The focused query's info button and its pop-up: what the rhyme types mean (rhymeTypesInfo.js).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INTRO, AXES, ROWS, ONE_SYLLABLE, DEFINITIONS, TERMS } from "./rhymeTypesInfo";

const pair = (ex) => ex.map(([w]) => w).join(" / ");

export default function RhymeInfo() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  const one = (a) => (a.oneSyllable ? " is-one" : "");
  return (
    <>
      <button type="button" className="ri-btn" onClick={() => setOpen(true)} title="What the rhyme types mean" aria-label="What the rhyme types mean" aria-haspopup="dialog">i</button>
      {open && createPortal(
        <div className="ri-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="ri-pop" role="dialog" aria-modal="true" aria-label="Rhyme types">
            <div className="ri-head">
              <h3>Rhyme types</h3>
              <button type="button" className="ri-close" onClick={() => setOpen(false)} title="Close (Esc)">&times;</button>
            </div>
            <p className="ri-intro">{INTRO}</p>

            <table className="ri-table">
              <thead>
                <tr className="ri-group">
                  <th />
                  <th colSpan={2} />
                  <th colSpan={2} className="is-one ri-one-label">one-syllable words: only these two</th>
                </tr>
                <tr>
                  <th>Two syllables</th>
                  {AXES.map((a) => <th key={a.key} className={one(a)}>{a.label}{a.note && <span className="ri-note">{a.note}</span>}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((r) => (
                  <tr key={r.key}>
                    <th>{r.label}<span className="ri-ex">{pair(r.example)}</span></th>
                    {AXES.map((a) => <td key={a.key} className={one(a)}>{r.cells[a.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="ri-one-text"><span className="ri-one-chip" />{ONE_SYLLABLE.text} ({ONE_SYLLABLE.rows.map((r) => `${r.key}: ${pair(r.example)}`).join("; ")}.)</p>

            <dl className="ri-defs">
              {DEFINITIONS.map((d) => <React.Fragment key={d.key}><dt>{d.label}</dt><dd>{d.text}</dd></React.Fragment>)}
            </dl>
            <dl className="ri-defs">
              {TERMS.map((t) => <React.Fragment key={t.key}><dt>{t.label}</dt><dd>{t.text} <span className="ri-ex-inline">{t.example}</span></dd></React.Fragment>)}
            </dl>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
