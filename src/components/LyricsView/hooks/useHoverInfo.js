// src/components/LyricsView/hooks/useHoverInfo.js
import { useState } from "react";

export function useHoverInfo() {
  const [hoverData, setHoverData] = useState(null);

  function setWordHover(word) {
    const phones = word?.phones?.join(" ") || "";
    // console.log("🔤 Hovered Word:", word?.text);
    // console.log("📞 Phones:", phones);

    setHoverData({
      type: "word",
      text: word?.text,
      phones,
    });
  }

  function setSyllableHover({ vowel, syllableIndex, totalSyllables, phones }) {
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
  }

  function clearHover() {
    // console.log("❌ Hover cleared");
    setHoverData(null);
  }

  return { hoverData, setWordHover, setSyllableHover, clearHover };
}
