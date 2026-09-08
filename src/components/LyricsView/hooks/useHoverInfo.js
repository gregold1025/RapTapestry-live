// src/components/LyricsView/hooks/useHoverInfo.js
import { useState, useCallback } from "react";

export function useHoverInfo() {
  const [hoverData, setHoverData] = useState(null);

  // useCallback: WordLine/WordBlock are React.memo'd, so these must keep a
  // stable identity across LyricsView re-renders or the memo never bites.
  const setWordHover = useCallback((word) => {
    const phones = word?.phones?.join(" ") || "";
    // console.log("🔤 Hovered Word:", word?.text);
    // console.log("📞 Phones:", phones);

    setHoverData({
      type: "word",
      text: word?.text,
      phones,
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
