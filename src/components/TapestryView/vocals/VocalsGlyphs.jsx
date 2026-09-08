import React from "react";
import { useParams } from "../../../contexts/ParamsContext";
import LineGlyphs from "./LineGlyphs";
import WordGlyphs from "./WordGlyphs";
import SyllableGlyphs from "./SyllableGlyphs";
import TapestryLayer from "../TapestryLayer";

export default function VocalsGlyphs({
  lyricTranscriptionData,
  onGlyphHoverEnter,
  onGlyphHoverLeave,
}) {
  const { showVocals } = useParams();

  if (!showVocals) return null; // don't render if vocals are hidden

  // Each vocal layer is its own <svg> so selecting words/lines/syllables
  // only repaints that layer.
  return (
    <>
      <TapestryLayer name="lines">
        <LineGlyphs
          transcriptionData={lyricTranscriptionData}
          onGlyphHoverEnter={onGlyphHoverEnter}
          onGlyphHoverLeave={onGlyphHoverLeave}
        />
      </TapestryLayer>
      <TapestryLayer name="words">
        <WordGlyphs
          transcriptionData={lyricTranscriptionData}
          onGlyphHoverEnter={onGlyphHoverEnter}
          onGlyphHoverLeave={onGlyphHoverLeave}
        />
      </TapestryLayer>
      <TapestryLayer name="syllables">
        <SyllableGlyphs
          transcriptionData={lyricTranscriptionData}
          onGlyphHoverEnter={onGlyphHoverEnter}
          onGlyphHoverLeave={onGlyphHoverLeave}
        />
      </TapestryLayer>
    </>
  );
}
