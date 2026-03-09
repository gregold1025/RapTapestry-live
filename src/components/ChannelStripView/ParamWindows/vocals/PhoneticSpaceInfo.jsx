// src/components/ChannelStripView/ParamWindows/vocals/PhoneticSpaceInfo.jsx
//
// Inline info panel showing the vowel space model and threshold circle.
// Rendered beneath the End Rhyme toggle when its info button is active.

import React from 'react';
import {
  VOWEL_COORDS,
  CONSONANT_SIM,
  getThreshold,
} from '../../../../utils/phonemeSimilarity.js';

const PLOT = 148;
const PAD  = 26;
const SVG_W = PLOT + PAD * 2;
const SVG_H = PLOT + PAD * 2;

const LABEL_OFFSETS = {
  IY: [ 4, -6], IH: [ 4, -6], EY: [ 4, -6], EH: [ 4, -6],
  AE: [ 4,  9], AH: [-14,  9], AA: [ 4,  9], AO: [-18, -4],
  OW: [-18, -4], UH: [ 4, -6], UW: [-20, -5], ER: [ 4, -6],
  AY: [ 4, -6], AW: [ 4,  9], OY: [-22, -5],
};

const CONSONANT_PAIRS = [
  ['S',  'Z',  'voicing only'],
  ['P',  'B',  'voicing only'],
  ['S',  'SH', 'place only'],
  ['M',  'N',  'place only'],
  ['T',  'S',  'manner + sibilancy'],
];

/**
 * @param {number} strictness - rhyme strictness [0–1]
 * @param {object} vowelColors - ARPABET vowel → hex color map
 */
export function PhoneticSpaceInfo({ strictness, vowelColors }) {
  const threshold   = getThreshold(strictness, 'rhyme');
  const svgRadius   = (1 - threshold) * PLOT;

  const toSvgX = (x) => PAD + x * PLOT;
  const toSvgY = (y) => PAD + (1 - y) * PLOT;

  const cx = PAD + PLOT / 2;
  const cy = PAD + PLOT / 2;

  return (
    <div style={{
      background: '#0c1017', border: '1px solid #252b39',
      borderRadius: 8, padding: '0.75rem',
      display: 'flex', flexDirection: 'column', gap: '0.6rem',
    }}>

      <p style={{ margin: 0, fontSize: '0.78rem', color: '#a9b2c3', lineHeight: 1.5 }}>
        Vowels are positioned in acoustic space (F2 front/back × F1 high/low).
        The dashed circle shows which vowels fall within the current match radius
        from a central reference — highlighted vowels are considered "close enough" to rhyme.
      </p>

      <div>
        <div style={{ fontSize: '0.72rem', color: '#6a7590', marginBottom: 3 }}>
          Vowel space — current rhyme threshold: {(threshold * 100).toFixed(0)}%
        </div>
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} width={SVG_W} height={SVG_H}
          style={{ display: 'block', maxWidth: '100%' }}>

          <rect x={PAD} y={PAD} width={PLOT} height={PLOT} fill="none" stroke="#1e2533" strokeWidth="1" />
          <line x1={PAD} y1={PAD + PLOT / 2} x2={PAD + PLOT} y2={PAD + PLOT / 2} stroke="#1e2533" strokeWidth="0.5" />
          <line x1={PAD + PLOT / 2} y1={PAD} x2={PAD + PLOT / 2} y2={PAD + PLOT} stroke="#1e2533" strokeWidth="0.5" />

          <text x={PAD + PLOT / 2} y={PAD - 9} textAnchor="middle" fontSize="7.5" fill="#4a5568">
            ← back · front →
          </text>
          <text x={PAD - 10} y={PAD + PLOT / 2} textAnchor="middle" fontSize="7.5" fill="#4a5568"
            transform={`rotate(-90, ${PAD - 10}, ${PAD + PLOT / 2})`}>
            low · high
          </text>

          <circle cx={cx} cy={cy} r={Math.max(svgRadius, 1)}
            fill="rgba(100,163,255,0.05)" stroke="#6aa3ff" strokeWidth="1" strokeDasharray="5 3" />
          <circle cx={cx} cy={cy} r={2.5} fill="#6aa3ff" opacity={0.4} />

          {Object.entries(VOWEL_COORDS).map(([v, { x, y }]) => {
            const sx = toSvgX(x);
            const sy = toSvgY(y);
            const color = vowelColors?.[v] ?? '#cfd6e6';
            const [lx, ly] = LABEL_OFFSETS[v] ?? [4, -5];
            const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
            const inRange = dist <= svgRadius;
            return (
              <g key={v}>
                <circle cx={sx} cy={sy} r={inRange ? 5.5 : 4}
                  fill={color} opacity={inRange ? 0.95 : 0.28} />
                <text x={sx + lx} y={sy + ly} fontSize="7"
                  fill={inRange ? '#e9eef5' : '#3a4358'} fontFamily="monospace">
                  {v}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div>
        <div style={{ fontSize: '0.72rem', color: '#6a7590', marginBottom: 3 }}>
          Consonant similarity — pairs above the alliteration threshold light up
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #252b39' }}>
              {['Pair', 'Sim', 'Difference'].map((h) => (
                <th key={h} style={{
                  textAlign: h === 'Sim' ? 'center' : 'left',
                  color: '#4a5568', fontWeight: 'normal', padding: '2px 4px 4px',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CONSONANT_PAIRS.map(([a, b, desc]) => {
              const sim = CONSONANT_SIM[a]?.[b] ?? 0;
              return (
                <tr key={`${a}-${b}`} style={{ borderBottom: '1px solid #14181f' }}>
                  <td style={{ color: '#e9eef5', padding: '2px 4px', fontFamily: 'monospace' }}>{a} / {b}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace', color: '#6aa3ff', padding: '2px 4px' }}>
                    {sim.toFixed(2)}
                  </td>
                  <td style={{ color: '#6a7590', padding: '2px 4px' }}>{desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
