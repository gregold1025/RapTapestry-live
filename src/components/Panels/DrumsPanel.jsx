import React, { useMemo, useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import { useDrumHitSets, useByClass } from "../../hooks/useDrumHits";
import { DRUM_CLASSES, DRUM_CLASS_LABELS } from "../../utils/drumClasses";
import { defaultGlyphFor, pickUnused } from "../../utils/drumGlyphDefaults";
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

/** One collapsible row per band or class: its own glyph (from the syllable glyph
 *  set; no two rows share one), size, opacity, height. */
function GroupRows({ rows, groups, setGroup, counts, open, toggle, p }) {
  const urls = p.glyphAssets.syllableGlyphUrls;
  // glyphUrl: a url, "none" (a circle), or null (the row's default)
  const urlOf = (key) => (groups[key]?.glyphUrl === "none" ? null : groups[key]?.glyphUrl ?? defaultGlyphFor(key, p.glyphAssets.syllableGlyphByName));
  return (
    <div className="pn-list">
      {rows.map((b) => {
        const g = groups[b.key];
        if (!g) return null;
        const url = urlOf(b.key);
        const taken = new Set(rows.filter((r) => r.key !== b.key).map((r) => urlOf(r.key)).filter(Boolean));
        return (
          <CollapsibleRow
            key={b.key}
            open={!!open[b.key]}
            onToggle={() => toggle(b.key)}
            title={b.label}
            meta={(counts[b.key] ?? 0).toLocaleString("en-US")}
            glyph={
              <GlyphPicker
                label={`${b.label} glyph`}
                urls={urls}
                nameOf={p.glyphAssets.glyphNameOf}
                value={url}
                taken={taken}
                allowNone
                onChange={(u) => setGroup(b.key, { glyphUrl: u ?? "none" })}
                onRandom={() => { const u = pickUnused(urls, taken); if (u) setGroup(b.key, { glyphUrl: u }); }}
              />
            }
            right={<EyeButton on={g.visible} onClick={() => setGroup(b.key, { visible: !g.visible })} />}
          >
            <div className="ui-row">
              <Slider label="size" value={g.size} min={2} max={40} step={1} unit=" px" onChange={(v) => setGroup(b.key, { size: v })} />
              <Slider label="opacity" value={Math.round(g.opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => setGroup(b.key, { opacity: v / 100 })} />
            </div>
            <VSlider
              knobs={[g.height]}
              onChange={([v]) => setGroup(b.key, { height: v })}
              preview={<GlyphRowPreview url={url} height={g.height} size={g.size} color={p.drumParams.fillColor} />}
            />
          </CollapsibleRow>
        );
      })}
    </div>
  );
}

export default function DrumsPanel() {
  const { drumClassesTranscription } = useSongData();
  const { onsets, named } = useDrumHitSets();
  const p = useParams();
  const [open, setOpen] = useState({ high: false, mid: true, low: false, snare: true });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const bandCounts = useMemo(() => {
    const c = { high: 0, mid: 0, low: 0 };
    for (const h of onsets) if (c[h.category] != null) c[h.category] += 1;
    return c;
  }, [onsets]);
  const classCounts = useMemo(() => {
    const c = {};
    for (const h of named) c[h.cls] = (c[h.cls] ?? 0) + 1;
    return c;
  }, [named]);
  const total = onsets.length;
  const hasClasses = !!drumClassesTranscription?.hits;
  const byClass = useByClass();

  return (
    <div className="pn-root">
      <StemHeader stem="drums" title="Drums" subtitle={`${total.toLocaleString("en-US")} onsets`} />

      <div className="pn-section">
        <ColorField label="Color" value={p.drumParams.fillColor} note="all glyphs"
          onChange={(c) => p.setDrumParams((d) => ({ ...d, fillColor: c }))} />
        <Slider label="tilt" value={p.drumParams.tilt ?? 0} min={-90} max={90} step={1} unit="°"
          onChange={(v) => p.setDrumParams((d) => ({ ...d, tilt: v }))} />
        <Slider label="opacity (all glyphs)" value={Math.round((p.drumParams.opacity ?? 1) * 100)} min={0} max={100} step={1} unit="%"
          onChange={(v) => p.setDrumParams((d) => ({ ...d, opacity: v / 100 }))} />
        <p className="ui-note">Each row below picks its own glyph from the syllable set; two rows never share one. D shuffles them.</p>
      </div>

      <div className="pn-section">
        <SectionLabel>Detection</SectionLabel>
        <Segmented
          value={byClass ? "classes" : "bands"}
          onChange={p.setDrumDetection}
          options={[
            { value: "bands", label: "Bands" },
            { value: "classes", label: "Classes", disabled: !hasClasses, title: hasClasses ? undefined : "No classifier output for this song" },
          ]}
        />
        {byClass ? (
          <>
            <p className="ui-note">The stem's onsets, each named by the drum classifier (ADTOF Frame_RNN on the summed stems) within 30 ms: one mark per class above threshold, so a snare and hi-hat struck together are both drawn. Raise the threshold to keep only confident names; the rest are unnamed.</p>
            <Slider label="threshold" value={Math.round(p.drumThreshold * 100)} min={30} max={300} step={5} unit="%" onChange={(v) => p.setDrumThreshold(v / 100)} />
          </>
        ) : (
          <p className="ui-note">Onsets in three frequency bands. One row per band.</p>
        )}
      </div>

      <div className="pn-section">
        <SectionLabel right="hits">{byClass ? "Classes" : "Bands"}</SectionLabel>
        {byClass ? (
          <GroupRows rows={DRUM_CLASSES.map((k) => ({ key: k, label: DRUM_CLASS_LABELS[k] }))} groups={p.drumClasses} setGroup={p.setDrumClass} counts={classCounts} open={open} toggle={toggle} p={p} />
        ) : (
          <GroupRows rows={BANDS} groups={p.drumBands} setGroup={p.setDrumBand} counts={bandCounts} open={open} toggle={toggle} p={p} />
        )}
      </div>
    </div>
  );
}
