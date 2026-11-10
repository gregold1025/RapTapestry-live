// src/components/LyricsView/hooks/useHoverInfo.js
import { useState, useCallback, useRef } from "react";
import { phoneMarks } from "../../../utils/phoneMarks";

/** The phones the footer shows: the match's reading of the word when it is a match (Greg 2026-11-10:
 *  says ~ busyness used S IH1 Z), else the word's own. */
export const hoverPhones = (range, own) => range?.phones || own;

/** songModel (optional): the rhyme engine's words, whose phones the matches were made from. */
export function useHoverInfo(songModel = null) {
  const [hoverData, setHoverData] = useState(null);
  const modelRef = useRef(songModel);
  modelRef.current = songModel;

  // useCallback: WordLine/WordBlock are React.memo'd, so these must keep a
  // stable identity across LyricsView re-renders or the memo never bites.
  // range = { vi0, vi1, vowelOnly } when the word is a match: those phones are marked
  // (vowelOnly: syllables matched by assonance, only their vowel).
  const setWordHover = useCallback((word, match, range = null, wordId = null) => {
    const own = Array.isArray(word?.phones) ? word.phones[0] : String(word?.phones || "");
    const phones = hoverPhones(range, (wordId != null && modelRef.current?.byId?.get(wordId)?.phones) || own);
    // console.log("🔤 Hovered Word:", word?.text);
    // console.log("📞 Phones:", phones);

    setHoverData({
      type: "word",
      text: word?.text,
      phones,
      match: match || null,
      marks: range ? phoneMarks(phones, range.vi0, range.vi1, range.vowelOnly?.length ? new Set(range.vowelOnly) : null) : null,
    });
  }, []);

  const setSyllableHover = useCallback(({ vowel, syllableIndex, totalSyllables, phones }) => {
    // console.log("🟣 Hovered Syllable");
    // console.log("➡️ Vowel:", vowel);
    // console.log("📍 Syllable Index:", syllableIndex + 1, "of", totalSyllables);
    // console.log("📞 Word Phones:", phones);

    setHoverData({
      type: "syllable",
      vowel,
      syllableIndex,
      totalSyllables,
      phones,
    });
  }, []);

  const clearHover = useCallback(() => {
    setHoverData(null);
  }, []);

  return { hoverData, setWordHover, setSyllableHover, clearHover };
}
