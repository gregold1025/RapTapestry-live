import React from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import StemHeader from "./StemHeader";
import { BassLanePreview } from "./LanePreview";
import { Segmented, Slider, VSlider, GlyphPicker, ColorField } from "../ui";
import "./Panels.css";

function NotesPreview({ lo, hi, color, topper }) {
  const notes = [[6, 18, 0, 0.1], [28, 14, 0.5, 0.5], [46, 22, 1, 0.8], [74, 20, 0.6, 0.6]];
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      {notes.map(([x, w, a, b], i) => {
        const y0 = 100 - (lo + (hi - lo) * a), y1 = 100 - (lo + (hi - lo) * b);
        return (
          <g key={i}>
            <path d={`M${x},${y0} C${x + w / 2},${y0} ${x + w / 2},${y1} ${x + w},${y1}`} stroke={color} strokeWidth={4} fill="none" />
            {topper !== "none" && <rect x={x} y={Math.min(y0, y1) - 7} width={w} height={2} fill={color} />}
            {topper !== "none" && <rect x={x} y={Math.max(y0, y1) + 5} width={w} height={2} fill={color} />}
          </g>
        );
      })}
    </svg>
  );
}

export default function BassPanel() {
  const { bassNotes, bassTranscription } = useSongData();
  const p = useParams();
  const bp = p.bassParams;
  const set = (patch) => p.setBassParams((prev) => ({ ...prev, ...patch }));
  const band = bp.band ?? { lo: 0, hi: 50 };
  const n = bassNotes?.length ?? (Array.isArray(bassTranscription) ? bassTranscription.length : 0);

  return (
    <div className="pn-root">
      <StemHeader stem="bass" title="Bass" subtitle={`${n.toLocaleString("en-US")} notes`} />
      <BassLanePreview />

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
          <Slider label="thickness" value={bp.thickness ?? 6} min={1} max={24} step={1} unit=" px" onChange={(v) => set({ thickness: v })} />
          <Slider label="opacity" value={Math.round(bp.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => set({ opacity: v / 100 })} />
        </div>
        <div className="ui-row">
          <Slider label="blur" value={bp.blur ?? 0} min={0} max={5} step={0.2} unit=" px" onChange={(v) => set({ blur: v })} format={(v) => `${v.toFixed(1)} px`} />
          <div className="pn-field" style={{ flex: 1 }}>
            <span className="pn-field-label">ends</span>
            <Segmented size="sm" value={bp.caps ?? "butt"} onChange={(v) => set({ caps: v })} options={[{ value: "butt", label: "straight" }, { value: "round", label: "round" }]} />
          </div>
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
          <Slider label="topper gap" value={bp.rectHeight ?? 0} min={0} max={16} step={1} unit=" px" onChange={(v) => set({ rectHeight: v })} />
        )}
        <VSlider
          knobs={[band.lo, band.hi]}
          onChange={([lo, hi]) => set({ band: { lo, hi } })}
          preview={<NotesPreview lo={band.lo} hi={band.hi} color={bp.fillColor} topper={bp.topper ?? "divider"} />}
        />
        <p className="ui-note">Each note is a line through its pitch (pYIN contour, experiments/bass-01). Band = where the song's lowest to highest notes land; default the bottom half of the lane. Toppers sit above and below each note, a gap away.</p>
      </div>
    </div>
  );
}
