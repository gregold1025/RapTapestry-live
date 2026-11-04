import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import StemHeader from "./StemHeader";
import { Segmented, Slider, VSlider, GlyphPicker, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

function NotesPreview({ lo, hi, color, topper }) {
  const notes = [[6, 16, 0], [26, 12, 5], [44, 22, 11], [72, 20, 7]];
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      {notes.map(([x, w, pc], i) => {
        const pct = lo + ((hi - lo) * pc) / 11;
        const y = 100 - pct;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={100 - y} fill={color} opacity={0.8} />
            {topper !== "none" && <rect x={x} y={y - 5} width={w} height={2} fill={color} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function BassPanel() {
  const { bassTranscription } = useSongData();
  const p = useParams();
  const bp = p.bassParams;
  const set = (patch) => p.setBassParams((prev) => ({ ...prev, ...patch }));
  const band = bp.band ?? { lo: 10, hi: 60 };
  const n = Array.isArray(bassTranscription) ? bassTranscription.length : 0;

  return (
    <div className="pn-root">
      <StemHeader stem="bass" title="Bass" subtitle={`${n.toLocaleString("en-US")} notes`} />

      <div className="pn-section">
        <ColorField label="Color" value={bp.fillColor} onChange={(c) => set({ fillColor: c })} />
      </div>

      <div className="pn-card">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <GlyphPicker
            label="topper"
            urls={p.glyphAssets.bassDividerUrls}
            value={p.glyphStyle?.bassDividerUrl ?? null}
            onChange={p.setBassDividerUrl}
            onRandom={p.randomizeBassDivider}
          />
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Notes</span>
          <span className="ui-crow-meta">{n.toLocaleString("en-US")}</span>
        </div>
        <div className="ui-row">
          <Slider label="opacity" value={Math.round(bp.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => set({ opacity: v / 100 })} />
          <Slider label="blur" value={bp.blur ?? 0} min={0} max={5} step={0.2} unit=" px" onChange={(v) => set({ blur: v })} format={(v) => `${v.toFixed(1)} px`} />
        </div>
        <div className="pn-field">
          <span className="pn-field-label">topper</span>
          <Segmented
            size="sm"
            value={bp.topper ?? "divider"}
            onChange={(v) => set({ topper: v })}
            options={[{ value: "none", label: "none" }, { value: "divider", label: "divider" }]}
          />
        </div>
        {bp.topper !== "none" && (
          <Slider label="topper gap" value={bp.rectHeight ?? 0} min={0} max={10} step={1} unit=" px" onChange={(v) => set({ rectHeight: v })} />
        )}
        <VSlider
          knobs={[band.lo, band.hi]}
          onChange={([lo, hi]) => set({ band: { lo, hi } })}
          preview={<NotesPreview lo={band.lo} hi={band.hi} color={bp.fillColor} topper={bp.topper ?? "divider"} />}
        />
        <p className="ui-note">Band = where pitch classes land, low (0) to high (11). Each note fills down to the lane bottom.</p>
      </div>
      <SectionLabel right="bass data is being reworked">provisional</SectionLabel>
    </div>
  );
}
