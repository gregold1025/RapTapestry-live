import React, { useCallback, useRef } from "react";
import "./ui.css";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Vertical height slider: 0% = bottom of the lane, 100% = top.
 * knobs: [v] (single height) or [lo, hi] (band). onChange receives the same shape.
 * preview: optional ReactNode drawn in the right-hand lane preview box.
 */
export function VSlider({ knobs, onChange, label = "height", height = 92, preview, disabled }) {
  const trackRef = useRef(null);
  const dragging = useRef(-1);

  const pctFromEvent = useCallback((e) => {
    const el = trackRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const y = clamp(e.clientY - r.top, 0, r.height);
    return Math.round((1 - y / r.height) * 100);
  }, []);

  const onPointerDown = (i) => (e) => {
    if (disabled) return;
    dragging.current = i;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  };
  const onPointerMove = (e) => {
    const i = dragging.current;
    if (i < 0) return;
    if (!(e.buttons & 1)) { dragging.current = -1; return; }
    const p = pctFromEvent(e);
    const next = [...knobs];
    next[i] = p;
    if (next.length === 2) {
      // keep lo <= hi
      if (i === 0) next[0] = Math.min(next[0], next[1]);
      else next[1] = Math.max(next[1], next[0]);
    }
    onChange(next);
  };
  const onPointerUp = () => { dragging.current = -1; };

  const isBand = knobs.length === 2;
  const lo = isBand ? knobs[0] : knobs[0];
  const hi = isBand ? knobs[1] : knobs[0];

  return (
    <div className="ui-vslider" style={{ "--vs-h": `${height}px`, opacity: disabled ? 0.5 : 1 }}>
      <div className="ui-vslider-bound top" />
      <div className="ui-vslider-bound bottom" />
      <span className="ui-vslider-bound-label top">100%</span>
      <span className="ui-vslider-bound-label bottom">0%</span>
      <span className="ui-vslider-label">{label}</span>
      <div
        className="ui-vslider-track"
        ref={trackRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {isBand && (
          <div className="ui-vslider-fill" style={{ bottom: `${lo}%`, top: `${100 - hi}%` }} />
        )}
        {knobs.map((v, i) => (
          <div
            key={i}
            className="ui-vslider-knob"
            style={{ bottom: `${clamp(v, 0, 100)}%` }}
            onPointerDown={onPointerDown(i)}
            onLostPointerCapture={onPointerUp}
            role="slider"
            aria-valuenow={v}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={isBand ? (i === 0 ? `${label} low` : `${label} high`) : label}
            tabIndex={0}
            onKeyDown={(e) => {
              const d = e.key === "ArrowUp" ? 1 : e.key === "ArrowDown" ? -1 : 0;
              if (!d) return;
              e.preventDefault();
              const next = [...knobs];
              next[i] = clamp(next[i] + d * (e.shiftKey ? 10 : 1), 0, 100);
              if (isBand) { if (i === 0) next[0] = Math.min(next[0], next[1]); else next[1] = Math.max(next[1], next[0]); }
              onChange(next);
            }}
          >
            <span className="ui-vslider-knob-val">{Math.round(v)}%</span>
          </div>
        ))}
      </div>
      <div className="ui-vslider-preview">{preview}</div>
    </div>
  );
}
