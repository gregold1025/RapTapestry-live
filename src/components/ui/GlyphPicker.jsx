import React, { useEffect, useRef, useState } from "react";
import "./ui.css";

function fileName(url) {
  if (!url) return "none";
  const base = String(url).split("/").pop() || "";
  return base.replace(/\.svg(\?.*)?$/, "").replace(/-[A-Za-z0-9_-]{8}$/, "");
}

/**
 * Current glyph as a 24px box; click opens a popover grid of every glyph url.
 * `allowNone` adds a "none" cell (value null). `onRandom` adds a shuffle button.
 */
export function GlyphPicker({ urls = [], value, onChange, onRandom, allowNone = false, label = "glyph", staticGlyph, taken, nameOf }) {
  const nameFor = (u) => (nameOf && nameOf(u)) || fileName(u);
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (staticGlyph) {
    return <span className="ui-glyph"><span className="ui-glyph-btn is-static" aria-hidden="true">{staticGlyph}</span></span>;
  }

  return (
    <span className="ui-glyph" ref={rootRef}>
      <button
        type="button"
        className="ui-glyph-btn"
        onClick={() => setOpen((v) => !v)}
        title={`${label}: ${nameFor(value)} (click to change)`}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {value ? <img className="ui-glyph-img" src={value} alt="" draggable={false} /> : <span style={{ fontSize: 9 }}>none</span>}
      </button>
      {open && (
        <div className="ui-glyph-pop" role="dialog" aria-label={`${label} picker`}>
          <div className="ui-glyph-pop-head">
            <span>{nameFor(value)}</span>
            {onRandom && (
              <button type="button" className="ui-ibtn" style={{ width: "auto", padding: "0 6px" }} onClick={onRandom} title="Random">
                random
              </button>
            )}
          </div>
          <div className="ui-glyph-grid">
            {allowNone && (
              <button type="button" className={`ui-glyph-cell is-none ${!value ? "is-active" : ""}`} onClick={() => { onChange(null); setOpen(false); }}>
                none
              </button>
            )}
            {urls.map((u) => (
              <button
                key={u}
                type="button"
                className={`ui-glyph-cell ${u === value ? "is-active" : ""} ${taken?.has(u) && u !== value ? "is-taken" : ""}`}
                disabled={!!taken?.has(u) && u !== value}
                onClick={() => { onChange(u); setOpen(false); }}
                title={taken?.has(u) && u !== value ? `${nameFor(u)} (used by another row)` : nameFor(u)}
              >
                <img src={u} alt="" draggable={false} />
              </button>
            ))}
          </div>
        </div>
      )}
    </span>
  );
}
