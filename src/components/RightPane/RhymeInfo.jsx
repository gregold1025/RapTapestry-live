// src/components/RightPane/RhymeInfo.jsx
// The focused query's info button and its pop-up: what the rhyme types mean (rhymeTypesInfo.js).
// One block per type: its rule across the four axes, its definition, and its example pair, each
// word spelled out and then split phonetically onto the axes; what the type requires to agree is
// underlined in green in both spellings (Greg 2026-11-09).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INTRO, AXES, ROWS, ONE_SYLLABLE, TWO_SYLLABLES, TERMS, axisPhones, matchedAxes } from "./rhymeTypesInfo";

// the columns each section shows: one syllable only has the last two (Greg 2026-11-09)
const ONE_AXES = AXES.filter((a) => a.oneSyllable);

function TypeBlock({ row, axes, text, tint = false }) {
  const cls = tint ? "is-one" : undefined; // the one-syllable section is blue throughout
  const matched = new Set(matchedAxes(row));
  return (
    <tbody className="ri-type">
      <tr className="ri-rule ri-band">
        <th>{row.label}</th>
        {axes.map((a) => <td key={a.key} className={cls}>{row.cells[a.key]}</td>)}
      </tr>
      {text && <tr className="ri-def ri-band"><td colSpan={axes.length + 1}>{text}</td></tr>}
      {row.example.map((ex) => {
        const ph = axisPhones(ex.phones);
        return (
          <tr key={ex.word} className="ri-word">
            <th>{ex.spelling.map(([t, ...ax], i) => <span key={i} className={ax.some((k) => matched.has(k)) ? "ri-u" : undefined}>{t}</span>)}</th>
            {axes.map((a) => (
              <td key={a.key} className={cls}>
                {ph[a.key] ? <span className={matched.has(a.key) ? "ri-u" : undefined}>{ph[a.key]}</span> : <span className="ri-none">&mdash;</span>}
              </td>
            ))}
          </tr>
        );
      })}
    </tbody>
  );
}

/** A section's black column header. */
function ColHead({ title, axes, tint = false }) {
  return (
    <thead>
      <tr className="ri-colhead">
        <th>{title}</th>
        {axes.map((a) => <th key={a.key} className={tint ? "is-one" : undefined}>{a.label}{!tint && a.note && <span className="ri-note">{a.note}</span>}</th>)}
      </tr>
    </thead>
  );
}

/** The chart: the one-syllable section first, centered, on its two columns (in blue); then the
 *  two-syllable section on all four. Each opens with a short sentence. */
export function RhymeTable() {
  return (
    <>
      <div className="ri-one-wrap">
        <p className="ri-lead">{ONE_SYLLABLE.text}</p>
        <table className="ri-table ri-table-one">
          <ColHead title="One syllable" axes={ONE_AXES} tint />
          {ONE_SYLLABLE.rows.map((r) => <TypeBlock key={r.key} row={r} axes={ONE_AXES} tint />)}
        </table>
      </div>
      <p className="ri-lead">{TWO_SYLLABLES.text}</p>
      <table className="ri-table">
        <ColHead title="Two syllables" axes={AXES} />
        {ROWS.map((r) => <TypeBlock key={r.key} row={r} axes={AXES} text={r.text} />)}
      </table>
    </>
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
