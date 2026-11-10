// src/components/RightPane/RhymeInfo.jsx
// The focused query's info button and its pop-up: what the rhyme types mean (rhymeTypesInfo.js).
// One block per type: its rule across the four axes, its definition, and its example pair, each
// word spelled out and then split phonetically onto the axes; what the type requires to agree is
// underlined in green in both spellings (Greg 2026-11-09).
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { INTRO, AXES, ROWS, ONE_SYLLABLE, TWO_SYLLABLES, VOCAB, FA_NOTE, axisPhones, matchedAxes } from "./rhymeTypesInfo";

// the columns each section shows: one syllable only has the last two (Greg 2026-11-09)
const ONE_AXES = AXES.filter((a) => a.oneSyllable);

// the final vowel and final consonants (all a one-syllable word has) in faint blue, in both tables
const cls = (a) => (a.oneSyllable ? "is-one" : undefined);

/** One shorthand letter, in its color (S F A W X). */
const Code = ({ c }) => <span className={`ri-code ri-code-${c}`}>{c}</span>;

/** What an axis may be, as colored letters; FA (family and additive at once) is F and A joined. */
function Codes({ codes }) {
  return (
    <span className="ri-codes">
      {codes.map((c) => (c === "FA" ? <span key={c} className="ri-fa"><Code c="F" /><Code c="A" /></span> : <Code key={c} c={c} />))}
    </span>
  );
}

/** The shorthand's key, beside the one-syllable table (Greg 2026-11-09). */
function Vocabulary() {
  return (
    <aside className="ri-vocab" aria-label="Vocabulary">
      <h5>Vocabulary</h5>
      <dl>
        {VOCAB.map((v) => (
          <React.Fragment key={v.code}>
            <dt><Code c={v.code} /></dt>
            <dd><b>{v.label}</b>: {v.text}{v.example && <> <span className="ri-ex-inline">{v.example}</span></>}</dd>
          </React.Fragment>
        ))}
      </dl>
      <p className="ri-vocab-note"><span className="ri-fa"><Code c="F" /><Code c="A" /></span> {FA_NOTE.text} <span className="ri-ex-inline">{FA_NOTE.example}</span></p>
    </aside>
  );
}

function TypeBlock({ row, axes, text }) {
  const matched = new Set(matchedAxes(row));
  return (
    <tbody className="ri-type">
      <tr className="ri-rule ri-band">
        <th>{row.label}</th>
        {axes.map((a) => <td key={a.key} className={cls(a)}><Codes codes={row.cells[a.key]} /></td>)}
      </tr>
      {text && <tr className="ri-def ri-band"><td colSpan={axes.length + 1}>{text}</td></tr>}
      {row.example.map((ex) => {
        const ph = axisPhones(ex.phones);
        return (
          <tr key={ex.word} className="ri-word">
            <th>{ex.spelling.map(([t, ...ax], i) => <span key={i} className={ax.some((k) => matched.has(k)) ? "ri-u" : undefined}>{t}</span>)}</th>
            {axes.map((a) => (
              <td key={a.key} className={cls(a)}>
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
function ColHead({ title, axes }) {
  return (
    <thead>
      <tr className="ri-colhead">
        <th>{title}</th>
        {axes.map((a) => <th key={a.key} className={cls(a)}>{a.label}{a.note && <span className="ri-note">{a.note}</span>}</th>)}
      </tr>
    </thead>
  );
}

/** One section: its title, its sentence, then its table, flush right. */
function Section({ title, lead, children }) {
  return (
    <section className="ri-section">
      <h4 className="ri-section-title">{title}</h4>
      <p className="ri-lead">{lead}</p>
      {children}
    </section>
  );
}

/** The chart: the one-syllable section first, on its two columns (flush right, toward the
 *  two-syllable table's last two); then the
 *  two-syllable section on all four. The final vowel and final consonants are faint blue in both. */
export function RhymeTable() {
  return (
    <>
      <Section title="One syllable words" lead={ONE_SYLLABLE.text}>
        <div className="ri-one-row">
          <Vocabulary />
          <table className="ri-table ri-table-one">
            <ColHead title="One syllable" axes={ONE_AXES} />
            {ONE_SYLLABLE.rows.map((r) => <TypeBlock key={r.key} row={r} axes={ONE_AXES} />)}
          </table>
        </div>
      </Section>
      <Section title="Two syllable words" lead={TWO_SYLLABLES.text}>
        <table className="ri-table">
          <ColHead title="Two syllables" axes={AXES} />
          {ROWS.map((r) => <TypeBlock key={r.key} row={r} axes={AXES} text={r.text} />)}
        </table>
      </Section>
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

          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
