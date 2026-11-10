// src/components/RightPane/RhymeInfo.jsx
// The focused query's info button and its pop-up: what the rhyme types mean (rhymeTypesInfo.js).
// One block per type: its rule across the four axes, its definition, and its example pair, each
// word spelled out and then split phonetically onto the axes; what the type requires to agree is
// underlined in green in both spellings (Greg 2026-11-09).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INTRO, AXES, ROWS, ONE_SYLLABLE, TERMS, axisPhones, matchedAxes } from "./rhymeTypesInfo";

function TypeBlock({ row, text, tint = false }) {
  // the blue tint marks the one-syllable section's two columns only (Greg 2026-11-09)
  const one = (a) => (tint && a.oneSyllable ? "is-one" : undefined);
  const matched = new Set(matchedAxes(row));
  return (
    <tbody className="ri-type">
      <tr className="ri-rule ri-band">
        <th>{row.label}</th>
        {AXES.map((a) => <td key={a.key} className={one(a)}>{row.cells[a.key]}</td>)}
      </tr>
      {text && <tr className="ri-def ri-band"><td colSpan={AXES.length + 1}>{text}</td></tr>}
      {row.example.map((ex) => {
        const ph = axisPhones(ex.phones);
        return (
          <tr key={ex.word} className="ri-word">
            <th>{ex.spelling.map(([t, ...axes], i) => <span key={i} className={axes.some((k) => matched.has(k)) ? "ri-u" : undefined}>{t}</span>)}</th>
            {AXES.map((a) => (
              <td key={a.key} className={one(a)}>
                {ph[a.key] ? <span className={matched.has(a.key) ? "ri-u" : undefined}>{ph[a.key]}</span> : <span className="ri-none">&mdash;</span>}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

/** The chart: one block per two-syllable type, then the one-syllable section, its last two columns in blue. */
export function RhymeTable() {
  const cols = AXES.length + 1;
  return (
    <table className="ri-table">
      <thead>
        <tr>
          <th>Two syllables</th>
          {AXES.map((a) => <th key={a.key}>{a.label}{a.note && <span className="ri-note">{a.note}</span>}</th>)}
        </tr>
      </thead>
      {ROWS.map((r) => <TypeBlock key={r.key} row={r} text={r.text} />)}
      <tbody className="ri-type ri-one-section">
        <tr className="ri-section">
          <th>One syllable</th>
          <th />
          <th />
          <th colSpan={2} className="is-one ri-one-label">one-syllable words: only these two</th>
        </tr>
        <tr className="ri-def"><td colSpan={cols}>{ONE_SYLLABLE.text}</td></tr>
      </tbody>
      {ONE_SYLLABLE.rows.map((r) => <TypeBlock key={`one-${r.key}`} row={r} tint />)}
    </table>
  );
}

export default function RhymeInfo() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
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
            <p className="ri-intro">{INTRO} <span className="ri-u">Underlined</span>: what the type requires to agree.</p>

            <RhymeTable />

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
