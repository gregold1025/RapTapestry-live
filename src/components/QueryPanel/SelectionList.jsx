// src/components/QueryPanel/SelectionList.jsx
import React from "react";
import { useWordSelection } from "../../contexts/lyricsContexts/WordSelectionContext";
import { useLineSelection } from "../../contexts/lyricsContexts/LineSelectionContext";
import { useSyllableSelection } from "../../contexts/lyricsContexts/SyllableSelectionContext";
import { useSongData } from "../../contexts/SongDataContext";
import "./SelectionList.css";

export default function SelectionList() {
  const { lyricTranscription: transcriptionData } = useSongData();
  const {
    selections: wordSels,
    matchesBySelectionId: wordRhymes,
    alliterationBySelectionId,
    assonanceBySelectionId,
    focusedWordSelId,
    setFocusedWordSelId,
    removeSelection: removeWord,
    toggleSelectionActive: toggleWord,
    wordInteractionStamp,
  } = useWordSelection();

  const {
    selections: lineSels,
    matchesBySelectionId: lineRhymes,
    focusedLineSelId,
    setFocusedLineSelId,
    removeSelection: removeLine,
    toggleSelectionActive: toggleLine,
    lineInteractionStamp,
  } = useLineSelection();

  const {
    selections: sylSels,
    matchesBySelectionId: sylMatches,
    focusedSyllableSelId,
    setFocusedSyllableSelId,
    removeSelection: removeSyllable,
    toggleSelectionActive: toggleSyllable,
    syllableInteractionStamp,
  } = useSyllableSelection();

  const lines = transcriptionData?.lines ?? [];

  const hasWord = wordSels.some((s) => s.active);
  const hasLine = lineSels.some((s) => s.active);
  const hasSyl  = sylSels.some((s) => s.active);

  // 3-way dominant type via stamp comparison
  const typeStamps = [
    { type: "word",     stamp: hasWord ? wordInteractionStamp     : -1 },
    { type: "line",     stamp: hasLine ? lineInteractionStamp     : -1 },
    { type: "syllable", stamp: hasSyl  ? syllableInteractionStamp : -1 },
  ];
  const best = typeStamps.reduce((a, b) => (b.stamp > a.stamp ? b : a));
  const dominantType = best.stamp >= 0 ? best.type : null;

  // Merge and sort by createdAt descending (most recent first)
  const all = [
    ...wordSels.map((s) => ({ ...s, kind: "word" })),
    ...lineSels.map((s) => ({ ...s, kind: "line" })),
    ...sylSels.map((s)  => ({ ...s, kind: "syllable" })),
  ].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

  if (!all.length) return null;

  return (
    <div className="sel-list">
      {all.map((s) => {
        const isWord = s.kind === "word";
        const isLine = s.kind === "line";
        const isSyl  = s.kind === "syllable";

        const isFocused = isWord
          ? dominantType === "word"     && s.id === focusedWordSelId
          : isLine
          ? dominantType === "line"     && s.id === focusedLineSelId
          : dominantType === "syllable" && s.id === focusedSyllableSelId;

        // Label
        let label;
        if (s.label?.trim()) {
          label = s.label;
        } else if (isWord) {
          const [li, wi] = String(s.wordId).split("-").map(Number);
          label = lines[li]?.words?.[wi]?.text ?? s.wordId;
        } else if (isLine) {
          const text = lines[s.lineIdx]?.text ?? `Line ${s.lineIdx}`;
          label = "\u2026" + text.trim().slice(-16);
        } else {
          // syllable: vowel sequence
          label = (s.syllableIds ?? [])
            .map((id) => s.chosenById?.[id] ?? "?")
            .join(" \u00b7 ");
        }

        // Counts
        let counts = null;
        if (isWord) {
          const r = wordRhymes?.[s.id]?.size ?? 0;
          const a = alliterationBySelectionId?.[s.id]?.size ?? 0;
          const v = assonanceBySelectionId?.[s.id]?.size ?? 0;
          counts = (
            <span className="sel-counts">
              {r > 0 && <span className="sel-count sel-count--r" title="Rhymes">R:{r}</span>}
              {a > 0 && <span className="sel-count sel-count--a" title="Alliterations">A:{a}</span>}
              {v > 0 && <span className="sel-count sel-count--v" title="Assonances">V:{v}</span>}
            </span>
          );
        } else if (isLine) {
          const n = lineRhymes?.[s.id]?.size ?? 0;
          counts = n > 0 ? (
            <span className="sel-counts">
              <span className="sel-count sel-count--r" title="End rhymes">E:{n}</span>
            </span>
          ) : null;
        } else {
          const n = sylMatches?.[s.id]?.size ?? 0;
          counts = n > 0 ? (
            <span className="sel-counts">
              <span className="sel-count sel-count--s" title="Syllable matches">S:{n}</span>
            </span>
          ) : null;
        }

        const onToggle = isWord ? toggleWord : isLine ? toggleLine : toggleSyllable;
        const onRemove = isWord ? removeWord : isLine ? removeLine : removeSyllable;
        const onFocus  = isWord
          ? () => setFocusedWordSelId(s.id)
          : isLine
          ? () => setFocusedLineSelId(s.id)
          : () => setFocusedSyllableSelId(s.id);
        const kindLabel = isWord ? "W" : isLine ? "L" : "~";

        return (
          <div
            key={s.id}
            className={`sel-row ${isFocused ? "is-focused" : ""} ${!s.active ? "is-inactive" : ""}`}
            style={isFocused ? { borderLeftColor: s.color } : {}}
            onClick={onFocus}
          >
            <span className="sel-dot" style={{ background: s.color }} />
            <span className="sel-label" title={isWord ? "Word" : isLine ? "Line" : "Syllable"}>{label}</span>
            {counts}
            <span className="sel-kind">{kindLabel}</span>
            <button className="sel-btn"
              onClick={(e) => { e.stopPropagation(); onToggle(s.id); }}
              title={s.active ? "Hide" : "Show"}>
              {s.active ? "\uD83D\uDC41\uFE0E" : "\uD83D\uDE48"}
            </button>
            <button className="sel-btn sel-btn--danger"
              onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
              title="Remove">
              &times;
            </button>
          </div>
        );
      })}
    </div>
  );
}
