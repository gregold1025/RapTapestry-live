import React, { useState } from "react";
import { useParams } from "../../contexts/ParamsContext";
import { useSongData } from "../../contexts/SongDataContext";
import StemHeader from "./StemHeader";
import { VocalsLanePreview } from "./LanePreview";
import { Segmented, Slider, VSlider, EyeButton, CollapsibleRow, GlyphPicker, ColorField, SectionLabel } from "../ui";
import "./Panels.css";

const BAND_DOTS = [[0.08, 0.1], [0.2, 0.9], [0.32, 0.4], [0.44, 1], [0.56, 0.6], [0.68, 0.2], [0.8, 0.75], [0.92, 0.35]];

/** Dots inside a band, or on one line (preview for the vertical slider). */
function DotsPreview({ lo, hi, color = "#1a1a1a" }) {
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      {BAND_DOTS.map(([fx, t], i) => {
        const pct = lo + (hi - lo) * t;
        return <circle key={i} cx={fx * 100} cy={100 - pct} r={3} fill={color} vectorEffect="non-scaling-stroke" />;
      })}
    </svg>
  );
}
function BarsPreview({ lo, hi, thickness = 6, color = "#1a1a1a" }) {
  const bars = [[6, 16, 0.3], [28, 22, 0.8], [56, 12, 0.1], [74, 20, 0.6]];
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      {bars.map(([x, w, t], i) => {
        const pct = lo + (hi - lo) * t;
        return <rect key={i} x={x} y={100 - pct - thickness / 2} width={w} height={thickness} rx={1} fill={color} />;
      })}
    </svg>
  );
}
function BandPreview({ lo, hi, color = "#9e9ea2" }) {
  return (
    <svg className="vs-prev" viewBox="0 0 100 100" preserveAspectRatio="none">
      <rect x={6} y={100 - hi} width={88} height={Math.max(1, hi - lo)} rx={2} fill={color} opacity={0.35} />
    </svg>
  );
}

function DefaultsRow({ color, onColor, opacity, onOpacity }) {
  return (
    <div className="pn-section">
      <SectionLabel>Defaults (unqueried)</SectionLabel>
      <div className="ui-row">
        <ColorField label="inactive color" value={color} onChange={onColor} />
      </div>
      <Slider label="inactive opacity" value={Math.round(opacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => onOpacity(v / 100)} />
    </div>
  );
}

export default function VocalsPanel() {
  const { lyricTranscription } = useSongData();
  const p = useParams();
  const [open, setOpen] = useState({ syllables: true, words: false, lines: false });
  const toggle = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const lines = lyricTranscription?.lines ?? [];
  const nWords = lines.reduce((a, l) => a + (l.words?.length ?? 0), 0);
  const nSyl = lines.reduce((a, l) => a + (l.words ?? []).reduce((b, w) => b + (w.nSyllables ?? 1), 0), 0);

  const sylPitched = p.syllableMode === "pitched";
  const wordPitched = p.wordMode !== "unpitched";

  return (
    <div className="pn-root">
      <StemHeader stem="vocals" title="Vocals" subtitle={`${lines.length} lines, ${nWords} words, ${nSyl} syllables`} />
      <VocalsLanePreview />

      <div className="pn-section">
        <SectionLabel right="colors come from queries">Layers</SectionLabel>
        <div className="pn-list">
          {/* ---------------- Syllables ---------------- */}
          <CollapsibleRow
            open={open.syllables}
            onToggle={() => toggle("syllables")}
            title="Syllables"
            meta={nSyl}
            glyph={
              <GlyphPicker
                label="syllable glyph"
                urls={p.glyphAssets.syllableGlyphUrls}
                value={p.glyphStyle?.syllableGlyphUrl ?? null}
                onChange={p.setSyllableGlyphUrl}
                onRandom={p.randomizeSyllableGlyph}
                allowNone
              />
            }
            right={<EyeButton on={p.showSyllables} onClick={() => p.setShowSyllables(!p.showSyllables)} />}
          >
            <div className="ui-row">
              <Slider label="size" value={p.syllableRadius} min={2} max={24} step={1} unit=" px" onChange={p.setSyllableRadius} />
              <Slider label="opacity" value={Math.round(p.syllableOpacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => p.setSyllableOpacity(v / 100)} />
            </div>
            <Segmented
              size="sm"
              value={p.syllableMode}
              onChange={p.setSyllableMode}
              options={[{ value: "unpitched", label: "unpitched" }, { value: "pitched", label: "pitched" }]}
            />
            {sylPitched ? (
              <VSlider
                knobs={[p.syllableBand.lo, p.syllableBand.hi]}
                onChange={([lo, hi]) => p.setSyllableBand({ lo, hi })}
                preview={<DotsPreview lo={p.syllableBand.lo} hi={p.syllableBand.hi} />}
              />
            ) : (
              <VSlider
                knobs={[p.syllableFixedHeight]}
                onChange={([v]) => p.setSyllableFixedHeight(v)}
                preview={<DotsPreview lo={p.syllableFixedHeight} hi={p.syllableFixedHeight} />}
              />
            )}
            <DefaultsRow
              color={p.inactiveSyllableColor} onColor={p.setInactiveSyllableColor}
              opacity={p.syllableInactiveOpacity} onOpacity={p.setSyllableInactiveOpacity}
            />
          </CollapsibleRow>

          {/* ---------------- Words ---------------- */}
          <CollapsibleRow
            open={open.words}
            onToggle={() => toggle("words")}
            title="Words"
            meta={nWords}
            glyph={<GlyphPicker staticGlyph={<svg width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="5" width="14" height="6" rx="1" fill="#9e9ea2" /></svg>} />}
            right={<EyeButton on={p.showWords} onClick={() => p.setShowWords(!p.showWords)} />}
          >
            <div className="ui-row">
              <Slider label="thickness" value={p.wordThicknessPx} min={1} max={40} step={1} unit=" px" onChange={p.setWordThicknessPx} />
              <Slider label="opacity" value={Math.round(p.wordOpacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => p.setWordOpacity(v / 100)} />
            </div>
            <Segmented
              size="sm"
              value={p.wordMode}
              onChange={p.setWordMode}
              options={[
                { value: "unpitched", label: "unpitched" },
                { value: "pitched", label: "pitched" },
                { value: "perSyllable", label: "per syllable" },
              ]}
            />
            {wordPitched ? (
              <VSlider
                knobs={[p.wordBand.lo, p.wordBand.hi]}
                onChange={([lo, hi]) => p.setWordBand({ lo, hi })}
                preview={<BarsPreview lo={p.wordBand.lo} hi={p.wordBand.hi} />}
              />
            ) : (
              <VSlider
                knobs={[p.wordCenter]}
                onChange={([v]) => p.setWordCenter(v)}
                preview={<BarsPreview lo={p.wordCenter} hi={p.wordCenter} />}
              />
            )}
            <p className="ui-note">
              Pitched: the rectangle sits at the first syllable. Per syllable: a curve through every syllable.
            </p>
            <DefaultsRow
              color={p.wordInactiveColor} onColor={p.setWordInactiveColor}
              opacity={p.wordInactiveOpacity} onOpacity={p.setWordInactiveOpacity}
            />
          </CollapsibleRow>

          {/* ---------------- Lines ---------------- */}
          <CollapsibleRow
            open={open.lines}
            onToggle={() => toggle("lines")}
            title="Lines"
            meta={lines.length}
            glyph={<GlyphPicker staticGlyph={<svg width="16" height="16" viewBox="0 0 16 16"><rect x="1" y="2.5" width="14" height="11" rx="1" fill="#c4c4c8" /></svg>} />}
            right={<EyeButton on={p.showLines} onClick={() => p.setShowLines(!p.showLines)} />}
          >
            <div className="ui-row">
              <Slider label="opacity" value={Math.round(p.lineOpacity * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => p.setLineOpacity(v / 100)} />
              <Slider label="drop shadow" value={Math.round(p.lineShadow * 100)} min={0} max={100} step={1} unit="%" onChange={(v) => p.setLineShadow(v / 100)} />
            </div>
            <VSlider
              knobs={[p.lineBand.lo, p.lineBand.hi]}
              onChange={([lo, hi]) => p.setLineBand({ lo, hi })}
              preview={<BandPreview lo={p.lineBand.lo} hi={p.lineBand.hi} />}
            />
            <label className="ui-toggle">
              <input type="checkbox" checked={!!p.showEndRhymes} onChange={(e) => p.setShowEndRhymes(e.target.checked)} />
              Show end-rhyme matches
            </label>
            <DefaultsRow
              color={p.lineInactiveColor} onColor={p.setLineInactiveColor}
              opacity={p.lineInactiveOpacity} onOpacity={p.setLineInactiveOpacity}
            />
          </CollapsibleRow>
        </div>
      </div>
    </div>
  );
}
