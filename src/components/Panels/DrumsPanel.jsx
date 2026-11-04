import React, { useMemo, useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import StemHeader from "./StemHeader";
import { Segmented, Slider, VSlider, EyeButton, CollapsibleRow, GlyphPicker, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

const BANDS = [
  { key: "high", label: "High" },
  { key: "mid", label: "Mid" },
  { key: "low", label: "Low" },
];

function GlyphRowPreview({ url, height, size, color }) {
  const r = Math.max(2, Math.min(12, size / 2));
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      {[20, 50, 80].map((x) => (
        url ? (
          <image key={x} href={url} x={x - r} y={100 - height - r} width={r * 2} height={r * 2} preserveAspectRatio="xMidYMid meet" style={{ filter: "brightness(0)" }} />
        ) : (
          <circle key={x} cx={x} cy={100 - height} r={r} fill={color} />
        )
      ))}
    </svg>
  );
}

export default function DrumsPanel() {
  const { drumTranscription } = useSongData();
  const p = useParams();
  const [open, setOpen] = useState({ high: false, mid: true, low: false });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const counts = useMemo(() => {
    const c = { high: 0, mid: 0, low: 0 };
    for (const h of drumTranscription?.drum_hits ?? []) {
      if (c[h.category] != null) c[h.category] += 1;
    }
    return c;
  }, [drumTranscription]);
  const total = counts.high + counts.mid + counts.low;

  const glyphUrl = p.glyphStyle?.drumGlyphUrl ?? null;

  return (
    <div className="pn-root">
      <StemHeader stem="drums" title="Drums" subtitle={`${total.toLocaleString("en-US")} hits`} />

      <div className="pn-section">
        <ColorField label="Color" value={p.drumParams.fillColor} note="all bands"
          onChange={(c) => p.setDrumParams((d) => ({ ...d, fillColor: c }))} />
        <div className="ui-row">
          <Slider label="tilt" value={p.drumParams.tilt ?? 0} min={-90} max={90} step={1} unit="°"
            onChange={(v) => p.setDrumParams((d) => ({ ...d, tilt: v }))} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
            <span className="pn-field-label">glyph</span>
            <GlyphPicker
              label="drum glyph"
              urls={p.glyphAssets.drumGlyphUrls}
              value={glyphUrl}
              onChange={p.setDrumGlyphUrl}
              onRandom={p.randomizeDrumGlyph}
            />
          </div>
        </div>
      </div>

      <div className="pn-section">
        <SectionLabel>Detection</SectionLabel>
        <Segmented
          value={p.drumDetection}
          onChange={p.setDrumDetection}
          options={[
            { value: "bands", label: "Bands" },
            { value: "classes", label: "Classes", disabled: true, title: "Classifier (kick, snare, hi-hat, tom, cymbal): coming soon" },
          ]}
        />
        <p className="ui-note">Onsets in three frequency bands. One class per band.</p>
      </div>

      <div className="pn-section">
        <SectionLabel right="hits">Bands</SectionLabel>
        <div className="pn-list">
          {BANDS.map((b) => {
            const band = p.drumBands[b.key];
            return (
              <CollapsibleRow
                key={b.key}
                open={open[b.key]}
                onToggle={() => toggle(b.key)}
                title={b.label}
                meta={counts[b.key].toLocaleString("en-US")}
                glyph={
                  <GlyphPicker
                    label="drum glyph"
                    urls={p.glyphAssets.drumGlyphUrls}
                    value={glyphUrl}
                    onChange={p.setDrumGlyphUrl}
                    onRandom={p.randomizeDrumGlyph}
                  />
                }
                right={<EyeButton on={band.visible} onClick={() => p.setDrumBand(b.key, { visible: !band.visible })} />}
              >
                <div className="ui-row">
                  <Slider label="size" value={band.size} min={2} max={40} step={1} unit=" px" onChange={(v) => p.setDrumBand(b.key, { size: v })} />
                  <Slider label="opacity" value={Math.round(band.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => p.setDrumBand(b.key, { opacity: v / 100 })} />
                </div>
                <VSlider
                  knobs={[band.height]}
                  onChange={([v]) => p.setDrumBand(b.key, { height: v })}
                  preview={<GlyphRowPreview url={glyphUrl} height={band.height} size={band.size} color={p.drumParams.fillColor} />}
                />
              </CollapsibleRow>
            );
          })}
        </div>
      </div>
    </div>
  );
}
