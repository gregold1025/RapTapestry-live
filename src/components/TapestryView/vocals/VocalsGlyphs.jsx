import React from "react";
import { useParams } from "../../../contexts/ParamsContext";
import LineGlyphs from "./LineGlyphs";
import WordGlyphs from "./WordGlyphs";
import SyllableGlyphs from "./SyllableGlyphs";

export default function VocalsGlyphs({
  lyricTranscriptionData,
  timeToX,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { showVocals } = useParams();

  if (!showVocals) return null; // don't render if vocals are hidden

  return (
    <>
      <LineGlyphs
        transcriptionData={lyricTranscriptionData}
        timeToX={timeToX}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <WordGlyphs
        transcriptionData={lyricTranscriptionData}
        timeToX={timeToX}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
      <SyllableGlyphs
        transcriptionData={lyricTranscriptionData}
        timeToX={timeToX}
        onGlyphHoverEnter={onGlyphHoverEnter}
        onGlyphHoverLeave={onGlyphHoverLeave}
      />
    </>
  );
}
