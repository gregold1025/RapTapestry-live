import { useMemo, useRef, useState } from "react";
import { usePlayheadSubscription } from "../../../contexts/AudioContext";
import { findCurrentIndex } from "../../../utils/findCurrentIndex";

/**
 * Subscribes to the playhead and exposes the CURRENT line index and word id.
 * setState fires only when the line index or word id actually changes
 * (~per-line / per-word granularity), not every frame.
 */
export function useCurrentPlayheadIds(lines) {
  // Precompute sorted boundary arrays once per song.
  const lineBounds = useMemo(() => {
    const starts = lines.map((l) => l?.start ?? l?.words?.[0]?.start ?? Infinity);
    const ends = lines.map(
      (l) => l?.end ?? l?.words?.[l.words.length - 1]?.end ?? -Infinity
    );
    return { starts, ends };
  }, [lines]);

  const wordBounds = useMemo(() => {
    const starts = [];
    const ends = [];
    const ids = [];
    lines.forEach((line, i) => {
      (line.words || []).forEach((w, j) => {
        if (typeof w.start === "number" && typeof w.end === "number") {
          starts.push(w.start);
          ends.push(w.end);
          ids.push(`${i}-${j}`);
        }
      });
    });
    return { starts, ends, ids };
  }, [lines]);

  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [currentWordId, setCurrentWordId] = useState(null);
  const lineRef = useRef(-1);
  const wordRef = useRef(null);

  const onTick = useMemo(
    () => (t) => {
      const li = findCurrentIndex(lineBounds.starts, lineBounds.ends, t);
      if (li !== lineRef.current) {
        lineRef.current = li;
        setCurrentLineIndex(li);
      }
      const wi = findCurrentIndex(wordBounds.starts, wordBounds.ends, t);
      const wid = wi === -1 ? null : wordBounds.ids[wi];
      if (wid !== wordRef.current) {
        wordRef.current = wid;
        setCurrentWordId(wid);
      }
    },
    [lineBounds, wordBounds]
  );

  usePlayheadSubscription(onTick);

  return { currentLineIndex, currentWordId };
}
